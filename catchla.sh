#!/bin/bash

OPTIND=1
while getopts "el" opt; do
    case "$opt" in
    "e")
        echo ">>> Stopping catchla service"
        systemctl stop catchla.service
        exit 0
        ;;
    "l")
        touch "/opt/catchla/catchla.log"
        less "/opt/catchla/catchla.log"
        exit 0
        ;;
    esac
done

/opt/catchla/run.sh
