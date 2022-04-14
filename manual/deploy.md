# Deploy

There are no extra actions from your side necessary to run Heretic in development mode (just start Heretic by running *npm run server* command). However, in order to improve website performance in production mode you will need some additional steps.

## Running in Daemon Mode

You will need to run Heretic web server in a daemon mode when running in production. There are many options how to achieve this depending on your operating system (systemd, init.d etc.). However, a recommended way is to use [PM2](https://pm2.keymetrics.io/), a daemon process manager that will help you manage and keep your application online.

There is a PM2 configuration file (*ecosystem.config.js*) which allows to run you Heretic website by running a simple command:

```
pm2 start
```

Please refer to the [PM2 docs](https://pm2.keymetrics.io/docs/usage/quick-start/) to learn some tips and tricks.

## Proxy Web Server Configuration

Heretic needs to run as web server in order to render pages on server-side. In development mode, Heretic may also serve static assets for you (which is not recommended in production mode), please check [configuration files](configurationFiles.md) to disable or enable the *static* parameter in *./etc/system.json*.

It's recommended to use a proxy server such as NGINX in production. The simple configuration for NGINX may look like this:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/example.com/dist/public;
    access_log /var/www/example.com/logs/nginx_access.log;
    error_log /var/www/example.com/logs/nginx_error.log;
    location / {
        try_files $uri @heretic;
    }
    location @heretic {
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_pass http://127.0.0.1:3001;
    }
    gzip on;
    gzip_min_length 10240;
    gzip_comp_level 1;
    gzip_vary on;
    gzip_disable msie6;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/css
        text/javascript
        text/xml
        text/plain
        text/x-component
        application/javascript
        application/x-javascript
        application/json
        application/xml
        application/rss+xml
        application/atom+xml
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;
}        
```

## Standalone

The *dist* directory may work in standalone mode. This means that it's the only directory which might be copied to the production server (no *node_modules* and other directories are required in order to run). To do this: put *system.json* and *meta.json* directly to the *dist* directory along with *server.js* file.

However, it's recommended to keep the file structure as-is, because that's how you may simplify your updates and website rebuilds.