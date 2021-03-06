# CatchLA UCLA Course Scanner
This is a reimplementation of Snatcher in CasperJS, added with some useful utils.  
Currently, the util files, however, __ONLY__ support __UBUNTU__.

## WARNING  
This course scanner has been proved to be detected by UCLA Registrar. USE AT YOUR OWN RISK!  

## UPDATE: Common Installation Problem  
1. You may found that `npm` is not installed. Install it.  
2. You may found that `npm` refuses to run `due to nodejs bug`. This is very sad, but an official fix is [here](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)  
3. You may found halfway in installation, `npm` reports error and failed to install phantomjs AND casperjs. You can first try manually do `npm install -g phantomjs` AND `npm install -g casperjs`. IF then, `phantomjs` starts up and immediately exists with some error message, try removing the npm version using `npm uninstall phantomjs -g` and install instead using `apt-get install phantomjs` source. IF it fails again, try this [solution](https://www.vultr.com/docs/how-to-install-phantomjs-on-ubuntu-16-04) (This is the solution that worked for me. GOD `phantomjs` is such a mess!).  

## UPDATE: Ubuntu Package Created  
A `catchla.deb` package has been created under Ubuntu environment. You could directly use
```
dpkg -i catchla.deb
```
to install the program with all the dependencies. The only difference: after installation, you have to manually run `catchla` to start the daemon. `config.json` is still under the `/opt/catchla` directory. To remove the package, just do `dpkg -r catchla`.   

## How to run
Basic features such as class scan and email notification should be available now. Auto enrollment has been implemented but not yet tested. Nevertheless, to turn on auto enrollment, set `enroll` in your config to `true`

__BEFORE THE FOLLOWING STEPS__, you must first configure your `config.json` in the cloned folder. Follow the pattern of `sample-config.json` to create your `config.json`, which contains your login info and class info. After installation, this file could be updated under `/opt/catchla/config.json` so as to allow search for new classes.

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
catchla -s # show the catchla.service status
catchla -c # edit the config.json using Vim

# under /opt/catchla/ OR at the cloned directory for installation
make status # view current catchla daemon status
make uninstall # uninstall program
```
When courses show empty spaces or waitlist, the program could send you an email for notification. You can simply configure the `"mailgun.domain"` and `"mailgun.key"` to enable this feature. __Notice__: you have to add your own email to the authorized receivers on Mailgun if you are using the Sandbox option.
When all courses have empty spaces, the daemon would automatically stop.

There are also some useful system command you may be interested in:  
```bash
systemctl status catchla.service # equivalent to `catchla -s` and  `make status`, get `catchla` running status, useful for debugging
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

## TODO
Please help implement the `launchd` version of the installation scripts, so that it could also run on macOS! Thanks!
