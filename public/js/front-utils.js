// click handler for a results object in the list of song search results
var showModal = function (obj) {
    var song = {artist: $(obj).find('.artist').eq(0).text(), title: $(obj).find('.title').eq(0).text()};
    $('#artist').text(song.artist);
    $('#title').text(song.title);
    $('input[name="song"]').attr('value', song.title);
    $('input[name="artist"]').attr('value', song.artist);
    $('input[name="songId"]').attr('value', $(obj).attr('data-songid'));
    $('#confirmModal').modal();
}