// This file contains the config settings which are version controlled
// use config-secrets.js for secrets
var secrets = {},
    config = {};
try {
    secrets = require('./config-secrets');
} catch (e) {
    console.log(" *** WARNING: config-secrets.js is missing, using default (non-secret) values");
}

config.hostport = process.env.WEB_PORT || 3000;
config.hostname = '10.0.1.9';
config.logger = 'dev';
if (config.hostport !== 80) {
    config.hostname += (":" + config.hostport);
}
config.cookieParserSecret = secrets.cookieParserSecret || 'keyboard cat';
config.echoNestKey = secrets.echoNestKey || 'fake_key';
config.redisStoreSecret = secrets.redisStoreSecret || 'keyboard cat';

// apply settings for production server when NODE_ENV=production
config.devOrProd = function (app) {
    "use strict";
    app.configure('production', function () {
        config.hostport = 80;
        config.hostname = 'party.pullias.com';
        config.logger = ':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time';
    });
};

module.exports = config;