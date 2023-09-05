# Install on Linux Server

Heretic can be installed on any server that can run Node.js. The database and caching server also require an architecture and configuration that must be supported by Mongo and Redis, but since these components are optional, the system can be run without them.

The Heretic build process was successfully tested on Debian Linux 11, macOS and Windows 11. The system can be run on a server or virtual machine with 512 MB RAM, but at least 2 GB of RAM may be required for a successful build.

Prerequisite steps to be taken before installing Heretic on the server:

1. Install Node.js using [this manual](https://github.com/nodesource/distributions/blob/master/README.md)
2. Install the MongoDB database management system using [these instructions](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-debian/) — optional
3. Install Redis using *apt* package manager by running *apt install redis-server* command — optional

When finished, you need to proceed with the [installation process](./gettingStarted.md). You may also wish to use [docker](./docker.md) in order to run Heretic. 