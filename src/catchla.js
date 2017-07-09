/**
 * Created by kevinqian on 7/5/17.
 */
var casper = require('casper').create({
    //verbose: true, // uncomment this to see underlying steps
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
        if (this.verbose) console.log("WARNING: " + msg);
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

function sendEmail(name) {
    function toQueryString(obj) {
        var str = '';
        for (var key in obj) {
            str += key + '=' + encodeURIComponent(obj[key]) + '&';
        }
        return str.slice(0, str.length - 1);
    }
    var body = {
        "from": "Mailgun Sandbox <postmaster@sandbox64b3024307024ea38e0944d3e7d40474.mailgun.org>",
        "to": config.name + " <" + config.email + ">",
        "subject": "Hello ",
        "text": "Hi, \n This is your course scanner service to remind you that a new spot has shown up " +
        "on your courses " + name +
        ". Hope you go for it real quick ! " +
        "\n\n Best, \n Your faithful CatchLA"
    };
    var gun = require('webpage').create(),
        server = "https://api:key-c61f93d8f12742dab476c0a77fe6af12@api.mailgun.net/v3/sandbox64b3024307024ea38e0944d3e7d40474.mailgun.org/messages",
        data = toQueryString(body);

    gun.onConsoleMessage = function(msg, lineNum, sourceId) {
        console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };

    // Remove logging to ensure a clear interface
    //console.log("data : " + data);

    gun.open(server, 'POST', data, function(status) {
        if (status === 'success') {
            console.log("Email successfully sent");
        } else {
            console.log("Email not sent.");
        }
    });

}

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

    var MAX_LOOP = 1000; // this is set to a small number as we will implement respawning feature
    // A modification of the casper.repeat to loop forever
    casper.loopForever = function loopForever(then) {
        "use strict";
        var i = 0;
        while (i++ < MAX_LOOP) {
            this.then(then);
        }
        return this;
    };
})();


(function setUserAgent() {
    casper.userAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36');
})();


(function main() {
    var classIndex = 0;
    var classIndexMax = config.classes.length;
    var classMap = [];
    for (var i = 0; i < classIndexMax; i++) {
        classMap.push(false); // If true, then skip this search
    }

    LOG.action('Initializing...');
    casper.start(getEnrollSite(config.classes[0]));

    // Virtually infinite loop, I guess...
    casper.loopForever(function body() {
        casper.then(function wrapper() {
            if (classMap[classIndex] === false) {

                var isLoggedin = true;

                casper.thenOpen(getEnrollSite(config.classes[classIndex]));

                casper.waitForSelector('#titleText', function () {
                    //LOG.action("Successfully loaded " + this.getCurrentUrl());
                }, function timeout() {
                    if (!this.evaluate(function hasJQuery() {
                            return Boolean($);
                        })) {
                        this.page.injectJs('includes/jquery-3.2.1.min.js');
                    }

                    if (this.evaluate(function isAtLoginPage() {
                            return $('#logon').length > 0;
                        })) {
                        isLoggedin = false;
                    } else {
                        LOG.error("Unknown problem that caused timeout");
                        phantom.exit(1);
                    }
                });

                casper.then(function loginSteps() {
                    if (!isLoggedin) {
                        casper.waitForSelector('form#sso', function fillSubmitAndWaitTillLoggedIn() {
                            LOG.other('filling username and password');
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
                                phantom.exit(1);
                            }
                        }, 20000);
                    }
                }, function () {
                    LOG.error("nested login steps timed out overall");
                }, 30000);

                casper.then(function checkIfClassExists() {
                    if (this.evaluate(function isClassResultTabNotPresent() {
                            return $('.results').length === 0
                        })) {
                        LOG.error(this.getCurrentUrl());
                        LOG.error("Corresponding class " + classObjectToString(config.classes[classIndex]) + " is not available or non-existent. Please recheck your input");
                    } else {
                        var check = this.evaluate(function checkAndTickLectures() {
                            var items = $("div").filter(function () {
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
                            casper.waitForSelector('.secondarySection', function discussionLoaded() {
                                LOG.action("Discussions loaded");

                                // PhantomJS has a strange bug that would return "" when evaluate() gets null...
                                // I have to place some non-null values here...
                                // issue: https://github.com/ariya/phantomjs/issues/11268
                                var returnedDiscussion = this.evaluate(function tryEnroll() {
                                    var selectedDiscussion = {
                                        section: "",
                                        isWaitlist: false,
                                        hasSlot: false
                                    };
                                    var discussions = $('.secondarySection').find('.secondary-row');
                                    discussions.each(function () {
                                        var status = $(this).find('.statusColumn > p').text();
                                        if (status.toLowerCase().indexOf("open") !== -1) {
                                            $(this).find('.enrollColumn > input').click();
                                            selectedDiscussion = {
                                                section: $(this).find('div[tabindex="0"]').text().trim(),
                                                isWaitlist: false,
                                                hasSlot: true
                                            };
                                            return false;
                                        } else if (status.toLowerCase().indexOf("waitlist") !== -1) {
                                            $(this).find('.enrollColumn > input').click();
                                            selectedDiscussion = {
                                                section: $(this).find('div[tabindex="0"]').text().trim(),
                                                isWaitlist: true,
                                                hasSlot: true
                                            };
                                            return false;
                                        }
                                    });
                                    return selectedDiscussion;
                                });

                                if (!returnedDiscussion.hasSlot) {
                                    LOG.other("no slots available for " + classObjectToString(config.classes[classIndex]) + "...");
                                } else {
                                    // Mark this index as complete
                                    classMap[classIndex] = true;
                                    if (returnedDiscussion.isWaitlist) {
                                        LOG.must(classObjectToString(config.classes[classIndex]) + " " + returnedDiscussion.section + " has waitlist!");
                                    } else {
                                        LOG.must(classObjectToString(config.classes[classIndex]) + " " + returnedDiscussion.section + " is open!");
                                    }

                                    if (config.enroll) {
                                        // TODO: add automatic enrollment step over here!
                                    } else {
                                        sendEmail(classObjectToString(config.classes[classIndex]));
                                    }
                                }
                            })
                        } else {
                            LOG.warning("class " + classObjectToString(config.classes[classIndex]) + " full");
                        }
                    }
                });
            } else {
                LOG.warning("skipping already searched item");
            }
        }, function oneLoopTimeout() { LOG.error("one loop timeout"); }, 60000);

        // Incr class index
        casper.then(function increaseIndex() {
            classIndex++;
            if (classIndex >= classIndexMax) classIndex = 0;

            var shouldStop = true;
            for (var i = 0; i < classIndexMax; i++) {
                if (classMap[i] === false) {
                    shouldStop = false;
                }
            }

            if (shouldStop) {
                LOG.action("Complete!");
                phantom.exit(0);
            }
        });
    });

    casper.on('run.complete', function() {
        this.echo('casper terminated by loop finish');
        phantom.exit(1);
    });

    casper.run();
})();
