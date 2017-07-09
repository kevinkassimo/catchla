#!/bin/bash

OPTIND=1
while getopts "e" opt; do
    case "$opt" in
        "e")
            echo ">>> Stopping catchla service"
            stop catchla
            exit 0
            ;;
    esac
done

casperjs src/catchla.js
