// handle URLS relating to songs
var http = require('http');
var redis = require('redis');
var client = redis.createClient();

exports.attachHandlers = function attachHandlers(app) {
    "use strict";
    app.get('/req', ensureAuthenticated, function (req, res) {
        res.render('searchform.jade');
    });
    app.post('/req', ensureAuthenticated, handleSearchPost);
    app.get('/confirm', ensureAuthenticated, function (req, res) {
        var user = req.user.name || "default user",
            title = req.query.title,
            artist = req.query.artist_name;
        // store song info in session
        req.session.song = req.query;
        res.render('confirm.jade', {title: title, artist: artist, user: user});
    });
    app.post('/confirm', ensureAuthenticated, function (req, res) {
        var newSong = {};
        newSong.id = req.session.song.id;
        newSong.artist_name = req.session.song.artist_name;
        newSong.title = req.session.song.title;
        newSong.performerid = req.user.email;
        newSong.performer = req.user.name;
        console.log("store to db:" + JSON.stringify(newSong));
        client.lpush("Songs", JSON.stringify(newSong), redis.print);
        res.redirect('/list');
    });
    app.get('/list', function (req, res) {
        client.lrange('Songs', 0, -1, function (err, obj) {
            var songlist = [],
                song = {},
                songObj = {};
            for (song in obj) {
                if (obj.hasOwnProperty(song)) {
                    songObj = JSON.parse(obj[song]);
                    songlist.push(songObj);
                }
            }
            res.render('list.jade', {results: songlist});
        });
    });
    app.get('/delete/:id', ensureAuthenticated, function (req, res) {
        // look for match in playlist
        client.lrange('Songs', 0, -1, function (err, obj) {
            var match = {},
                song = {},
                songObj = {},
                user = {};
            for (song in obj) {
                if (obj.hasOwnProperty(song)) {
                    songObj = JSON.parse(obj[song]);
                    user = req.user.email || "no user";
                    if ((songObj.id === req.params.id) && (user === songObj.performerid)) {
                        match = obj[song];
                    }
                }
            }
            client.lrem('Songs', 0, match);
            res.redirect('/list');
        });
    });
};

// useful functions for handling the routes

function handleSearchPost(req, res) {
    "use strict";
    var baseUrl = 'http://developer.echonest.com/api/v4/song/search',
        apiKey = require('../config').echoNestKey,
        specialSauce = '&sort=song_hotttnesss-desc&song_type=studio&bucket=audio_summary&bucket=song_hotttnesss',
        searchText = req.param('userinput') || 'coolio',
        fullUrl = baseUrl + '?' + 'api_key=' + apiKey + '&combined=' + searchText + specialSauce,
        resultArray = [];

    // call echonest API to search
    http.get(fullUrl, function (apiRes) {
        // the object apiRes is type IncomingMessage
        console.log('got response from echonest ' + apiRes.statusCode);
        console.log('the remaining rate limit is ' + apiRes.headers['x-ratelimit-remaining']);
        var body = '',
            i,
            song;
        apiRes.setEncoding('utf8');
        apiRes.on('data', function (chunk) {
            body += chunk;
        });
        apiRes.on('end', function () {
            var jsonObj = JSON.parse(body);
            resultArray = filterResults(jsonObj.response.songs);
            for (i = 0; i < resultArray.length; i++) {
                song = resultArray[i];
                resultArray[i].link = '/confirm?artist_name=' + encodeURIComponent(song.artist_name) + '&title=' + encodeURIComponent(song.title) + '&id=' + encodeURIComponent(song.id);
            }
            res.render('results.jade', { results: resultArray});
        });
    });
}

// authentication middleware to protect restricted routes
function ensureAuthenticated(req, res, next) {
    "use strict";
    if (req.isAuthenticated()) { return next(); }
    req.session.next = req.path;
    res.redirect('/auth/google');
}

// filter the results list from echonest
function filterResults(results) {
    "use strict";
    var dups = {},
        filteredSongs = [],
        i;

    function getDupHash(song) {
        return song.artist_id + song.song_hotttnesss;
    }

    function isGoodSong(song) {
        var hash = getDupHash(song);
        if (!(hash in dups)) {
            dups[hash] = song;
            return true;
        }
        return false;
    }

    for (i = 0; i < results.length; i++) {
        if (isGoodSong(results[i])) {
            filteredSongs.push(results[i]);
        }
    }
    return filteredSongs;
}