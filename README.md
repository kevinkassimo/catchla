# CatchLA
Some reimplementation of Snatcher in CasperJS

## How to run
Currently, we haven't implemented auto enrollment. However, basic features such as class scan and email notification should be available now.  

To run, you have to install CasperJS (with its core as PhantomJS)  
```bash
npm install casperjs -g
```

To run the script, create a file named `config.json` with almost same structure as provided `sample-config.json`.  
After this, simply do
```bash
casperjs catchla.js
```

If you want it to run in the background infinitely, do
```
# there is some quirky behavior with respect to CasperJS and PhantomJS, that it needs some input
nohup casperjs catchla.js > log 2>&1 < /dev/null &
```

To enable email notification, you have to register a Mailgun account, and use your own sandbox API, key, etc. to plug into the function `sendEmail()` in `catchla.js`.

Current program is VERY unstable. Please help improve it and possibly adding a layer of Electron user interface. Thanks!

## Pitfall
The program may STOP running after some time. This is due to the problem of both `casper.repeat()` has a limit AND that `nohup` is not quite stable
You can increase the count of `casper.repeat` in `function main()` of `catchla.js`, or simply stop and rerun the script every day/week (better every a few days!)