/**
 * Created by kevinqian on 7/5/17.
 */
var casper = require('casper').create({
    //verbose: true,
    logLevel: "info",
    pageSettings: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11"
    }
});
var fs = require('fs');

var config;
(function readConfig() {
    config = JSON.parse(fs.read('config.json', 'utf8'));
})();


function isEmpty(a) {
    return a === null || a === undefined || a === "" || a.replace(/[\s\t\n]*/g, "") === "";
}

function getEnrollSite(someClass) {
    var subj, catlg;
    (function formatSubject() {
        subj = someClass.subject.trim().replace(/\s/g, '+'); // COM SCI => COM+SCI

        var tempID = someClass.id.toString();

        catlg = Array(4-tempID.length+1).join('0') + tempID;
        if (!isEmpty(someClass.suffix)) {
            catlg += someClass.suffix;
        }
        if (!isEmpty(someClass.prefix)) {
            catlg += (Array(someClass.prefix.length + 1).join('+'));
            catlg += someClass.prefix;
        }
        // 31 => 0031, CM121 => 0121++CM, M151B => 0151B+M, 32AH => 0032AH
    })();

    return "https://sa.ucla.edu/ro/ClassSearch/Results?t=" + config.term.trim() + "&subj=" + subj + "&catlg=" + catlg;
}

function classObjectToString(someClass) {
    var output = someClass.subject;
    if (!isEmpty(someClass.prefix)) {
        output += " " + someClass.prefix;
    } else {
        output += " ";
    }
    output += someClass.id.toString();
    if (!isEmpty(someClass.suffix)) {
        output += " " + someClass.suffix;
    }
    return output;
}

phantom.cookiesEnabled = true;

var LOG = {
    verbose: true,
    action: function(msg) {
        if (this.verbose) console.log("ACTION: " + msg);
    },
    error: function(msg) {
        console.error("ERROR: " + msg);
    },
    warning: function(msg) {
        if (this.verbose) console.error("WARNING: " + msg);
    },
    hint: function(msg) {
        if (this.verbose) console.log("HINT: " + msg);
    },
    other: function(msg) {
        if (this.verbose) console.log(msg);
    },
    must: function(msg) {
        console.log(msg);
    }
};

(function addCasperLib() {
    casper.waitForUrlChange = function(then, onTimeout, timeout){
        var oldUrl;
        this.then(function(){
            oldUrl = this.getCurrentUrl();
        }).waitFor(function check(){
            return oldUrl === this.getCurrentUrl();
        }, then, onTimeout, timeout);
        return this;
    };
})();


(function setUserAgent() {
    casper.userAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36');
})();


(function main() {
    var classIndex = 0;
    var classIndexMax = config.classes.length;

    LOG.action('initializing...');
    casper.start(getEnrollSite(config.classes[0]));

    // Virtually infinite loop, I guess...
    casper.repeat(100000, function body() {
        if (classIndex >= classIndexMax) classIndex = 0;

        var isLoggedin = true;

        casper.thenOpen(getEnrollSite(config.classes[classIndex]));

        casper.waitForSelector('#titleText', function () {
            LOG.action("Successfully loaded " + this.getCurrentUrl());
        }, function timeout() {
            if (!this.evaluate(function hasJQuery() { return Boolean($); })) {
                this.page.injectJs('includes/jquery-3.2.1.min.js');
            }

            if (this.evaluate(function isAtLoginPage() {
                    return $('#logon').length > 0;
                })) {
                isLoggedin = false;
            } else {
                LOG.error("Unknown problem that caused timeout");
                phantom.exit();
            }
        });

        casper.then(function loginSteps() {
            if (!isLoggedin) {
                casper.waitForSelector('form#sso', function fillSubmitAndWaitTillLoggedIn() {
                    LOG.other('filling info');
                    this.fillSelectors('form#sso', {
                        'input[name="j_username"]': config.username,
                        'input[name="j_password"]': config.password
                    }, true);
                });

                casper.then(function submitForm() {
                    var rect = this.evaluate(function () {
                        return document.forms[0].querySelector('button[name="_eventId_proceed"]').getBoundingClientRect();
                    });
                    this.page.sendEvent('click', rect.left + rect.width / 2, rect.top + rect.height / 2);
                });

                casper.waitForUrl(/^https:\/\/sa\.ucla\.edu\/ro\/ClassSearch\//, function classSearchLoaded() {
                    LOG.action('Course Search Loaded');
                }, function timeout() {
                    if (this.evaluate(function checkIfLoginInvalid() {
                            return $('.error-box-lite.login-fail').length;
                        })) {
                        LOG.error("Invalid login info provided");
                    } else {
                        LOG.error('Waiting too long, timed out');
                        phantom.exit();
                    }
                }, 20000);
            }
        }, function() { LOG.error("still timed out"); }, 30000);
        //console.log("isLoggedIn: " + isLoggedin);

        /*
        if (!isLoggedin) {
            casper.waitForSelector('form#sso', function fillSubmitAndWaitTillLoggedIn() {
                LOG.other('filling info');
                this.fillSelectors('form#sso', {
                    'input[name="j_username"]': config.username,
                    'input[name="j_password"]': config.password
                }, true);
            });

            casper.then(function submitForm() {
                var rect = this.evaluate(function () {
                    return document.forms[0].querySelector('button[name="_eventId_proceed"]').getBoundingClientRect();
                });
                this.page.sendEvent('click', rect.left + rect.width / 2, rect.top + rect.height / 2);
            });

            casper.waitForUrl(/^https:\/\/sa\.ucla\.edu\/ro\/ClassSearch\//, function classSearchLoaded() {
                LOG.action('Course Search Loaded');
            }, function timeout() {
                if (this.evaluate(function checkIfLoginInvalid() {
                        return $('.error-box-lite.login-fail').length;
                    })) {
                    LOG.error("Invalid login info provided");
                } else {
                    LOG.error('Waiting too long, timed out');
                    phantom.exit();
                }
            }, 20000);
        }
        */

        var isClassOpen = false;

        casper.then(function checkIfClassExists() {
            if (this.evaluate(function isClassResultTabNotPresent() {
                return $('.results').length === 0
                })) {
                LOG.error(this.getCurrentUrl());
                LOG.error("Corresponding class " + classObjectToString(config.classes[classIndex]) + " is not available or non-existent. Please recheck your input");
            } else {
                var check = this.evaluate(function checkAndTickLectures() {
                    var items = $("div").filter(function(){
                        return this.id.match(/.*children/)
                    });

                    for (var i = 0; i < items.length; i++) {
                        var lec = items[i];
                        var status = lec.querySelector(".statusColumn>p").innerText;

                        if (status.toLowerCase().indexOf("full") === -1 &&
                            status.toLowerCase().indexOf("closed") === -1) {
                            lec.querySelector(".enrollColumn>input").click();
                            return true;
                        }
                    }
                    return false;
                });

                if (check) {
                    console.log("check!");
                } else {
                    LOG.warning("class " + classObjectToString(config.classes[classIndex]) + " full");
                }
            }
        });

        if (isClassOpen) {
            casper.waitForSelector('.secondarySection', function () {
                console.log("LOL");
            })
        }

        // Incr class index
        classIndex++;
    });

    casper.run();
})();