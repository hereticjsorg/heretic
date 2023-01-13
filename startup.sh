#!/usr/bin/env bash

SCRIPT_PATH=$(
    cd "$(dirname "${BASH_SOURCE[0]}")"
    pwd -P
)
VERSION_FILE="$SCRIPT_PATH/dist/public/heretic/version.json"
if !(test -f "$VERSION_FILE"); then
    npm run build
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi
pm2-runtime start ecosystem.config.js