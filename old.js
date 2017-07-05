/**
 * Created by kevinqian on 7/5/17.
 */
var casper = require('casper').create({
    verbose: true,
    logLevel: "info",
    pageSettings: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11"
    }
});
var fs = require('fs');
var SITES = {
    CLASS_PLAN: "https://be.my.ucla.edu/ClassPlanner/ClassPlan.aspx"
};

var getEnrollSite() {
    return "https://sa.ucla.edu/ro/ClassSearch/Results?t=17F&sBy=subject&sName=Computer+Science+%28COM+SCI%29&subj=COM+SCI&crsCatlg=1+-+Freshman+Computer+Science+Seminar&catlg=0001&cls_no=%25&btnIsInIndex=btn_inIndex&btnIsExchange=False"
}

phantom.cookiesEnabled = true;

var LOG = {
    action: function(msg) {
        console.log("ACTION: " + msg);
    },
    error: function(msg) {
        console.error("ERROR: " + msg);
    },
    warning: function(msg) {
        console.error("WARNING: " + msg);
    },
    hint: function(msg) {
        console.log("HINT: " + msg);
    },
    other: function(msg) {
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


var config;
(function readConfig() {
    config = JSON.parse(fs.read('config.json', 'utf8'));
})();


(function main() {

    LOG.action('initializing...');
    casper.start(SITES.CLASS_PLAN);

    // Virtually infinite loop, I guess...
    casper.repeat(100000, function body() {
            var isLoggedin = false;

            casper.waitForUrl(/^https:\/\/shb\.ais\.ucla\.edu\/shibboleth\-idp/,
                function onRedirect() {
                    LOG.action("URL has changed to " + this.getCurrentUrl() + ", should be UCLA LOGIN page");
                }, function checkIfNoNeedToLogin() {
                    isLoggedIn = this.evaluate(function amIOnClassPlanner() {
                        return $('interior-split-page-header-full').length !== 0;
                    });
                });

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

                casper.waitForUrl(/^https:\/\/be\.my\.ucla\.edu\/ClassPlanner\/ClassPlan\.aspx/, function classPlanLoaded() {
                    LOG.action('Class Plan loaded');
                }, function timeout() {
                    if (this.evaluate(function checkIfLoginInvalid() {
                            return $('.error-box-lite.login-fail').length;
                        })) {
                        LOG.error("Invalid login info provided");
                    } else {
                        LOG.error('Waiting too long, timed out');
                    }
                }, 20000);

                casper.then(function editTermCookie() {
                    var cookies = this.page.cookies;
                    var regex = /^iwe_term_enrollment_urn/;

                    LOG.other("Cookies: ");
                    for (var i in cookies) {
                        LOG.other(cookies[i].name + '=' + cookies[i].value);
                        if (regex.test(cookies[i].name)) {
                            cookies[i].value = config.term;
                        }
                    }
                });
            }

            if (!config.enroll) {
                casper.thenOpen()
            } else {
                casper.then(function reloadToGetTerm() {
                    this.reload();
                })
            }

            casper.waitForSelector('#panelSearch', function () {

            });
        }
    );

    casper.run();
})();