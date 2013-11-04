// handle URLs relating to songs
var http = require('http'),
    redis = require('redis'),
    client = redis.createClient();

exports.attachHandlers = function attachHandlers(app) {
    "use strict";
    // handle the home page
    app.get('/', function (req, res) {
        getSongList(function (songList) {
            var auth = req.isAuthenticated(),
                user = '';
            if (auth) {
                user = req.user.email;
            }
            res.render('home.jade', {results: songList, auth: auth, user: user});
        });
    });
    // handle the song search query, restricted to logged in users
    app.post('/req', ensureAuthenticated, handleSearchPost);
    app.get('/req', function(req, res) {
        res.redirect('/');
    });
    // handle the request to add a new song to the playlist, restricted to logged in users
    app.post('/confirm', ensureAuthenticated, function (req, res) {
        var newSong = {};
        newSong.id = req.body.songId || 'missing songId';
        newSong.artist_name = req.body.artist || "missing artist";
        newSong.title = req.body.song || 'missing song';
        newSong.performerid = req.user.email;
        newSong.performer = req.user.name;
        console.log("store to db:" + JSON.stringify(newSong));
        // redis: add to 'Songs' list
        client.lpush("Songs", JSON.stringify(newSong), function () {
            res.redirect('/');
        });
    });
    // handle the request to delete a song from the playlist, restricted to logged in users
    // ensure the logged in user has access to delete the song
    app.get('/delete/:id', ensureAuthenticated, function (req, res) {
        // look for match in playlist
        getSongList(function (songList) {
            var user = req.user.email,
                i;
            for (i = 0; i < songList.length; i++) {
                if ((songList[i].id === req.params.id) && (songList[i].performerid === user)) {
                    // delete song from redis, then redirect to /
                    client.lrem('Songs', 0, JSON.stringify(songList[i]), function () {
                        res.redirect('/');
                    });
                    // break out of the loop/end the function
                    return;
                }
            }
            res.redirect('/');
        });
    });
};

// redis: call the next function with a list of song objects representing the playlist
function getSongList(next) {
    "use strict";
    client.lrange('Songs', 0, -1, function (err, jsonStringArray) {
        var songList = [],
            i;
        // convert jsonStringArray to list of song objects                
        for (i = 0; i < jsonStringArray.length; i++) {
            songList.push(JSON.parse(jsonStringArray[i]));
        }
        next(songList);
    });
}

// useful functions for handling the routes
function handleSearchPost(req, res) {
    "use strict";
    var baseUrl = 'http://developer.echonest.com/api/v4/song/search',
        apiKey = require('../config').echoNestKey,
        specialSauce = '&sort=song_hotttnesss-desc&song_type=studio&bucket=audio_summary&bucket=song_hotttnesss&bucket=artist_familiarity&results=100&min_duration=100.0&artist_min_familiarity=0.4&song_min_hotttnesss=0.4',
        // TODO - sanitize user input
        searchText = req.param('searchInput') || 'coolio',
        fullUrl = baseUrl + '?' + 'api_key=' + apiKey + '&combined=' + encodeURIComponent(searchText) + specialSauce;
    console.log("log:searchQuery:" + searchText);
    // call echonest API to search
    http.get(fullUrl, function (apiRes) {
        // the object apiRes is type IncomingMessage
        console.log('got response from echonest ' + apiRes.statusCode + '\nthe remaining rate limit is ' + apiRes.headers['x-ratelimit-remaining']);
        var body = '';
        apiRes.setEncoding('utf8');
        apiRes.on('data', function (chunk) {
            body += chunk;
        });
        // parse the JSON response and render the search results view
        apiRes.on('end', function () {
            var jsonObj = JSON.parse(body),
                resultArray = filterResults(jsonObj.response.songs);
            res.render('results.jade', { results: resultArray, performer: req.user.name});
        });
    });
}

// authentication middleware to protect restricted routes
function ensureAuthenticated(req, res, next) {
    "use strict";
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/');
}

// filter the results list from echonest
function filterResults(results) {
    "use strict";
    var filteredSongs = [],
        i,
        hash,
        song,
        prevD,
        resultList = [];

    function getDupHash(song) {
        return song.artist_id + song.song_hotttnesss;
    }

    // duplicate songs will have the same song_hotttnesss
    // select the duplicate with the highest danceability
    // TODO - keep the shorter title
    for (i = 0; i < results.length; i++) {
        hash = getDupHash(results[i]);
        song = filteredSongs[hash];
        prevD = 0;
        if (song !== undefined) {
            prevD = song.audio_summary.danceability;
        }
        if (results[i].audio_summary.danceability > prevD) {
            filteredSongs[hash] = results[i];
        }
    }
    // convert hash to list
    for (song in filteredSongs) {
        if (filteredSongs.hasOwnProperty(song)) {
            // calculate K-score
            filteredSongs[song].k = Math.round(100 * (filteredSongs[song].audio_summary.danceability + 3 * filteredSongs[song].song_hotttnesss + 2 * filteredSongs[song].artist_familiarity) / 5);
            resultList.push(filteredSongs[song]);
        }
    }
    // sort by K score
    resultList.sort(function (a, b) {
        return (b.k - a.k);
    });
    return resultList;
}