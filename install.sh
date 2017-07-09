#!/bin/bash

echo "CatchLA UCLA Course Scanner"

UNAME_INFO=`uname -a`
UNAME_UBUNTU=$(echo $UNAME_INFO | grep "Ubuntu")

if [[ -z $UNAME_UBUNTU ]]; then
    echo "Sorry! Currently only Ubuntu is supported"
    echo "If you want to run anyway, you could still install casperjs through npm yourself and run manually!"
    exit 0
fi

# Update
apt-get update

# Installing dialog
if ! type "dialog" &> /dev/null; then
    echo ">>> Dependency: Installing Dialog"
    apt install dialog
fi

# Installing Upstart
#if ! type "start" &> /dev/null; then
#    echo ">>> Dependency: Installing Upstart"
#    apt install upstart
#fi

# Check if npm is installed or not
if ! type "npm" &> /dev/null; then
    echo ">>> Dependency: Installing NPM"
    apt-get install npm
fi

# Check if npm is installed or not
if ! type "node" &> /dev/null; then
    echo ">>> Dependency: Installing Node.JS"
    apt-get install nodejs-legacy
fi

# Check if PhantomJS exists or not
if ! type "phantomjs" &> /dev/null; then
    echo ">>> Dependency: Installing PhantomJS"
    npm install -g phantomjs
fi

# Check if CasperJS exists or not
if ! type "casperjs" &> /dev/null; then
    echo ">>> Dependency: Installing CasperJS"
    npm install -g casperjs
fi

# Create symbolic link for the running script
if ! type "catchla" &> /dev/null; then
    echo '>>> Copying scripts to /opt/catchla'
    if ! [ -d "/opt/catchla" ]; then
        mkdir '/opt/catchla'
        cp -r * '/opt/catchla'
    fi
    echo '>>> Creating command "catchla"'
    mv '/opt/catchla/catchla.sh' '/usr/local/bin/catchla'
    chmod +x '/usr/local/bin/catchla'
#ln -s '/opt/run.sh' '/usr/local/bin/catchla'
    echo 'In case, please manually add /usr/local/bin/ to your $PATH'
fi

# Configuring upstart conf
#if ! [ -f "/etc/init/catchla.conf" ]; then
#    echo ">>> Configuring /etc/init config"
#    mv "/opt/catchla/catchla.conf" "/etc/init/"
#fi

if ! [ -f "/etc/systemd/system/catchla.service" ]; then
    echo ">>> Configuring /etc/systemd/system"
    mv "/opt/catchla/catchla.service" "/etc/systemd/system"
fi

# Ask whether to start the process now
dialog --title "Starting Daemon" --yesno "Do you want to start the CatchLA daemon now? (notice you MUST first configure the config.json)" 7 60
case $? in
    0) 
#start catchla
        systemctl daemon-reload
        systemctl enable catchla.service
        systemctl start catchla.service
        echo ">>> CatchLA Daemon has started running"
        echo '>>> (You can always stop it with `sudo catchla -e`)'
        ;;
    1)
        systemctl daemon-reload
        systemctl enable catchla.service
        echo '>>> (You can always start it with `sudo catchla`)'
        ;;
    255)
        systemctl daemon-reload
        systemctl enable catchla.service
        echo '>>> [ESC] key pressed, stop'
        ;;
esac

echo '>>> Note: to modify config.json, go to `/opt/catchla` to modify'

echo '----------------------'
echo 'Installation Complete!'
