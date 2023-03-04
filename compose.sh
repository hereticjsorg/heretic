#!/usr/bin/env bash

COMPOSE_URL='https://raw.githubusercontent.com/hereticjsorg/heretic/master/src/bin/data/docker-compose.yml'
which curl &>/dev/null || {
    echo 'Please install curl in order to run this script'
    exit 1
}
ID=$1
HERETIC_PORT=$2
[[ -z "$ID" ]] && read -p "Enter site ID: " ID
[[ -z "$HERETIC_PORT" ]] && read -p "Enter port number: " HERETIC_PORT
CURRENT_DIR=$(echo "$PWD" | sed 's/\//\\\//g')
echo 'Downloading docker-compose.yml...'
curl -s -o ./docker-compose.yml $COMPOSE_URL
echo 'Processing variables...'
sed -i "" "s/\$ID/$ID/gi" docker-compose.yml
sed -i "" "s/\$HERETIC_PORT/$HERETIC_PORT/gi" docker-compose.yml
sed -i "" "s/\$PUBLIC_DIR/$CURRENT_DIR\/public/g" docker-compose.yml
sed -i "" "s/\$SITE_DIR/$CURRENT_DIR\/site/g" docker-compose.yml
sed -i "" "s/\$ETC_DIR/$CURRENT_DIR\/etc/g" docker-compose.yml
sed -i "" "s/\$FILES_DIR/$CURRENT_DIR\/files/g" docker-compose.yml
sed -i "" "s/\$LOGS_DIR/$CURRENT_DIR\/logs/g" docker-compose.yml