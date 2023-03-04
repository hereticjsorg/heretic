# Docker

Heretic can be run on the server as a standalone application or in a Docker container (or in Docker Compose). Running Heretic in a container is preferable because it allows Heretic's operation to be separated from the main host and is more secure.

## Running a Docker container

In its base configuration, Heretic requires nothing more than the standard features provided by Node.js. If you do not require advanced features such as user management, database, etc., you can run Heretic in a container using the following commands.

```bash
docker run -d --name heretic  \
    -v /var/www/heretic/public:/heretic/dist/public \
    -v /var/www/heretic/etc:/heretic/etc \
    -v /var/www/heretic/site:/heretic/site \
    -v /var/www/heretic/files:/heretic/files \
    -v /var/www/heretic/logs:/heretic/logs \
    -p 3001:3001 \
    hereticjsorg/heretic:latest
```

You may wish to replace */var/www/heretic* with any directory which shall ne used to keep Heretic data on your host machine. You may also wish to replace the default port mapping (for example, to make container listen on the port *80*, use the *-p 80:3001* parameter).

## Running in Docker Compose mode

To use the full configuration, you will either need to install additional services such as *Mongo* and *Redis* on the target machine, or use the Docker Compose mechanism to run multiple containers, including a Heretic container, in conjunction.

To use the helper script that generates the Docker Compose configuration file, the *curl* and *sed* commands must be available on your machine.

```bash
curl -o ./compose.sh https://raw.githubusercontent.com/hereticjsorg/heretic/master/compose.sh
```

Then you need to run this script which will generate *docker-compose.yml* in the current directory:

```bash
bash ./compose.sh <siteid> <port>
```

Replace *\<siteid\>* with an unique site ID (e.g. *heretic*), and *\<port\>* with a listening port (e.g. *3001*). Example:

```bash
bash ./compose.sh heretic 3001
```

When finished, you need to run *docker compose* command in order to start the containers:

```bash
docker compose up -d
```

To enable *Mongo*, you will need make some changes to *etc/system.js* file.

Assuming that your unique site ID is *heretic*, replace

```
url: "mongodb://127.0.0.1:27017",
```

with

```
url: "mongodb://heretic-mongo:27017",
```

Do the same for Redis by setting the proper Redis hostname (e.g. *"host": "heretic-redis"*).