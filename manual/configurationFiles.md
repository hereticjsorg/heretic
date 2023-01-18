# Configuration Files

There are several configuration files available so you may adjust many parameters related to your website.

## etc/system.js

This configuration file contains main options related to your web server (IP, ports, logging etc.).

| Option | Description | Default Value |
|--------|-------------|---------------|
| id | Unique website ID | "heretic" |
| secret | Secret key used for internal security purposes | secure.secret |
| server/ip | IP address where Fastify is listening to | "127.0.0.1" |
| server/port | Port on which Fastify is listening to | 3001 |
| server/static | Serve static content using internal server (disable for production) | true |
| server/trustProxy | Trust proxy for IP address | true |
| server/ignoreTrailingSlash | Ignore trailing slashes for routing | true |
| auth/admin | Enable Admin Panel | true |
| auth/signIn | Enable website authorization | true |
| auth/signUp | Enable website sign up procedure | false |
| mongo/enabled | Enable MongoDB access | true |
| mongo/url | MongoDB URL | "mongodb://127.0.0.1:27017" |
| mongo/dbName | MongoDB database name | "heretic" |
| mongo/options | Connection options for MongoDB | { ip: "127.0.0.1", port: 3001, static: true, trustProxy: true, ignoreTrailingSlash: true } |
| redis/enabled | Enable Redis connection | false |
| redis/host | Redis host or IP address | "127.0.0.1" |
| redis/port | Redis port | 6379 |
| webSockets/enabled | Enable Websocket support | false |
| webSockets/url | Websocket URL for frontend connections | "ws://127.0.0.1:3001/ws" |
| webSockets/options | Websocket options | { maxPayload: 1048576 } |
| token/expiresIn | Token expiration value | "7 days" |
| token/ip | Bind token to client IP address | false |
| cookieOptions/expires | Cookie expiration time (seconds) | 604800 |
| cookieOptions/path | Cookie path | "/" |
| cookieOptions/domain | Cookie domain | "" |
| cookieOptions/secure | Cookie security | null |
| cookieOptions/sameSite | Cookie "same site" property | null |
| log/level | Log-level ('fatal', 'error', 'warn', 'info',
'debug', 'trace' or 'silent') | "info" |
| rateLimit/enabled | Enable rate limiting | false |
| rateLimit/ban | Ban on rate limit violations | false |
| rateLimit/global | Global rate limiting for all routes | { max: 100, ban: 1000, timeWindow: 10000 } |
| rateLimit/whiteList | White list | [] |
| rateLimit/blackList | Black list | [] |
| rateLimit/addHeaders | A list of extra headers | {} |
| directories/tmp | Directory for temporary files, use system directory when null  | null |
| directories/files | Directory used to save files | "files" |
| collections/users | MongoDB collection to store users | "users" |
| collections/files | MongoDB collection to store files | "files" |
| collections/counters | MongoDB collection to store counters | "counters" |
| collections/history | MongoDB collection to store history data | "history" |
| collections/groups | MongoDB collection to store groups | "groups" |
| collections/events | MongoDB collection to store events | "events" |
| collections/geoNetworks | MongoDB collection to store geolocation network data | "geoNetworks" |
| collections/geoCountries | MongoDB collection to store geolocation countries data | "geoCountries" |
| collections/geoCities | MongoDB collection to store geolocation cities data | "geoCities" |
| routes/admin | Route URL for admin panel | "/admin" |
| routes/signInAdmin | Route URL for sign in form (admin panel) | "/admin/signIn" |
| routes/signIn | Route URL for sign in form (userspace) | "/signIn" |
| routes/signOutAdmin | Route URL for sign out form (admin panel) | "/admin/signOut" |
| routes/signOut | Route URL for sign out form | "/signOut" |
| buildOptions/productionCompress | Perform GZ compression when building in production mode | false |
| test/headless | Use headless mode for UI tests | true |
| test/executablePath | Chrome/Chromium executable path, "auto" = autodetect | "auto" |
| test/args | Chrome/Chromium arguments | "--window-size=1920,1080,--no-sandbox" |
| test/defaultViewport | defaultViewport value | null |
| test/devtools | Open DevTools in browser window | true |

## etc/website.js

This configuration file describes the meta data of your website which is used system-wide.

| Option      | Description                                                                     |
|-------------|---------------------------------------------------------------------------------|
| url         | Site URL starting with http or https                                            |

Returns the object which should include data from meta.json (see below).

## etc/meta.json

This configuration file describes the meta data of your website which is used system-wide.

| Option      | Description                                                                     |
|-------------|---------------------------------------------------------------------------------|
| title       | Site title (specified for each site language individually)                      |
| shortTitle  | A shorter version of site title (specified for each site language individually) |
| description | Site description (specified for each site language individually)                |

## site/config/languages.json

This configuration file contains a list of languages in the following format:

```json
{
    "en-us": "English",
    "ru-ru": "Русский"
}
```

## site/config/navigation.json

This file is being used as a source to display the top navigation menu on your website (in the default template). Additionally, you've to set the default route ID.

For each area, "userspace" and "admin", you may define a separate list of routes.

*Userspace*:

| Option | Description                                              |
|--------|----------------------------------------------------------|
| home   | Home route ID                                            |
| routes | Array which contains all routes to display in the navbar |

*Admin*:

| Option | Description                                              |
|--------|----------------------------------------------------------|
| routes | Array which contains all routes to display in the navbar |

Normally, *routes* options contains an array of strings (each strings indicates a corresponding route ID). If you want to use dropdown menus for routes, you can use the following syntax:

```json
{
	"home": "home",
	"routes": [
		"home",
		"license",
		{
			"id": "parentRouteName",
			"routes": ["childRouteId1", "childRouteId2", "childRouteId3"]
		}
	]
}
```

You will need to add a translation for *parentRouteName* to your user translation dictionaries. Add your route IDs to *routes* array.

## Auto-Generated Files

Some files are auto-generated during the build process. Most of them are located in the *./src/build* directory. There is no need to edit anything there because each file gets overwritten on every build.