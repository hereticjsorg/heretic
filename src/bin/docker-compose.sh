#!/usr/bin/env bash

DOCKER_COMPOSE_XML_BASE="https://raw.githubusercontent.com/hereticjsorg/heretic/master/src/bin/data"

R="\e[31m"
G="\e[32m"
W="\e[97m"
E="\e[0m"

echo ""
echo -e $(printf "${G}HERETIC${E}")
echo -e $(printf "${W}Docker Installation Script${E}")
echo ""
echo "This script will generate docker-compose.yml file for you."
echo ""

if ! [ -x "$(command -v curl)" ]; then
    echo "Could not find curl, exiting"
    exit 1
fi

PS3=$'\n'"Choose your Heretic setup: "

select lng in Full Redis MongoDB "Heretic Only" Quit; do
    case $lng in
    "Full")
        DOCKER_COMPOSE_XML="${DOCKER_COMPOSE_XML_BASE}/docker-compose.yml"
        break
        ;;
    "Redis")
        DOCKER_COMPOSE_XML="${DOCKER_COMPOSE_XML_BASE}/docker-compose-heretic-redis.yml"
        break
        ;;
    "MongoDB")
        DOCKER_COMPOSE_XML="${DOCKER_COMPOSE_XML_BASE}/docker-compose-heretic-mongo.yml"
        break
        ;;
    "Heretic Only")
        DOCKER_COMPOSE_XML="${DOCKER_COMPOSE_XML_BASE}/docker-compose-heretic.yml"
        break
        ;;    
    "Quit")
        exit
        ;;
    *)
        echo "Please select 1-5"
        ;;
    esac
done

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
if [ ! -d "${DIST_DIR}" ]
then
    mkdir "${DIST_DIR}"
fi
# Directory: ./site
SITE_DIR="*"
while [[ ! ($SITE_DIR == "" || $SITE_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"site\" directory path [./site]: " SITE_DIR
done
SITE_DIR=$([ "$SITE_DIR" == "" ] && echo "./site" || echo "$SITE_DIR")
if [ ! -d "${SITE_DIR}" ]
then
    mkdir "${SITE_DIR}"
fi
# Directory: ./logs
LOGS_DIR="*"
while [[ ! ($LOGS_DIR == "" || $LOGS_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"logs\" directory path [./logs]: " LOGS_DIR
done
LOGS_DIR=$([ "$LOGS_DIR" == "" ] && echo "./logs" || echo "$LOGS_DIR")
if [ ! -d "${LOGS_DIR}" ]
then
    mkdir "${LOGS_DIR}"
fi
# Directory: ./backup
BACKUP_DIR="*"
while [[ ! ($BACKUP_DIR == "" || $BACKUP_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"backup\" directory path [./backup]: " BACKUP_DIR
done
BACKUP_DIR=$([ "$BACKUP_DIR" == "" ] && echo "./backup" || echo "$BACKUP_DIR")
if [ ! -d "${BACKUP_DIR}" ]
then
    mkdir "${BACKUP_DIR}"
fi
# Directory: ./mongo
MONGO_DIR="*"
while [[ ! ($MONGO_DIR == "" || $MONGO_DIR =~ ^[^*]+$) ]]; do
    read -p "Please define \"mongo\" directory path [./mongo]: " MONGO_DIR
done
MONGO_DIR=$([ "$MONGO_DIR" == "" ] && echo "./mongo" || echo "$MONGO_DIR")
if [ ! -d "${MONGO_DIR}" ]
then
    mkdir "${MONGO_DIR}"
fi
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
echo "Generating docker-compose.yml..."
echo "$COMPOSE_TEMPLATE" > "./docker-compose.yml"
echo "Generating update-app.sh..."
echo "#!/usr/bin/env bash" > update-app.sh
cat << EOF >> update-app.sh

docker exec -it ${ID}-app npm run update
docker exec -it ${ID}-app npm run install-modules
docker exec -it ${ID}-app npm run build
docker exec -it ${ID}-app pm2 restart ${ID}
EOF
echo "All done. Have a nice day!"