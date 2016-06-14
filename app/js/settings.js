const ipcRenderer = require('electron').ipcRenderer;
var fs = require('fs');
var nconf = require('nconf');

window.$ = window.jQuery = require('../lib/jquery-2.2.1');

// console.log(__dirname + '../configuration.json');

nconf.use('file', { file: __dirname + '/../configuration.json' });

nconf.load();

nconf.save(function (err) {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Configuration saved successfully.');
});


var list = nconf.get('list');
var completeList = nconf.get('completeList');
var updatedList;
var updatedCompleteList;

var close = document.querySelector('#close-button');

close.addEventListener('click', function (e) {
    ipcRenderer.send('close-settings-window');
});

if (list) {
$('#list-id').attr('placeholder', list);
};

if (completeList) {
$('#complete-id').attr('placeholder', completeList);
};

$('#list-id-submit')
  .unbind('click')
  .click(event => {
    event.stopPropagation()
    updatedList = $('#list-id').val();
    nconf.set('list', updatedList);
    nconf.save();
    $('#list-id-submit').text('Saved');
    list = nconf.get('list');
    console.log(list);
});

$('#complete-id-submit')
  .unbind('click')
  .click(event => {
    event.stopPropagation()
    updatedCompleteList = $('#complete-id').val();
    nconf.set('completeList', updatedCompleteList);
    nconf.save();
    $('#complete-id-submit').text('Saved');
});
