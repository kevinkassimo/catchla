# CatchLA UCLA Course Scanner
This is a reimplementation of Snatcher in CasperJS, added with some useful utils.  
Currently, the util files, however, __ONLY__ support __UBUNTU__.  

## How to run
Currently, we haven't implemented auto enrollment. However, basic features such as class scan and email notification should be available now.  

__BEFORE EVERYTHING ELSE__, you must first configure your `config.json` in the cloned folder. Follow the pattern of `sample-config.json` to create your `config.json`, which contains your login info and class info. After installation, this file could be updated under `/opt/catchla/config.json` so as to allow search for new classes.  

To run, there are multiple dependencies:  
```bash
phantomjs
casperjs
dialog
npm
node (node-legacy)
```
However, `Makefile` is provided to make everything simple for you. Simply type  
```bash
make install
```
will have all of them installed properly for you.  
During installation, you will be prompted for activating daemon. However, you can always reenable daemon later with `sudo catchla`  

Some useful commands you will be using (notice most need __SUDO__ privileges):  
```bash
catchla # start catchla daemon if it stopped running / not started during installation. After entering this, you can safely Ctrl-C as the daemon is already started anyways
catchla -l # show system logs (with course validity info) with `less`
catchla -e # stop catchla daemon

# under /opt/catchla/ OR at the cloned directory for installation
make status # view current catchla daemon status
make uninstall # uninstall program
```
When courses show empty spaces or waitlist, the program could send you an email for notification. You can simply configure the `sendEmail()` function in `src/catchla.js` using a Mailgun accound keys and API to enable this feature. When all courses have empty spaces, the daemon would automatically stop.  

There are also some useful system command you may be interested in:  
```bash
systemctl status catchla.service # equivalent to `make status`, get catchla running status, useful for debugging
sudo systemctl start catchla.service # manually start catchla daemon
sudo systemctl reload catchla.service # reloading, try on weird behavior
sudo systemctl stop catchla.service # stop catchla daemon
```

If you are __NOT using Ubuntu__, you can still use the script. Manually install all dependencies, and then manually run
```
casperjs src/catchla.js
```
To actually use this script for some long period, you have to configure `MAX_LOOP` to a larger value. This is not a problem for daemonized catchla, as `systemd` can automatically restart the underlying program.  


## Installed files  
Files will be placed during installation:
```
/opt/catchla/* # all files core to catchla program
/opt/catchla/src/catchla.js # core CasperJS file
/opt/catchla/catchla.log # log file

/usr/local/bin/catchla # a copy of catchla.sh to serve as command
/etc/systemd/system/catchla.service # service file for systemd
```
When you run `sudo make uninstall`, these should all be automatically removed.  

## Stability

Current program is VERY unstable. Please help improve it and possibly adding a layer of Electron user interface. Thanks!

## Pitfall
Originally the program may STOP running after some time. We have attempted to fix it with the `systemd` daemonization. However, this problem may still occur as we haven't thoroughly tested this program. Please give us feedbacks and possibly help improve this program! (If problem still occurs, you can temporarily fix it by increasing `MAX_LOOP` value)
