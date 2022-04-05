# Configuration Files

There are several configuration files available so you may adjust many parameters related to your website.

## etc/system.json

This configuration file contains main options related to your web server (IP, ports, logging etc.).

| Option        | Description                                                               | Default Value                      |
|---------------|---------------------------------------------------------------------------|------------------------------------|
| server/ip     | IP address where server should listen <br>to the queries                  | "127.0.0.1"                        |
| server/port   | Server port                                                               | 3001                               |
| server/static | Serve static assets (when no proxy server)                                | true                               |
| log/level     | One of 'fatal', 'error', 'warn', 'info', <br>'debug', 'trace' or 'silent' | "info"                             |
| log/pretty    | Options for pino-pretty                                                   | Object ("translateTime", "ignore") |

Read more on how to set log/pretty option: [pino-pretty website](https://github.com/pinojs/pino-pretty).

## etc/meta.json

This configuration file describes the meta data of your website which is used system-wide.

| Option      | Description                                                                     |
|-------------|---------------------------------------------------------------------------------|
| id          | Site ID which is used to identify your website                                  |
| url         | Site URL starting with http or https                                            |
| title       | Site title (specified for each site language individually)                      |
| shortTitle  | A shorter version of site title (specified for each site language individually) |
| description | Site description (specified for each site language individually)                |

## src/config/languages.json

This configuration file contains a list of languages in the following format:

```json
{
    "en-us": "English",
    "ru-ru": "Русский"
}
```

## src/config/navigation.json

This file is being used as a source to display the top navigation menu on your website (in the default template). Additionally, you've to set the default route ID.

| Option | Description                                              |
|--------|----------------------------------------------------------|
| home   | Home route ID                                            |
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