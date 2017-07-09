#!/bin/bash

echo 'Uninstalling CatchLA'

if [ -d '/opt/catchla' ]; then
    rm -rf '/opt/catchla'
fi

systemctl stop catchla.service
systemctl disable catchla.service

rm -f '/etc/systemd/system/catchla.service'
rm -f '/usr/local/bin/catchla'

echo '>>> Uninstallation complete!'
