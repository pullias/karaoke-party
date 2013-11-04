var express = require('express');
var routes = require('./routes');
var path = require('path');
var http = require('http');
var config = require('./config');
var RedisStore = require('connect-redis')(express);

var app = express();
config.devOrProd(app);

// all environments
app.set('port', config.hostport);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(config.cookieParserSecret));
app.use(express.session({store: new RedisStore(), secret: config.redisStoreSecret}));
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

// attach the custom handlers
routes.attachHandlers(app);


http.createServer(app).listen(app.get('port'), function () {
    "use strict";
    console.log('Express server listening on port ' + app.get('port'));
});


