FROM node:latest
WORKDIR /heretic
RUN apt update && apt upgrade -y && git clone --depth 1 --branch master https://github.com/hereticjsorg/heretic.git /heretic && rm -rf /heretic/.git && rm -rf /heretic/.vscode && cd /heretic && npm run install-modules && npm i -g pm2
EXPOSE 3001
CMD [ "/usr/bin/env", "bash", "startup.sh" ]