#!/usr/bin/env bash

DOCKER_COMPOSE_XML="https://raw.githubusercontent.com/hereticjsorg/heretic/master/src/bin/data/docker-compose.yml"

echo "This script will generate a docker-compose.yml file for you."
if ! [ -x "$(command -v curl)" ]; then
    echo "Could not find curl, exiting"
    exit 1
fi
echo "Downloading template file..."
COMPOSE_TEMPLATE=$(curl -s $DOCKER_COMPOSE_XML)
# Site ID
ID="-"
while [[ ! ($ID == "" || $ID =~ ^[A-Za-z0-9_]+$) ]]; do
    read -p "Please enter site ID [heretic]: " ID
done
ID=$([ "$ID" == "" ] && echo "heretic" || echo "$ID")
# Port
HERETIC_PORT="-"
while [[ ! ($HERETIC_PORT == "" || $HERETIC_PORT =~ ^[0-9]+$) ]]; do
    read -p "Please enter site port [3001]: " HERETIC_PORT
done
HERETIC_PORT=$([ "$HERETIC_PORT" == "" ] && echo "3001" || echo "$HERETIC_PORT")
# Directory: ./dist
DIST_DIR="*"
while [[ ! ($DIST_DIR == "" || $DIST_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"dist\" directory path [./dist]: " DIST_DIR
done
DIST_DIR=$([ "$DIST_DIR" == "" ] && echo "./dist" || echo "$DIST_DIR")
# Directory: ./site
SITE_DIR="*"
while [[ ! ($SITE_DIR == "" || $SITE_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"site\" directory path [./site]: " SITE_DIR
done
SITE_DIR=$([ "$SITE_DIR" == "" ] && echo "./site" || echo "$SITE_DIR")
# Directory: ./logs
LOGS_DIR="*"
while [[ ! ($LOGS_DIR == "" || $LOGS_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"logs\" directory path [./logs]: " LOGS_DIR
done
LOGS_DIR=$([ "$LOGS_DIR" == "" ] && echo "./logs" || echo "$LOGS_DIR")
# Directory: ./backup
BACKUP_DIR="*"
while [[ ! ($BACKUP_DIR == "" || $BACKUP_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"backup\" directory path [./backup]: " BACKUP_DIR
done
BACKUP_DIR=$([ "$BACKUP_DIR" == "" ] && echo "./backup" || echo "$BACKUP_DIR")
# Directory: ./mongo
MONGO_DIR="*"
while [[ ! ($MONGO_DIR == "" || $MONGO_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"mongo\" directory path [./mongo]: " MONGO_DIR
done
MONGO_DIR=$([ "$MONGO_DIR" == "" ] && echo "./mongo" || echo "$MONGO_DIR")
#
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$ID/$ID}
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$HERETIC_PORT/$HERETIC_PORT}
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$SRC_DIR/$SRC_DIR}
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$DIST_DIR/$DIST_DIR}
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$SITE_DIR/$SITE_DIR}
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$LOGS_DIR/$LOGS_DIR}
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$BACKUP_DIR/$BACKUP_DIR}
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$SRC_DIR/$SRC_DIR}
COMPOSE_TEMPLATE=${COMPOSE_TEMPLATE//\$MONGO_DIR/$MONGO_DIR}
echo "$COMPOSE_TEMPLATE" > "./docker-compose.yml"

