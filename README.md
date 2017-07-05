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

To enable email notification, you have to register a Mailgun account, and use your own sandbox API, key, etc. to plug into the function `sendEmail()` in `catchla.js`.

Current program is VERY unstable. Please help improve it and possibly adding a layer of Electron user interface. Thanks!
