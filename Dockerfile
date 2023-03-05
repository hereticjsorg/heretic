FROM node:latest
WORKDIR /heretic
VOLUME /heretic/dist/public
RUN apt update && apt upgrade -y && git clone --depth 1 --branch master https://github.com/hereticjsorg/heretic.git /heretic && rm -rf /heretic/.git && rm -rf /heretic/.vscode && cd /heretic && npm i && npm i -g pm2
EXPOSE 3001
VOLUME /heretic/dist/public
VOLUME /heretic/etc
VOLUME /heretic/site
VOLUME /heretic/files
VOLUME /heretic/logs
VOLUME /heretic/backup
CMD [ "/usr/bin/env", "bash", "startup.sh" ]