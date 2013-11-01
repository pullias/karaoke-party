// attach the route handlers
exports.attachHandlers = function attachHandlers(server) {
    "use strict";
    require('./auth').attachHandlers(server);
    require('./songutils').attachHandlers(server);
};