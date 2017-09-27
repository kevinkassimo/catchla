#!/bin/bash

OPTIND=1
while getopts "e" opt; do
    case "$opt" in
        "e")
            echo ">>> Stopping catchla service"
            systemctl stop catchla.service
            exit 0
            ;;
    esac
done

systemctl start catchla.service

set -o pipefail
casperjs /opt/catchla/src/catchla.js > /opt/catchla/catchla.log

RESULT=$?

set +o pipefail

case $RESULT in
    0)
        echo ">>> CatchLA complete" >> /opt/catchla/catchla.log
        systemctl stop catchla.service
        ;;
    *)
        echo ">>> CatchLA with exit code $RESULT" >> /opt/catchla/catchla.log
        ;;
esac
