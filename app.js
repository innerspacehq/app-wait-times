var express = require('express');
var app = express();
var request = require("request");
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var clientId = process.env.AUTH0_CLIENT_ID;
var clientSecret = process.env.AUTH0_CLIENT_SECRET;

var clientInfo = '{"client_id": "' + clientId + '", "client_secret": "' + clientSecret + '", "identifier": "string"}';

app.get('/', function (req, res, next) {
    var queryParams = Object.keys(req.query)[0] || "";
    res.redirect("/wait-times?" + queryParams)
});

app.get('/wait-times', function (req, res, next) {
    // Make request through public API to get Access Token
    console.log("Hit /wait-times");
    console.log(clientId);
    console.log(clientSecret);

    // Pull API server to use from query params
    var _urlParams = parseQueryParams(Object.keys(req.query)[0].split("/"));
    var apiUrl = "https://" + _urlParams["api"] + ".innerspace.io/v1/auth/getAccessToken";

    var options = {
        method: 'POST',
        url: apiUrl,
        headers: { 'content-type': 'application/json' },
        body: clientInfo
    };

    // Fetch access token using Auth0 client ID and secret
    request(options, function (error, response, body) {
        var jsonBody = {};

        if (!error) {
            jsonBody = JSON.parse(body);
        }

        // Check that the access token was retrieved successfully
        if (jsonBody.access_token) {
            res.cookie('access_token', jsonBody.access_token);
            console.log(jsonBody.access_token);
            next();
        } else {
            // TODO: Pass error to wait-times widget to handle more gracefully or serve static error page here
            res.status(400);
            res.send('Failed to retrieve access token');
        }
    });
});

// The query parameters should be in the following format (key/value/key/value)
// e.g /site/201/zones/54,55,56,57/api/b01-api/ideals/3,5,10
var parseQueryParams = function (rawParams) {
    var urlParams = {};

    for (var i = 1; i < rawParams.length; i++) {
        if (rawParams[i].length == 0) continue;
        var key = rawParams[i].toLowerCase();
        var val = rawParams[i + 1];
        urlParams[key] = val;

        // Url params are in the form of key/value/key/value e.g /site/1/tag/123
        // So we increment i again in order to skip the value and move on to the next key
        i++;
    }
    return urlParams;
}

app.use('/wait-times/', express.static(__dirname + "/src"));

app.listen(10337);
console.log("Wait-Times-UI server running on port 10337.");