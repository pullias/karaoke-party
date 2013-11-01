// File contains code relating to the google login functionality
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var config = require('../config');

// configure passport google strategy
passport.serializeUser(function (user, done) {
    // parse out useful parts of the profile
    // no need to store to DB, user profile will be available as req.user
    "use strict";
    var newUser = {};
    newUser.id = user.identifier || 'no identifier';
    newUser.email = user.emails[0].value || 'no email';
    newUser.name = user.displayName || 'no name';
    done(null, newUser);
});
passport.deserializeUser(function (obj, done) {
    // nothing to do, the object is the entire user profile
    "use strict";
    done(null, obj);
});
passport.use(new GoogleStrategy({
    returnURL: 'http://' + config.hostname + '/auth/google/return',
    realm: 'http://' + config.hostname
},
    function (identifier, profile, done) {
        "use strict";
        profile.identifier = identifier;
        return done(null, profile);
    }
    ));

// initialize passport middleware and add routing handlers
exports.attachHandlers = function attachHandlers(router) {
    "use strict";
    router.use(passport.initialize());
    router.use(passport.session());
    router.get('/auth/google',
        passport.authenticate('google'));
    router.get('/auth/google/return',
        passport.authenticate('google', {failureRedirect: '/'}),
        function (req, res) {
            res.redirect('/');
        });
    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
};