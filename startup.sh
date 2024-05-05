#!/usr/bin/env bash

SCRIPT_PATH=$(
    cd "$(dirname "${BASH_SOURCE[0]}")"
    pwd -P
)
VIEW_MARKO_FILE="$SCRIPT_PATH/site/view/marko.json"
if !(test -f "$VIEW_MARKO_FILE"); then
    npm run configure -- --no-color
    if [ $? -ne 0 ]; then
        exit 1
    fi
    npm run cli -- --importGeoData --no-color
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi
VERSION_FILE="$SCRIPT_PATH/dist/public/heretic/version.json"
SERVER_FILE="$SCRIPT_PATH/dist/server.js"
if (!(test -f "$VERSION_FILE")) || (!(test -f "$SERVER_FILE")); then
    npm run build -- --no-color
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi
pm2-runtime start ecosystem.config.js
