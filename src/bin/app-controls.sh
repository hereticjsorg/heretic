#!/usr/bin/env bash

R="\e[31m"
G="\e[32m"
W="\e[97m"
E="\e[0m"

echo ""
echo -e $(printf "${G}HERETIC${E}")
echo -e $(printf "${W}Application Controls${E}")
echo ""
echo "This script will execute commands in App container."
echo ""

PS3=$'\n'"Choose command to execute: "

select lng in "Rebuild" "Update" "CLI" "Backup" "Shell" "Quit this Script"; do
    case $lng in
    "Rebuild")
        docker exec -it ${ID}-app npm run build
        docker exec -it ${ID}-app pm2 restart ${ID}
        ;;
    "Update")
        docker exec -it ${ID}-app npm run update
        docker exec -it ${ID}-app npm run install-modules
        docker exec -it ${ID}-app npm run build
        docker exec -it ${ID}-app pm2 restart ${ID}
        ;;
    "Backup")
        docker exec -it ${ID}-app npm run backup
        ;;
    "CLI")
        docker exec -it ${ID}-app npm run cli-interactive
        ;;
    "Shell")
        docker exec -it ${ID}-app npm run /bin/bash
        ;;
    "Quit this Script")
        exit
        ;;
    *)
        echo "Please select 1-6"
        ;;
    esac
done
echo ""
echo "All done. Have a nice day!"
echo ""
