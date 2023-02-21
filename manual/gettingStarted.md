# Getting Started

## Requirements

In order to run Heretic, you will need a web server which can run Node.js scripts. There are no special requirements, so if you can install and use Node, you can host a Heretic website.

In case your site needs additional features, such as database access, control panel, etc., you will also need to install additional packages.

## Building From Source

First, you need to clone Heretic from Github repository:

```
git clone https://github.com/hereticjsorg/heretic.git
```

Then, you will need to install the required NPM modules and start the build process:

```
npm i
```

When successful, the required modules will be downloaded to *./node_modules* directory.

In order to create templates of configuration files, directories, etc., you need to run the following command:

```
npm run configure
```

Finally, you may wish to run the build process:

```
npm run build -- --dev
```

This command will generate your site in development mode (faster, less optimizations). In order to generate a website in production mode, run the following command:

```
npm run build
```

Finally, start your web server using the following command:

```
npm run server
```

When successfully, your website will be accessible at *http://127.0.0.1:3001*.

## Tests

In order to run built-in tests, please run the following command:

```bash
npm test
```

[Jest](https://jestjs.io/ru/), a delightful JavaScript Testing Framework with a focus on simplicity is used here.