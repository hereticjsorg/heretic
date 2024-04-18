#!/usr/bin/env bash

HERETIC_REPO="https://github.com/hereticjsorg/heretic"
HERETIC_PACKAGE_JSON="https://raw.githubusercontent.com/hereticjsorg/heretic/master/package.json"
MIN_NODE_VERSION=16

echo "This script will download and install Heretic to the current directory."

if ! [ -x "$(command -v curl)" ]; then
    echo "Could not find curl, exiting"
    exit 1
fi
if ! [ -x "$(command -v git)" ]; then
    echo "Could not find Git client, exiting"
    exit 1
fi
if ! [ -x "$(command -v node)" ]; then
    echo "Could not find Node installed, exiting"
    exit 1
fi

while true; do
    read -p "Do you want to proceed? (y/n) " yn
    case $yn in
        [Yy]* ) echo "Running installation script" && break;;
        [Nn]* ) exit 0;;
        * ) echo "Please answer Y or N";;
    esac
done

NODE_VERSION=$(node -v)
NODE_VERSION=${NODE_VERSION//v/}
NODE_VERSION=${NODE_VERSION%.*}
NODE_MAJOR_VERSION=${NODE_VERSION%.*}
if (($NODE_MAJOR_VERSION < $MIN_NODE_VERSION)); then
    echo "Found Node $NODE_MAJOR_VERSION, required at least Node 16"
    exit 1
fi
echo "Node $NODE_MAJOR_VERSION is available"
echo "Checking Internet connectivity..."
GITHUB_STATUS=$(curl $HERETIC_REPO -k -s -f -o /dev/null && echo 1 || echo 0)
if [ $GITHUB_STATUS -eq 1 ]; then
    echo "Connection is OK"
else
    echo "Could not connect to github.com"
    exit 1
fi
echo "Getting Heretic release information..."
HERETIC_VERSION=$((curl -s -i $HERETIC_PACKAGE_JSON | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | sed 's/ //g') & )
echo "Latest version: $HERETIC_VERSION"
echo "Cloning to $(pwd)..."
git clone -s $HERETIC_REPO &> /dev/null
if [ $? -ne 0 ]; then
    echo "Could not clone the remote repository"
    exit 1
fi
echo "Cloned successfully"
cd heretic
echo "Installing NPM modules, please wait..."
npm run install-modules &> /dev/null &
if [ $? -ne 0 ]; then
    echo "Could not install required NPM modules"
    exit 1
fi
echo "NPM modules are successfully installed"
echo "Running configuration script..."
npm run configure &> /dev/null
if [ $? -ne 0 ]; then
    echo "Could not run the configuration script"
    exit 1
fi
echo "All done. You may wish to run next: npm run server"
echo "Have a nice day!"
