FROM node:latest
WORKDIR /heretic
VOLUME /heretic/dist/public
RUN apt update && apt upgrade -y && git clone --depth 1 --branch master https://github.com/xtremespb/heretic.git /heretic && rm -rf /heretic/.git && rm -rf /heretic/.vscode && cd /heretic && npm i && npm i -g pm2
EXPOSE $HERETIC_PORT
CMD [ "/usr/bin/env", "bash", "startup.sh" ]