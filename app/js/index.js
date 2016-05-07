const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const storage = require('electron-json-storage');
var async = require('async');

window.$ = window.jQuery = require('./lib/jquery-2.2.1');


// patch window.open so it will not have nodeIntegration in opened windows
var _wopen = window.open;
window.open = function (a, b, c) {
    console.debug('window.open proxy call:', arguments);
    c = c || '';
    var ca = c.split(',');
    ca.push('nodeIntegration=0');
    c = ca.join(',');
    var win = _wopen.call(window, a, b, c);
    return win;
};

var ttSettings = require('./settings');
var Twit = require('twit');
var Trello = require('./lib/client-enode')(window, jQuery, ttSettings.connection);
var bootstrap = require('bootstrap');
var loadingMessage = "Loading";
var clearTime;
// var jqueryNumbers = require('./lib/jquery.number.js');

var T = new Twit({
  consumer_key:         'Smxc5So9dx0pSzZ25oj1ahwNP',
  consumer_secret:      'nehOKVEn3CcaKkxXUarDImf8PoQlOtEkWJIbnYWtnT9u2M8TgQ',
  access_token:         '23528255-YmkZONLCSP77hHICezQzrNNWGBip2rgH6aStOUNxp',
  access_token_secret:  'QqQNSGetxO8C48fp7TGCTnGucuzaqUYYG5zF4FSGSTDPp',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})



jQuery(document).ready(function ($) {
    //do jQuery stuff when DOM is ready
    var $welcome;
    var $loading;
    var cardsInList;
    var cardTimer;
    var momentum = 0;
    var date = new Date();
    var dateNum = date.getDate();
    // ipcRenderer.send('load-size');


    // T.getAuth()
    T.get('statuses/user_timeline', { user_id: '4615983616', count: 1 }, function (err, data, response) {
      if (data) {
        var rawTweet = data[0].text;
        var parseIndex = rawTweet.indexOf("via");
        welcomeMessage = rawTweet.slice(0, parseIndex - 2);

        // storage.set('welcomeMessage', {type: 'loader', quote: loadingMessage}, function (error) {
        //     if (error) throw error;
        // });
        $welcome = $("<div>")
            .addClass('welcome')
            .text(welcomeMessage)
            .appendTo("#welcome-message");
            if (welcomeMessage.length > 38) {
              $('.welcome').css({'font-size':14});
            }
            else if (welcomeMessage.length > 60) {
              $('.welcome').css({'font-size':12});
            }
      }
    })



    // storage.get("loadingMessage", function (error, data) {
    //     if (error) throw error;
    //     loadingMessage = data.quote;
    //     authStart();
    // });

    // var authStart = function() {
    //   storage.get('authStatus', function (error, data) {
    //       if (error) throw error;
    //
    //       if (data.auth === true) {
              // $("#connectLink").ready(function doAuth() {
              //     Trello.authorize({
              //         type: 'popup',
              //         name: "Toptask",
              //         scope: {
              //             read: true,
              //             write: true
              //         },
              //         expiration: 'never',
              //         success: onAuthorize,
              //         error: (err)=> console.debug('Trello error', err),
              //     });
              //
              // });
          // }

          // else {
    $("#connectLink").click(function doAuth() {
        Trello.authorize({
            type: 'popup',
            name: "Toptask",
            scope: {
                read: true,
                write: true
            },
            expiration: 'never',
            success: onAuthorize,
            error: (err)=> console.debug('Trello error', err),
        });
    });
    //       }
    //
    //     });
    //     // if (callback) {
    //     //   callback();
    //     // }
    // };



    var onAuthorize = function () {
        updateLoggedIn();
        $("#welcome-message").empty();
        ipcRenderer.send('load-size');
        $loading = $("<div>")
            .addClass('loading')
            .text("Loading")
            .appendTo("#welcome-message");
        getList();

        // storage.set('authStatus', {auth: Trello.authorized()}, function (error) {
        //     if (error) throw error;
        // });
    };

    //TRELLO FUNCTIONS

    var getList = function () {

        $('#cardOutput').empty();
        $('#listOutput').empty();
        $('.toggle').hide();

        Trello.members.get("me", (member)=> {

            // Trello.get("members/me/boards", (boards)=> {
            //   Trello.get("boards/52a964092424e6632f0d6921/lists", (lists)=> {
            //     Trello.get("lists/55d26f54726fb67f022db618/cards", (cards)=> {
            Trello.get("lists/" + ttSettings.tids.list + "/cards", (cards)=> { //
                // console.debug(cards);
                cardsInList = [];

                var $listOutput = $("#listOutput");
                var listName = "PRIORITY";
                var $list = $("<div class='listName'>" + listName + "</div>")
                    .appendTo("#listOutput");

                $("<div class='listDrag'></div>").appendTo("#listOutput");

                $.each(cards, function (ix, card) {

                    cardsInList.push(card.id);

                    var cardNumber = $listOutput.children().length;
                    $listOutput.append('<div class="cardContainer" id="cardNumber' + $listOutput.children().length + '"></div>');

                    cardDisplay(card, cardNumber);

                });

                ipcRenderer.send('set-size', 269, 30 + $listOutput.outerHeight());
                $('#welcome-loading').hide();

            })
        });
    };

    //DISPLAYS CARD CORRECTLY ON LISTS AND CARD SELECTION

    var cardDisplay = function (displayCard, cardNumber) {

        var $cardNumber = $('#cardNumber' + cardNumber);

        var labelLength = displayCard.labels.length;
        var labelSort = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        for (var i = 0; i < labelLength; i++) {

            var cardLabel = displayCard.labels[i].color;

            switch (cardLabel) {

                case "green":
                    labelSort.splice(0, 1, 'green');
                    break;

                case "red":
                    labelSort.splice(3, 1, 'red');
                    break;

                case "sky":
                    labelSort.splice(6, 1, 'sky');
                    break;

                case "orange":
                    labelSort.splice(2, 1, 'orange');
                    break;

                case "yellow":
                    labelSort.splice(1, 1, 'yellow');
                    break;

                case "blue":
                    labelSort.splice(5, 1, 'blue');
                    break;

                case "pink":
                    labelSort.splice(8, 1, 'pink');
                    break;

                case "lime":
                    labelSort.splice(7, 1, 'lime');
                    break;

                case "purple":
                    labelSort.splice(4, 1, 'purple');
                    break;

                case "black":
                    labelSort.splice(9, 1, 'black');
                    break;

                default:
                    console.log("No label");
            }
        }

        for (var i = 0; i < labelSort.length; i++) {
            cardLabel = labelSort[i];

            switch (cardLabel) {

                case "green":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#61bd4f")
                        .appendTo($cardNumber);
                    break;

                case "red":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#eb5a46")
                        .appendTo($cardNumber);
                    break;

                case "sky":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#00c2e0")
                        .appendTo($cardNumber);
                    break;

                case "orange":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#ffab4a")
                        .appendTo($cardNumber);
                    break;

                case "yellow":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#f2d600")
                        .appendTo($cardNumber);
                    break;

                case "blue":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#0079bf")
                        .appendTo($cardNumber);
                    break;

                case "pink":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#ff80ce")
                        .appendTo($cardNumber);
                    break;

                case "lime":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#51e898")
                        .appendTo($cardNumber);
                    break;

                case "purple":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#c377e0")
                        .appendTo($cardNumber);
                    break;

                case "black":
                    $("<div class=cardLabel></div>")
                        .css("background-color", "#4d4d4d")
                        .appendTo($cardNumber);
                    break;

                default:
                // console.log("No label");
            }
        }

        //GET CARD NAME AND APPEND TO CARDOUTPUT

        var $card = $("<div>")
            .appendTo($cardNumber);

        $card.empty();
        $("<a>")
            .addClass("cards")
            .text(displayCard.name)
            .appendTo($card);

        //GET CARD BADGES AND APPEND TO CARDOUTPUT

        if (displayCard.badges.description === true) {
            $('<span>')
                .addClass("icon-sm icon-description badge-spacer")
                .appendTo($cardNumber);
        }

        if (displayCard.badges.comments > 0) {
            $('<span>')
                .addClass("icon-sm icon-comment badge-spacer")
                .appendTo($cardNumber);
            $('<span>')
                .addClass("badge-text")
                .text(displayCard.badges.comments)
                .appendTo($cardNumber);
        }

        if (displayCard.badges.checkItems > 0) {
            $('<span>')
                .addClass("icon-sm icon-checklist badge-spacer")
                .appendTo($cardNumber);
            $('<span>')
                .addClass("badge-text")
                .text(displayCard.badges.checkItemsChecked + "/" + displayCard.badges.checkItems)
                .appendTo($cardNumber);
        }

        $cardNumber.click(function () {
            $(this).siblings().remove();
            ipcRenderer.send('set-size', 269, 15 + $('#listOutput').outerHeight());
            cardAction(displayCard, cardNumber);
        });

    };

    // GIVES SINGLE CARD VIEW ON HOVER TOGGLE ACTIONS

    var cardAction = function (currentCard, cardNumber) {

        var timeHasBeenAdjusted = false;
        var startTime = 0;

        $(".toggle").show();

        $(".toggle").click(function (event) {
            event.preventDefault();
            $("div.overlay").fadeToggle("fast");

        });

        $(".toggle")
            .mouseover(function () {
                $('.icons').show();
            })
            .mouseout(function () {
                $('.icons').hide();
            });

        $(".toggle")
            .unbind('click')
            .click(function () {
                ipcRenderer.send('trello-open', currentCard.url);
            });

        $(".back")
            .unbind('click')
            .click(event=> {
                event.stopPropagation();
                ipcRenderer.send('load-size');
                $('#welcome-loading').show();
                $('#listOutput').empty();

                if (timeHasBeenAdjusted) {
                  var labelTimeFuncs = currentCard.labels.reduce((accu, label)=> {
                      accu.push(callback=>saveLabelTime(label.id, label.name, secondsTimer - startTime, callback));
                      console.log(secondsTimer);
                      console.log(startTime);
                      return accu
                  }, []);
                  // console.debug('back labelTimeFuncs', labelTimeFuncs);
                  var flow = [
                      (callback)=> saveNewCardTime(currentCard.id, currentCard.name, secondsTimer, callback),
                  ].concat(labelTimeFuncs, [
                      (callback)=> {
                          clearTime();
                          logTime(callback);
                      }
                  ]);
                  timeHasBeenAdjusted = false;
                }

                else {
                  var labelTimeFuncs = currentCard.labels.reduce((accu, label)=> {
                      accu.push(callback=>saveLabelTime(label.id, label.name, secondsTimer, callback));
                      return accu
                  }, []);
                  // console.debug('back labelTimeFuncs', labelTimeFuncs);
                  var flow = [
                      (callback)=> saveCardTime(currentCard.id, currentCard.name, secondsTimer, callback),
                  ].concat(labelTimeFuncs, [
                      (callback)=> {
                          clearTime();
                          logTime(callback);
                      }
                  ]);
                }

                async.series(flow, (err, results)=> {
                    getList();
                });
            });

        $(".tick")
            .unbind('click')
            .click(event => {
                event.stopPropagation();
                $('.toggle').hide();
                // momentum += 1;
                // console.log(momentum);
                $('#welcome-loading').show();
                var nextCardId = cardsInList[cardsInList.indexOf(currentCard.id) + 1];
                // console.debug({currentCard, cardsInList});

                var labelTimeFuncs = currentCard.labels.reduce((accu, label)=> {
                    accu.push((callback)=>saveLabelTime(label.id, label.name, secondsTimer, callback));
                    return accu;
                }, []);
                // console.debug('tick labelTimeFuncs', labelTimeFuncs);
                var flow = [
                    (callback)=> completeCard(currentCard.id, callback),
                    (callback)=> saveCardTime(currentCard.id, currentCard.name, secondsTimer, callback),
                ].concat(labelTimeFuncs);

                // https://github.com/caolan/async#seriestasks-callback
                async.series(flow, (err, results)=> {
                    clearTime();
                    if (nextCardId != null) {
                        cardSelected(nextCardId, cardNumber);
                    } else {
                        ipcRenderer.send('load-size');
                        $('#welcome-loading').show();
                        $('#listOutput').empty();
                        getList();
                        // location.reload();
                    }
                });
            });

        $(".drag")
            .click(event=> {
                event.stopPropagation();
            });

        ipcRenderer.on("refresh-card", function () {
            saveCardTime(currentCard.id, currentCard.name, secondsTimer);
            for (i = 0; i < currentCard.labels.length; i++) {
                saveLabelTime(currentCard.labels[i].id, currentCard.labels[i].name, secondsTimer);
            }
            clearTime();
            onAuthorize();
        });

        var completeCard = function (cardId, callback) {
            Trello.put("cards/" + cardId + "/idList", {value: ttSettings.tids.completeList})
                .then(d=>callback(null, d))
                .fail(e=>callback(e));
        };

        var cardTimer = function () {
            setInterval(()=> {
                $cardNumber.toggleClass('pulse');
            }, 900000);
        };

        timer();
        cardTimer();

        var h1 = document.getElementsByTagName('h1')[0],
            stop = document.getElementById('stop')
            h1.textContent = "00:00";
            seconds = 0, minutes = 0, hours = 0,
            t;

        var secondsTimer = 0;

        storage.get(currentCard.id, function (error, data) {
            if (error) throw error;
            if (data.time) {
                timeDisplay(data.time);
            }
            else {
                seconds = 0;
                minutes = 0;
                hours = 0;
            }
        });

        $('#stop')
            .unbind('click')
            .click(event => {
            event.stopPropagation()
            $(".time-display").toggleClass("time-adjust");
            stopStart();
        });

        var stopStart = function () {

          var $timedisplay = $(".time-display").hasClass("time-adjust");

            var timeInput = function () {
              var inputHours = parseInt(document.getElementById("input-hours").value);
              var inputMinutes = parseInt(document.getElementById("input-minutes").value);
              if (inputHours != hours || inputMinutes != minutes) {
                timeHasBeenAdjusted = true;
              }
              hours = inputHours;
              minutes = inputMinutes;
              seconds = ((hours * 60) + minutes) * 60;
              secondsTimer = seconds;
              console.log(secondsTimer);
              console.log(startTime);
            };

            if ($timedisplay === true) {
              console.log("time-adjust turned on");
              clearTimeout(t);
              $(".time-display > h1").hide();
              $('<form id="time-input" onsubmit="return false"><input class="input-time" id="input-hours" max="99" value=' + (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ' type="number"/><p id="colon" class="input-time">:</p><input class="input-time" id="input-minutes" value=' + (minutes ? (minutes > 9 ? (minutes > 59 ? (minutes % 60) : minutes) : "0" + minutes) : "00") + ' max="59" type="number"/></form>')
              .appendTo('#time-switch');
              $('#time-input')
                .unbind('click')
                .click(event => {
                event.stopPropagation()
              });

            }

            else {
              console.log("time-adjust turned off");
              timeInput();
              $('#time-switch').empty();
              $(".time-display > h1").show();
              h1.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? (minutes > 59 ? (minutes % 60) : minutes) : "0" + minutes) : "00");
              timer();
            }
        };

        var clearTime = function() {
            clearTimeout(t);
            secondsTimer = 0;
            h1.textContent = "00:00";
            seconds = 0;
            minutes = 0;
            hours = 0;
        };

        var timeDisplay = function (time) {
            startTime = time;
            var cardSeconds = time - (Math.floor(time / 60) * 60);
            var cardMinutes = Math.floor(time / 60);
            var cardHours = Math.floor(time / 3600);
            seconds = seconds + cardSeconds;
            minutes = minutes + cardMinutes;
            hours = hours + cardHours;
        };

        function add() {
            seconds++;
            secondsTimer++;
            if (seconds >= 60) {
                seconds = 0;
                minutes++;
                if (minutes >= 60) {
                    minutes = 0;
                    hours++;
                }
            }

            h1.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? (minutes > 59 ? (minutes % 60) : minutes) : "0" + minutes) : "00");
            timer();
        }

        function timer() {
            t = setTimeout(add, 1000);
        }

    };


// SELECTS AN INDIVIDUAL CARD TO DISPLAY

    var cardSelected = function (selectedCard, cardNumber) {

        var $cardNumber = $('#cardNumber' + cardNumber);

        $cardNumber.empty();

        Trello.get("cards/" + selectedCard, function (card) {

            cardDisplay(card, cardNumber);
            cardAction(card, cardNumber);
            ipcRenderer.send('set-size', 269, 15 + $cardNumber.outerHeight());
            $('#welcome-loading').hide();

        });

    };

// SAVES TIME SPENT ON CARD

    var saveTime = function (keyType, keyId, keyName, time, callback) {

        // console.debug('saveTime', arguments);

        var totalTime = time;

        storage.get(keyId, function (error, data) {
            if (error) throw error;

            if (data.time) {
                totalTime += data.time;
            }
            storage.set(keyId, {type: keyType, name: keyName, time: totalTime}, (error)=> {
                if (error) throw error;
                // console.log(keyId + " " + keyName + " " + totalTime);
                callback(null, totalTime); // success
            });
        });

    };

    var saveNewTime = function (keyType, keyId, keyName, time, callback) {

        // console.debug('saveTime', arguments);

        var totalTime = time;

        storage.set(keyId, {type: keyType, name: keyName, time: totalTime}, (error)=> {
            if (error) throw error;
            console.log(keyId + " " + keyName + " " + totalTime);
            callback(null, totalTime); // success
        });
    };

    var saveLabelTime = saveTime.bind(null, 'label');
    var saveCardTime = saveTime.bind(null, 'card');
    var saveNewCardTime = saveNewTime.bind(null, 'card');

// LOGS PRODUCTIVITY STATS TO CARD

    var logTime = function (callback) {

        var tdata = {card: [], label: []};

        storage.keys((err, keys)=> {
            // console.debug('logTime storage.keys', err, keys);
            // storage.keys returns irelevant data - ... "authStatus", "Cache", "Cookies", "Cookies-journal", "Local Storage", "Preferences"]
            // you need to rethink what you store and how you query relevant data
            // because here you need only card ids, but getting also label ids + irrelevant data above

            // https://github.com/caolan/async
            async.mapSeries(keys, (name, cb)=> storage.get(name, (error, data)=> {
                // console.debug('logTime data', error, data);
                // if (error) return cb(error);
                if (data['type'] == 'card' && data['time'] > 60 || data['type'] == 'label' && data['time'] > 60 ) {
                    // console.debug('tdata', [tdata, data['type'], tdata[data['type']]]);
                    tdata[data['type']].push(data);
                }
                return cb(null, 1);
            }), (err, result) => {
                if (!err) {
                    // var _grabTime = (acc, cur)=>acc += cur.name + ' - ' + Math.floor(cur.time / 60) + ' minute(s)\n';
                    var _grabTime = (acc, cur)=>acc += cur.name + ' - ' + Math.floor(cur.time / 60) + (Math.floor(cur.time / 60) > 1 ? ' minutes\n' : ' minute\n' );
                    var cardtime = tdata.card.reduce(_grabTime, '');
                    var labeltime = tdata.label.reduce(_grabTime, '');

                    var trelloTime = "**TASKS:**\n" + "\n" + cardtime + "\n\n**LABELS:**\n" + "\n" + labeltime;
                    // console.debug('trelloTime', {trelloTime, cardtime, labeltime});
                    Trello.put('/cards/' + ttSettings.tids.card + '/desc', {value: trelloTime})
                        .always((o, e, d)=>callback(e, d));
                } else {
                    // need to return from async anyway
                    callback(err, false)
                }
            });
        });
    };

    ipcRenderer.on("log-out", function () {
        logout();
        location.reload();
    });

    ipcRenderer.on('global-shortcut', function (arg) {
        location.reload();
    });

    ipcRenderer.on('founder-mantra', function (arg) {
        console.log(arg);
    });

    var ellipsis = {
        'value': ['', '.', '..', '...'],
        'count': 0,
        'run': false,
        'timer': null,
        'element': '.ellipsis',
        'start': function () {
            var t = this;
            this.run = true;
            this.timer = setInterval(function () {
                if (t.run) {
                    $(t.element).html(t.value[t.count % t.value.length]).text();
                    t.count++;
                }
            }, 250);
        },
        'stop': function () {
            this.run = false;
            clearInterval(this.timer);
            this.count = 0;
        }
    };

    $("#zoom a").click(function (e) {
            var $body = $("body");
            var newClass = $(this).attr('class');
            $body.removeClass("default pulse pulse-wide").addClass(newClass);
            e.preventDefault();
        }
    );

//TRELLO AUTH

    var updateLoggedIn = function () {
        var isLoggedIn = Trello.authorized();
        $("#loggedout").toggle(!isLoggedIn);
        $("#loggedin").toggle(isLoggedIn);
    };

    var logout = function () {
        Trello.deauthorize();
        updateLoggedIn();
        storage.set('authStatus', {auth: Trello.authorized()}, function (error) {
            if (error) throw error;
        });
    };


    $("#disconnect").click(logout);

// end jQuery(document).ready
});
