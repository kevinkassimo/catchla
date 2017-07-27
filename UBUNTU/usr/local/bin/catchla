#!/bin/bash

OPTIND=1
while getopts "elsc" opt; do
    case "$opt" in
    "e")
        echo ">>> Stopping catchla service"
        systemctl stop catchla.service
        exit 0
        ;;
    "c")
        vim "/opt/catchla/config.json"
        exit 0
        ;;
    "l")
        touch "/opt/catchla/catchla.log"
        less "/opt/catchla/catchla.log"
        exit 0
        ;;
    "s")
        systemctl status catchla.service
        exit 0
        ;;
    esac
done

/opt/catchla/run.sh
