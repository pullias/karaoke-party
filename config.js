// This file contains the config settings which are version controlled
// use config-secrets.js for secrets
var secrets = require('./config-secrets');
var config = {};

config.hostport = process.env.WEB_PORT || 3000;
config.hostname = 'localhost';
if (config.hostport !== 80) {
    config.hostname += (":" + config.hostport);
}
config.cookieParserSecret = secrets.cookieParserSecret || 'keyboard cat';
config.echoNestKey = secrets.echoNestKey || 'fake_key';

// apply settings for production server when NODE_ENV=production
config.devOrProd = function (app) {
    "use strict";
    app.configure('production', function () {
        config.hostport = 80;
        config.hostname = 'party.pullias.com';
    });
};

module.exports = config;