# Configuration Files

There are several configuration files available so you may adjust many parameters related to your website.

## site/etc/system.js

This configuration file contains main options related to your web server (IP, ports, logging etc.).

### **id**

Unique website ID. This ID is used for cookies, websockets etc.

Example:

```
id: "heretic"
```

### **secret**

Secret key used for internal security purposes, e.g. to encrypt session keys or to salt database records.

Normally it's being imported from a JSON file called *secure.json*, but you can put any value here:

Example:

```
secret: secure.secret
```

### **hashMethod**

Define the way you database passwords will be stored. Currently there are to options available: *argon2* or *crypto* (crypto.scrypt):

```
hashMethod: "argon2"
```

### **server**

Define the options to run the build-in Web server based on Fastify:

* *ip* - IP address your server should listen to (use *0.0.0.0* to listen to all interfaces)
* *port* - port on which Fastify is listening to
* *static* - serve static content using internal server (disable for production)
* *trustProxy* - set to *true* if your instance is being served by a trusted proxy; read more [here](https://fastify.dev/docs/latest/Reference/Server/#trustproxy).
* *ignoreTrailingSlash* - ignore trailing slashes for routing

Example:

```js
server: {
    ip: "0.0.0.0",
    port: 3001,
    static: true,
    trustProxy: true,
    ignoreTrailingSlash: true,
}
```

### **auth**

Set different options related to the authentication process:

* *admin* - should the admin panel be enabled (works only if MongoDb is enabled)
* *signIn* - is sign in allowed (the existing users are allowed to authenticate)
* *signUp* - is sign up allowed (new users are allowed to register)

Example:

```js
auth: {
    admin: true,
    signIn: true,
    signUp: true
}
```

### **mongo**

Heretic has an option to use MongoDB as a database backend. The options are as following:

* *enabled* - should the MongoDB feature be enabled?
* *url* - define MongoDB connection URL
* *dbName* - define database name
* *options* - define MongoDB connection options

Example:

```js
mongo: {
    enabled: true,
    url: "mongodb://127.0.0.1:27017",
    dbName: "heretic",
    options: {
        connectTimeoutMS: 5000,
    }
}
```

### **redis**

Heretic has an option to use Redis for internal purposes. The options are as following:

* *enabled* - should the Redis feature be enabled?
* *host* - define Redis Server host
* *port* - define Redis port

Example:

```js
redis: {
    enabled: false,
    host: "127.0.0.1",
    port: 6379
}
```

### **email**

Set your e-mail configuration here. Heretic uses [Nodemailer](https://nodemailer.com/about/) under the hood to send mails.

Configuration options:

* *enabled* - is mail sending allowed?
* *from* - which *from* address should be used to send mails
* *config* - Nodemailer transporter configuration object

Example:

```js
email: {
    enabled: false,
    from: "noreply@hereticjs.org",
    config: {
		host: "smtp.example.com",
  		port: 587,
  		secure: false,
  		auth: {
    		user: "username",
    		pass: "password",
  		}
	}
}
```

### **webSockets**

Configuration for internal web sockets transport.

* *enabled* - are websockets supported?
* *url* - web socket URL for frontend connections
* *options* - web socket options

Example:

```js
webSockets: {
    enabled: true,
    url: "ws://127.0.0.1:3001/ws",
    options: {
        maxPayload: 1048576,
    }
}
```

### **token**

Configuration of JWT (tokens):

* *expiresIn* - token time-to-live (in seconds)
* *ip* - Bind token to client IP address

Example:

```js
const {
    parse,
} = require("@lukeed/ms");

token: {
    expiresIn: parseInt(parse("7 days") / 1000, 10),
    ip: false
}
```

### **passwordPolicy**

Define password policy for users (takes effect on sign up and other password-related procedures). 

Options:

* *minLength* - minimum password length (set *null* to disable)
* *maxLength* - maximum password length (set *null* to disable)
* *uppercase* - should contain uppercase characters
* *lowercase* - should contain lowercase characters
* *numbers* - should contain numbers
* *special* - should contain special characters
* *minGroups* - a number of groups required (e.g. *2* means that a password should contain either numbers and uppercase characters, or lowercase and uppercase characters etc.)

Example:

```js
passwordPolicy: {
    minLength: 8,
    maxLength: null,
    minGroups: 2,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
}
```

### **oauth2**

A list of available OAuth2 providers for the current site. Heretic is using [@fastify/oauth2](https://github.com/fastify/fastify-oauth2) under the hood.

The following providers are supported for Heretic now: 

* *Google*

Configuration data:

* *enabled* - is this authentication method enabled?
* *name* - method name (should start with *oa2*)
* *scope* - a list of requested scopes (should contain *email* as this is required for the workflow)
* *credentials.client* - define ID and secret of oauth provider
* *credentials.auth* - define a *@fastify/oauth2* constant used for authentication process
* *startRedirectPath* - redirect path to start the authentication workflow
* *callbackUri* - callback URL
* *callbackPath* - callback path
* *icon* - SVG path for the icon displayed on the sign in / sign up pages

Example:

```js
oauth2: [{
    enabled: false,
    name: "oa2google",
    scope: ["profile", "email"],
    credentials: {
        client: {
            id: "",
            secret: "",
        },
        auth: process.browser ? null : require("@fastify/oauth2").GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/oauth2/google",
    callbackUri: "https://demo.hereticjs.org/oauth2/google/callback",
    callbackPath: "/oauth2/google/callback",
    icon: "M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z",
}]
```

### **cookieOptions**

Define options for cookies.

* *expires* - cookie expiration time (seconds)
* *path* - cookie path
* *domain* - cookie domain
* *secure* - secure cookie flag
* *sameSite* - cookie "same site" property

Example:

```js
{
    expires: 604800,
    path: "/",
    domain: ".demo.hereticjs.org",
    secure: true,
    sameSite: "strict"
}
```

### **log**

Define logging settings. Options:

* *level* - define log level ("trace", "debug", "info", "warn", "error", or "fatal"

Example:

```js
log: {
	level: "info"
}
```

### **rateLimit**

Rate limiting protects your website from various denial-of-service attacks and helps you to limit access for specified IPs.

Options:

* *timeWindow* - time period (in milliseconds); in case a client reaches the maximum number of allowed requests in this time period, a *429* error is generated
* *max* - request limit until client gets temporary restricted
* *ban* - request limit until client gets banned
* *whiteList* - a whitelist of IP addresses or networks
* *blackList* - a whitelist of IP addresses or networks
* *addHeaders* - headers to add

Example:

```
rateLimit: {
    enabled: false,
    ban: false,
    global: {
        max: 100,
        ban: 1000,
        timeWindow: 10000
    },
    whiteList: [],
    blackList: [],
    addHeaders: {
        "x-ratelimit-limit": true,
        "x-ratelimit-remaining": true,
        "x-ratelimit-reset": true,
        "retry-after": true,
    }
}
```

See [rate limiting](./rateLimit.md) for further information.

### **directories**

Define system-wide directories used to store local files.

Options:

* *tmp* - a directory to store temporary files (*null* means to use the system directory, e.g. /tmp)
* *files* - a directory to store file uploads

Example:

```js
directories: {
    tmp: null,
    files: "files"
}
```

### **collections**

A list of MongoDB collection names for different system modules.

Example:

```js
collections: {
    users: "users",
    files: "files",
    counters: "counters",
    history: "history",
    groups: "groups",
    events: "events",
    geoNetworks: "geoNetworks",
    geoCountries: "geoCountries",
    geoCities: "geoCities",
    version: "version",
    sessions: "sessions",
    activation: "activation",
    captcha: "captcha"
}
```

### **routes**

A list routes for different system modules.

Example:

```js
routes: {
    admin: "/admin",
    signInAdmin: "/admin/signIn",
    signIn: "/signIn",
    signOutAdmin: "/admin/signOut",
    signOut: "/signOut",
    account: "/account",
    signUp: "/signUp",
    restorePassword: "/restorePassword"
}
```

### **buildOptions**

Options on how to build Heretic from source:

* *productionCompress* - compress compiled website files using gzip compression

Example:

```js
buildOptions: {
    productionCompress: false
}
```

### **test**

Options for test framework:

* *headless* - run GUI tests in headless mode
* *executablePath* - Chromium executable path (set "auto" to search for a pre-installed Chrome or Chromium)
* *args* - arguments to start Chromium with
* *defaultViewport* - default view port
* *devtools* - start Chromium with open DevTools

Example:

```js
test: {
    headless: true,
    executablePath: "auto",
    args: ["--window-size=1920,1080", "--no-sandbox"],
    defaultViewport: null,
    devtools: true
}
```

### **heretic**

Specify some framework internal settings.

* *zipball* - an URL to get the zipball from (used for system updates)
* *darkModeEnabled* - enable switch to dark mode

Example:

```js
heretic: {
    zipball: "http://github.com/hereticjsorg/heretic/zipball/master/",
	darkModeEnabled: true
}
```

## site/etc/website.js

This configuration file describes the meta data of your website which is used system-wide.

| Option      | Description                                                                     |
|-------------|---------------------------------------------------------------------------------|
| url         | Site URL starting with http or https                                            |

Returns the object which should include data from meta.json (see below).

## site/etc/meta.src.json

This configuration file describes the meta data of your website which is used system-wide.

| Option      | Description                                                                     |
|-------------|---------------------------------------------------------------------------------|
| title       | Site title (specified for each site language individually)                      |
| shortTitle  | A shorter version of site title (specified for each site language individually) |
| description | Site description (specified for each site language individually)                |

## site/etc/languages.json

This configuration file contains a list of languages in the following format:

```js
{
    "en-us": "English",
    "ru-ru": "Русский"
}
```

## site/etc/navigation.json

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

```js
{
	"home": "sample_home",
	"routes": [
		"sample_home",
		"sample_license",
		{
			"id": "parentRouteName_page",
			"routes": ["childRouteId1_page", "childRouteId2_page", "childRouteId3_page"]
		}
	]
}
```

You will need to add a translation for *parentRouteName* to your user translation dictionaries. Add your route IDs to *routes* array.

## Auto-Generated Files

Some files are auto-generated during the build process. Most of them are located in the *./site/.build* directory. There is no need to edit anything there because each file gets overwritten on every build.