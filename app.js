var express = require('express');
var app = express();
var request = require("request");
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var clientId = process.env.AUTH0_CLIENT_ID;
var clientSecret = process.env.AUTH0_CLIENT_SECRET;

var _clientInfo = '{"client_id": "' + clientId + '", "client_secret": "' + clientSecret + '", "identifier": "string"}';

app.get('/', function (req, res, next) {
    var queryParams = Object.keys(req.query)[0] || "";
    res.redirect("/wait-times?" + queryParams)
});

app.get('/wait-times/cafe25', function (req, res, next) {
    console.log("Hit /wait-times/cafe25");

    // Strip out trailing slash if necessary
    if (req.url.endsWith('/')) {
        return res.redirect(301, req.url.slice(0, -1))
    }

    fetchAccessToken(function (accessToken) {
        if (!accessToken) {
            console.log('Failed to retrieve access token');
        }

        res.cookie('access_token', accessToken);
        res.cookie('site_id', '205');
        res.cookie('zone_ids', '70,71,74,79,80,81');
        res.cookie('ideals', '5,5,5,5,5,5');
        res.cookie('api', 'b01-api');

        res.sendFile(__dirname + "/src/index.html");
    });
});

app.get('/wait-times', function (req, res, next) {
    // Make request through public API to get Access Token
    console.log("Hit /wait-times");

    fetchAccessToken(function (accessToken) {
        if (!accessToken) {
            console.log('Failed to retrieve access token');
        }
        res.cookie('access_token', accessToken);
        next();
    });
});

// Use the Auth0 client ID and client secret to fetch an access token
var fetchAccessToken = function (callback) {

    var apiUrl = "https://b01-api.innerspace.io/v1/auth/getAccessToken";

    var options = {
        method: 'POST',
        url: apiUrl,
        headers: { 'content-type': 'application/json' },
        body: _clientInfo
    };

    // Fetch access token using Auth0 client ID and secret
    request(options, function (error, res, body) {
        var jsonBody = {};

        if (!error) {
            jsonBody = JSON.parse(body);
        }

        // Check that the access token was retrieved successfully
        if (jsonBody.access_token) {
            callback(jsonBody.access_token);
        } else {
            console.log('Failed to get access token');
            console.log('Error: ', error);
            if (res) {
                console.log('Repsonse: ', res.statusCode, body);
            }
            callback(null);
        }
    });
}


app.use('/wait-times', express.static(__dirname + "/src"));

app.listen(10337);
console.log("Wait-Times-UI server running on port 10337.");
