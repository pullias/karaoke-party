// attach the route handlers
exports.attachHandlers = function attachHandlers(server) {
    "use strict";
    require('./auth').attachHandlers(server);
    require('./songutils').attachHandlers(server);

    server.get('/', function (req, res) {
        res.render('home.jade', {auth: false});
    });
};