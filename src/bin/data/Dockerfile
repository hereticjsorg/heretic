FROM node:latest
WORKDIR /zoia
VOLUME /zoia/dist/public
RUN apt update && apt upgrade -y && git clone --depth 1 --branch master https://github.com/xtremespb/heretic.git /zoia && rm -rf /zoia/.git && rm -rf /zoia/.vscode && cd /zoia && npm i && npm i -g pm2 && npm run configure -- --no-color && mkdir /zoia/etc/conf.d && echo {'"demo"': $DEMO} > /zoia/etc/conf.d/system.json && echo {'"enabled"': true, '"url"': '"mongodb://$ID-mongodb:27017"'} > /zoia/etc/conf.d/mongo.json && echo {'"enabled"': true, '"host"': '"$ID-redis"'} > /zoia/etc/conf.d/redis.json && echo {'"enabled"': true} > /zoia/etc/conf.d/webSockets.json && echo {'"ip"': '"0.0.0.0"', '"port"': $HERETIC_PORT} > /zoia/etc/conf.d/server.json
EXPOSE $HERETIC_PORT
CMD [ "/usr/bin/env", "bash", "startup.sh" ]