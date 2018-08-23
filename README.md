# Wait Times Widget

This is an example application that displays the current wait times for a space, built on top of InnerSpace's public API.


To get this example app up and running you will need a `clientId` and `clientSecret` provided to you by [InnerSpace](https://innerspace.io)


There are two components to this example application:

* An HTML page that uses an `AccessToken` to request the current wait times from InnerSpace's public API.

* A [NodeJS](https://nodejs.org) application (`app.js`) that:
    * connects to InnerSpace's API using your provided `clientId` and `clientSecret` and grants the app an `AccessToken` to be saved in your browser's cookies
    * hosts a webserver for the HTML page

Both of these components are wrapped together in a Docker container so running them is simple:

### Getting the application running

Using `docker-compose`:
```
  wait-times-widget:
    build: .
    container_name: wait-times-widget
    environment:
      AUTH0_CLIENT_ID: <YOUR_CLIENT_ID_HERE>
      AUTH0_CLIENT_SECRET: <YOUR_CLIENT_SECRET_HERE>
    ports:
      - 0.0.0.0:10377:10337
```

Running the container manually:

```
docker build -t wait-times-widget .

docker run -d \
    -e AUTH0_CLIENT_ID=<YOUR_CLIENT_ID_HERE> \
    -e AUTH0_CLIENT_SECRET=<YOUR_CLIENT_SECRET_HERE> \
    -p 0.0.0.0:10337:10337 \
    --name wait-times-widget \
    wait-times-widget
```

_Note:_
It is possible to run the application manually without using Docker, by using the `start-server.sh` script (which requires [NodeJS to be installed](https://nodejs.org/en/download/) and to set the `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET` environment variables) , but the Docker methods above are the recommended way.

### Using the application
Once the application is up and running a web server will be hosted on port `10337` and you can hit from your browser at  `http://<YOUR_DOCKER_HOST_IP>:10337/wait-times/`
* Note: If you are unsure of the IP of your Docker host you can find it by running the following command: `docker-machine ip`

The application uses query parameters in the following format to determine which site and zones to display wait times for:
`http://<YOUR_DOCKER_HOST_IP>:10337/wait-times/?/site/<YOUR_SITE_ID>/zones/<ZONE_ID_1>,<ZONE_ID_2>.../api/b01-api/ideals/<IDEAL_FOR_ZONE_1>,<IDEAL_FOR_ZONE_2>...`

Query Parameters:
* `<YOUR_SITE_ID>` = The ID of your InnerSpace site  (this should be provided to you by InnerSpace)
* `<ZONE_ID_X>` = The ID of the zone you wish you to display wait times for. This is a comma delimited list.
* `<IDEAL_FOR_ZONE_X>` = The ideal time range for wait-times to be bucketed by. This is a comma delimited list.

The ideals are used to generate ranges of time for the wait-times to be bucketed by. They are calculated in the following format (where `X` is the ideal):
 
 ```
  1) 0 - X minutes
  2) X - (X * 2) minutes
  3) (X * 2)+ minutes
 ```
 
 As an example, an ideal of `5` would result in the following ranges:
 * 0 - 5 minutes
 * 5 - 10 minutes
 * 10+ minutes

An example of the url with all of the query parameters in place would look like this:
`http://<YOUR_DOCKER_HOST_IP>:10337/wait-times/?/site/123/zones/100,101,102/api/b01-api/ideals/5,5,3`
