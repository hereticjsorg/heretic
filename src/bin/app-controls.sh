#!/usr/bin/env bash

B="\e[30m"
R="\e[31m"
G="\e[32m"
GB="\e[42m"
M="\e[35m"
E="\e[0m"

echo ""
echo $(printf "${GB}                 ${E}")
echo -e $(printf "${GB}  ${B}H E R E T I C  ${E}")
echo $(printf "${GB}                 ${E}")
echo ""
echo -e $(printf "Application Controls for: ${M}$ID${E}")
echo ""
echo "This script will execute commands in $ID-app container."

PS3=$'\n'"Choose command to execute: "

while :; do
    echo ""
    select lng in "Rebuild" "Update" "CLI" "Backup" "Shell" "Quit this Script"; do
        case $lng in
        "Rebuild")
            docker exec -it $ID-app npm run build
            docker exec -it $ID-app pm2 restart $ID
            break
            ;;
        "Update")
            docker exec -it $ID-app npm run update
            docker exec -it $ID-app npm run install-modules
            docker exec -it $ID-app npm run build
            docker exec -it $ID-app pm2 restart $ID
            break
            ;;
        "Backup")
            docker exec -it $ID-app npm run backup
            break
            ;;
        "CLI")
            docker exec -it $ID-app npm run cli-interactive
            break
            ;;
        "Shell")
            docker exec -it $ID-app /bin/bash
            break
            ;;
        "Quit this Script")
            exit
            ;;
        *)
            echo "Please select 1-6"
            ;;
        esac
    done
done
echo ""
echo "All done. Have a nice day!"
echo ""
