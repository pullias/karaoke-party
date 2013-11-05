// click handler for a results object in the list of song search results
var showModal = function (obj) {
    "use strict";
    var song = {artist: $(obj).find('.artist').eq(0).text(), title: $(obj).find('.title').eq(0).text()};
    $('#artist').text(song.artist);
    $('#title').text(song.title);
    $('input[name="song"]').attr('value', song.title);
    $('input[name="artist"]').attr('value', song.artist);
    $('input[name="songId"]').attr('value', $(obj).attr('data-songid'));
    $('#confirmModal').modal();
};
// click handler for delete a song button, shows confirm-deletion modal
var showDeleteModal = function (songId) {
    "use strict";
    $('a').attr('href', '/delete/' + songId);
    $('#deleteModal').modal();
};
var blinkXmas = function () {
    "use strict";
    var counter = 0,
        colors = ['red', 'green'];
    window.setInterval(function () {
        $('.header').css('color',colors[counter % colors.length]);
        counter += 1;
        $('div.h3').css('color',colors[counter % colors.length]);       
    }, 1000);
};