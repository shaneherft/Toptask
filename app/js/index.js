const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const storage = require('electron-json-storage');
var async = require('async');
var _ = require('lodash');

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
var fs = require('fs');
var nconf = require('nconf');
var loadingMessage = "Loading";
var clearTime;

var T = new Twit({
  consumer_key:         'Smxc5So9dx0pSzZ25oj1ahwNP',
  consumer_secret:      'nehOKVEn3CcaKkxXUarDImf8PoQlOtEkWJIbnYWtnT9u2M8TgQ',
  access_token:         '23528255-YmkZONLCSP77hHICezQzrNNWGBip2rgH6aStOUNxp',
  access_token_secret:  'QqQNSGetxO8C48fp7TGCTnGucuzaqUYYG5zF4FSGSTDPp',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

nconf.use('file', { file: __dirname + '/configuration.json' });

  nconf.load();
  var logCard = nconf.get('card');
  var currentList = nconf.get('list');
  var completeList = nconf.get('completeList');
  var currentBoard = nconf.get('board');

  nconf.save(function (err) {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Configuration saved successfully.');
  });

  ipcRenderer.on('new-settings', function () {
      location.reload();
  });


jQuery(document).ready(function ($) {
    //do jQuery stuff when DOM is ready
    ipcRenderer.setMaxListeners(1);
    var $welcome;
    var $loading;
    var cardsInList;
    var cardTimer;
    var welcomeMessage = "Welcome to Toptask, have a productive day!"

    var today = new Date();

    var dayOfWeek = today.getDay();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    var daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    var dayCounter = dayOfWeek;

    if (currentList == null) {
      listSelector();
    }

    if(dd<10) {
      dd='0'+dd
    }

    if(mm<10) {
      mm='0'+mm
    }

    var loadCheck = function () {

      return new Promise( function (resolve, reject) {

        for ( i = 0; i < 6; i++ ) {
          if (navigator.onLine) {
            console.log("triggered");
            return resolve(true);
          }
          else if (i === 5) {
            reject("No Internet Connection");
          }
          else {
            console.log("No Internets!");
          }
        };

      });
    };

    var logDate = (dd === 1 ? dd : dd - 1) +'/'+ mm +'/'+yyyy;

      T.get('statuses/user_timeline', { user_id: '4615983616', count: 1 }, function (err, data, response) {

        if (data) {
          var rawTweet = data[0].text;
          var parseIndex = rawTweet.indexOf("via");
          welcomeMessage = rawTweet.slice(0, parseIndex - 2);
          welcomeMessage = welcomeMessage + ".";
        }

        else {
          welcomeMessage = "Welcome to Toptask, have a productive day!"
        }

        $welcome = $("<div>")
            .addClass('welcome')
            .text(welcomeMessage)
            .appendTo("#welcome-message");

        ipcRenderer.send('set-size', 349, 30 + $welcome.outerHeight());

      });

    $("#connectLink").click(function doAuth() {
        Trello.authorize({
            type: 'popup',
            name: "TopTask",
            scope: {
                read: true,
                write: true
            },
            expiration: 'never',
            success: onAuthorize,
            error: (err)=> console.debug('Trello error', err)
        });
    });

    var onAuthorize = function () {

        updateLoggedIn();

        nconf.set('authStatus', Trello.authorized());
        nconf.save()

        $("#welcome-message").empty();
        welcomeMessage = "";
        ipcRenderer.send('load-size');
        $loading = $("<div>")
            .addClass('loading')
            .text("Loading")
            .appendTo("#welcome-message");

        var setDate = function() {

          Date.prototype.getNextWeekSunday = function() {
            var d = new Date(this.getTime());
            var diff = d.getDate() - d.getDay();
            // if (d.getDay() == 0) {
              diff += 7;
            // }
            return new Date(d.setDate(diff));
          };

          var nextSunday = today.getNextWeekSunday();
          nextSunday.setHours(0,0,0,0);

          console.log(nextSunday);

          storage.set('date', {date: nextSunday}, function (error) {
              if (error) throw error;
          });
        };

        var clearStorage = function(callback) {
          storage.clear(function(error) {
            if (error) throw error;
            callback(setDate);
          });
        }

        var checkDate = function(callbackSet, callbackClear) {

          storage.get('date', function (error, data) {
            if (error) throw error;
            var storedDate = new Date(data.date);

            var creationSuccess = function(data) {
              nconf.set('card', data.id);
              nconf.save()
              logCard = data.id;
            };

            var newCard = {
              name: 'Weekly Progress',
              // idLabels: '55a35d27fb396fe706fb7b1e',
              idList: currentList,
              pos: 'bottom'
            };

            if (today > storedDate) {
              Trello.put('/cards/' + logCard, {name: 'Weekly Progress - ' + 'ending ' + logDate});
              Trello.post('/cards/', newCard, creationSuccess);
              callbackClear(setDate, clearStorage);
            }

            else if (logCard == null) {
              Trello.post('/cards/', newCard, creationSuccess);
              callbackClear(setDate, clearStorage);
            }

            else {
              callbackSet(setDate);
            }
          });
        };
        checkDate(setDate, clearStorage);
        getList();
    };

    //TRELLO FUNCTIONS

    var getList = function () {

        $('#cardOutput').empty();
        $('#listOutput').empty();
        $('.toggle').hide();
        var selectedList;

        currentList = nconf.get('list');

        Trello.members.get("me", (member)=> {

            // Trello.get("lists/" + currentList, (list)=> {
            //   var activeList = list;
            //   selectedList = activeList.name;
            // });

            Trello.get("lists/" + currentList + "/cards", (cards)=> { //
                // console.debug(cards);
                cardsInList = [];
                var $listOutput = $("#listOutput");
                var listName = "PRIORITY";
                var $list = $("<div class='listName'>" + listName + "</div>")
                    .appendTo("#listOutput");

                $("<div class='listDrag'></div>").appendTo("#listOutput");
                $("<div class='listSelect'></div>").appendTo("#listOutput");
                $("<div class='listHide'></div>").appendTo("#listOutput");

                $(".listSelect")
                    .click(function () {
                      ipcRenderer.send('load-size');
                      $('#welcome-loading').show();
                      loadCheck().then(function() {
                        	listSelector();
                        }).catch(function() {
                        	$('.loading')
                            .css('left','83px')
                            .text('No internet connection');
                        })

                    });

                $(".listHide")
                    .click(function () {
                      if ($(window).height() != 34) {  
                        ipcRenderer.send('set-size', 269, 34);
                      }
                      else {
                        ipcRenderer.send('set-size', 269, 30 + $listOutput.outerHeight());
                      }   
                    });
                   

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

        ipcRenderer.removeAllListeners();

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
            $('#welcome-loading').show();
            $(this).siblings().remove();
            ipcRenderer.send('set-size', 269, 15 + $('#listOutput').outerHeight());
            cardAction(displayCard, cardNumber);
        });



    };

    // GIVES SINGLE CARD VIEW ON HOVER TOGGLE ACTIONS

    var cardAction = function (currentCard, cardNumber) {

        var $timedisplay;
        var timeHasBeenAdjusted = false;
        var startTime = 0;
        var timeOnCard = 0;

        var timeDisplayOff = function () {

            $(".time-display").toggleClass("time-adjust");
            $('#time-switch').empty();
            $(".time-display > h1").show();
            $(".icon-buttons").show();

        };

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

                if (timeHasBeenAdjusted === true) {
                  var timeAdjustment = timeOnCard;
                  timeHasBeenAdjusted = false;
                }
                else {
                  timeAdjustment = 0;
                }

                // console.log("Time count is " + secondsTimer + " and " + "Time being adjusted is " + secondsTimer - timeAdjustment);
                // getList();
                var labelTimeFuncs = currentCard.labels.reduce((accu, label)=> {
                    accu.push(callback=>saveLabelTime(label.id + dayOfWeek, label.name, secondsTimer - timeAdjustment, callback));
                    return accu
                }, []);
                // console.debug('back labelTimeFuncs', labelTimeFuncs);
                var flow = [
                    (callback)=> saveCardTime(currentCard.id + dayOfWeek, currentCard.name, secondsTimer - timeAdjustment, callback),
                ].concat(labelTimeFuncs, [
                    (callback)=> {
                        clearTime();
                        logTime(callback);
                    }
                ]);
                async.series(flow, (err, results)=> {
                    getList();
                });
            });

        $(".tick")
            .unbind('click')
            .click(event => {
                event.stopPropagation();
                $('.toggle').hide();
                ipcRenderer.send('load-size');
                $('#welcome-loading').show();
                var nextCardId = cardsInList[cardsInList.indexOf(currentCard.id) + 1];

                if (timeHasBeenAdjusted === true) {
                  var timeAdjustment = timeOnCard;
                  timeHasBeenAdjusted = false;
                }
                else {
                  timeAdjustment = 0;
                }

                var labelTimeFuncs = currentCard.labels.reduce((accu, label)=> {
                    accu.push(callback=>saveLabelTime(label.id + dayOfWeek, label.name, secondsTimer - timeAdjustment, callback));
                    return accu
                }, []);

                var flow = [
                    (callback)=> completeCard(currentCard.id, callback),
                    (callback)=> saveCardTime(currentCard.id + dayOfWeek, currentCard.name, secondsTimer, callback),
                ].concat(labelTimeFuncs);
                // https://github.com/caolan/async#seriestasks-callback
                async.series(flow, (err, results)=> {
                    clearTime();
                    if (nextCardId != null) {
                        cardSelected(nextCardId, cardNumber);
                    } else {
                        $('#welcome-loading').show();
                        $('#listOutput').empty();
                        getList();
                    }
                });
            });

        $(".drag")
            .click(event=> {
                event.stopPropagation();
            });

        ipcRenderer.on("refresh-card", function () {

            $('#welcome-loading').show();

            if (timeHasBeenAdjusted === true) {
              var timeAdjustment = timeOnCard;
              timeHasBeenAdjusted = false;
            }
            else {
              timeAdjustment = 0;
            }

            var labelTimeFuncs = currentCard.labels.reduce((accu, label)=> {
                accu.push(callback=>saveLabelTime(label.id + dayOfWeek, label.name, secondsTimer - timeAdjustment, callback));
                return accu
            }, []);
            // console.debug('back labelTimeFuncs', labelTimeFuncs);
            var flow = [
                (callback)=> saveCardTime(currentCard.id + dayOfWeek, currentCard.name, secondsTimer, callback),
            ].concat(labelTimeFuncs, [
                (callback)=> {
                    clearTime();
                    logTime(callback);
                }
            ]);
            async.series(flow, (err, results)=> {
                cardSelected(currentCard.id, cardNumber);
            });
        });

        var completeCard = function (cardId, callback) {
            Trello.put("cards/" + cardId + "/idList", {value: completeList})
                .then(d=>callback(null, d))
                .fail(e=>callback(e));
        };

        var cardTimer = function () {
            // setInterval(()=> {
            //     $cardNumber.toggleClass('pulse');
            // }, 900000);
        };

        timer();
        cardTimer();

        var h1 = document.getElementById('time'),
            stop = document.getElementById('stop')
            h1.textContent = "00:00";
            seconds = 0, minutes = 0, hours = 0,
            t;

        var secondsTimer = 0;

        storage.get(currentCard.id + dayOfWeek, function (error, data) {
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

          $timedisplay = $(".time-display").hasClass("time-adjust");

          timeOnCard = secondsTimer;

          var getTimeOnCard = function () {

            storage.get(currentCard.id + dayCounter, function (error, data) {
                if (error) throw error;

                if (data.time > 0) {
                  timeOnCard = data.time;
                  minutes = Math.floor(data.time / 60);
                  hours = Math.floor(data.time / 3600);
                  $('#input-hours').val(hours ? (hours > 9 ? hours : "0" + hours) : "00");
                  $('#input-minutes').val(minutes ? (minutes > 9 ? (minutes > 59 ? (minutes % 60) : minutes) : "0" + minutes) : "00");
                }
                else {
                  timeOnCard = 0;
                  $('#input-hours').val("00");
                  $('#input-minutes').val("00");
                }
                $('#day').html(daysOfWeek[dayCounter].substring(0,3) + '<div class="select"></div>');
            });

          };

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
          };

          if ($timedisplay === true) {
            dayCounter = dayOfWeek;
            clearTimeout(t);
            $(".time-display > h1").hide();
            $("#icon-buttons").hide();
            $('<a href="#" id="day" class="input-time">' + daysOfWeek[dayCounter].substring(0,3) + '<div class="select"></div></a>').appendTo('#time-switch');
            $('<form id="time-input" onsubmit="return false"><input class="input-time blink" id="input-hours" max="99" value=' + (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ' type="number"/><p id="colon" class="input-time blink">:</p><input class="input-time blink" id="input-minutes" value=' + (minutes ? (minutes > 9 ? (minutes > 59 ? (minutes % 60) : minutes) : "0" + minutes) : "00") + ' max="59" type="number"/></form>')
            .appendTo('#time-switch');
            $('#time-input')
              .unbind('click')
              .click(event => {
              event.stopPropagation()
            });
            $('#day')
              .unbind('click')
              .click(event => {
                event.stopPropagation()
                dayCounter = (dayCounter + 1) % daysOfWeek.length;
                getTimeOnCard();
            });
          }

          else {

            $('#day').hide();
            $('.select').hide();
            timeInput();

            var labelTimer = secondsTimer;

            storage.get(currentCard.id + dayCounter, function (error, data) {
              if (error) throw error;

              timeOnCard = data.time;

              if (labelTimer != timeOnCard && labelTimer > 0 && timeOnCard > 70) {
                labelTimer = labelTimer - timeOnCard;
              }

              var labelTimeFuncs = currentCard.labels.reduce((accu, label)=> {
                  accu.push(callback=>saveLabelTime(label.id + dayCounter, label.name, labelTimer, callback));
                  return accu
              }, []);
              // console.debug('back labelTimeFuncs', labelTimeFuncs);
              var flow = [
                  (callback)=> saveNewCardTime(currentCard.id + dayCounter, currentCard.name, secondsTimer, callback),
              ].concat(labelTimeFuncs, [
                  (callback)=> {
                      // console.log(dayCounter);
                      clearTime();
                      logTime(callback);
                  }
              ]);

                async.series(flow, (err, results)=> {

                dayCounter = dayOfWeek;
                getTimeOnCard();
                timeInput();
                timeOnCard = secondsTimer;
                $('#time-switch').empty();
                $("#icon-buttons").show();
                $(".time-display > h1").show();
                h1.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? (minutes > 59 ? (minutes % 60) : minutes) : "0" + minutes) : "00");
                seconds = 0;
                timer();
              });

            });
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

        $('#welcome-loading').hide();
    };


// SELECTS AN INDIVIDUAL CARD TO DISPLAY

    var cardSelected = function (selectedCard, cardNumber) {

        var $cardNumber = $('#cardNumber' + cardNumber);
        $('#card').empty();
        $cardNumber.empty();
        Trello.get("cards/" + selectedCard, function (card) {
            cardDisplay(card, cardNumber);
            cardAction(card, cardNumber);
            ipcRenderer.send('set-size', 269, 15 + $cardNumber.outerHeight() );
        });
    };

// SHOWS BOARDS AND LISTS THAT A USER WANTS TO SELECT & MOVES THE WEEKLY PROGRESS CARD TO THAT LIST

var listSelector = function () {

  var $listOutput = $("#listOutput");
  $('.cardContainer').remove();

  var chooseList = function (boardId) {

    var newCompleteList = {
      name: "TOPTASK COMPLETED",
      idBoard: boardId,
      pos: "top"
    }

    var creationSuccess = function(data) {
      nconf.set('completeList', data.id);
      nconf.save()
      completeList = data.id;
    };

    Trello.get("boards/" + boardId + "/lists", (lists)=> {

      $.each(lists, function (ix, list) {

          $('#' + boardId +'').append('<div class="board-list" id="' + list.id + '">' + list.name + '</div>');

          $('#' + list.id +'')
              .click(function () {
                Trello.put("cards/" + logCard, {idList: list.id, idBoard: boardId});
                if (completeList == null) {
                  Trello.post("lists/", newCompleteList, creationSuccess);
                }
                else {
                  var checkInt = parseInt(boardId);
                  console.log(checkInt);
                  Trello.put("lists/" + completeList + "/idBoard", {value: boardId, pos: 1});
                }
                nconf.set('list', list.id);
                nconf.set('board', boardId);
                nconf.save();
                getList();
              });
      });
    });
  };

  Trello.members.get("me/boards", (boards)=> {

    $('.board').remove();

    $.each(boards, function (ix, board) {

        if (board.closed === false ) {

          $listOutput.append('<div class="board" id="' + board.id + '">' + board.name + '</div>');

          $('#' + board.id +'')
              .click(function () {
                $('.board-list').remove();
                chooseList(board.id);
              });
        }
    });

    ipcRenderer.send('set-size', 269, 30 + $listOutput.outerHeight());
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
            storage.set(keyId, {type: keyType, name: keyName, time: totalTime, day: dayCounter}, (error)=> {
                if (error) throw error;
                callback(null, totalTime); // success
            });
        });
    };

    var saveNewTime = function (keyType, keyId, keyName, time, callback) {
        // console.debug('saveTime', arguments);
        var totalTime = time;
        // console.log(time);

        storage.set(keyId, {type: keyType, name: keyName, time: totalTime, day: dayCounter}, (error)=> {
            if (error) throw error;
            // console.log(keyId + " " + keyName + " " + totalTime);
            callback(null, totalTime); // success
        });
    };

    var saveLabelTime = saveTime.bind(null, 'label');
    var saveCardTime = saveTime.bind(null, 'card');
    var saveNewCardTime = saveNewTime.bind(null, 'card');

// LOGS PRODUCTIVITY STATS TO CARD

    var logTime = function (callback) {

        var tdata = {card: [], label: []};
        var totalStored = [];
        var totalStoredDay = [];
        var totalLabelTime = [];
        var trelloTime = "#DAILY#\n\n\n\n";

        var mergeLabelNames = function (arr) {

            var labelNames = {};
            var labelNamesCount= {};

            arr.forEach( function(e) {

              if (!labelNames[e.name]) {

                  labelNames[e.name] = 0
                  labelNamesCount[e.name] = 0
              }

              labelNames[e.name] += e.time
              labelNamesCount[e.name]++
            });

            for (var name in labelNames) {
              totalLabelTime.push({name : name, time : labelNames[name]})
            };
        };

        var filterByDay = function(data) {
            return data.day == i;
        }

        var hoursAndMinutes = function(seconds) {
          var _hours = Math.floor(seconds / 3600);
          var _minutes = Math.floor((seconds - (_hours * 3600)) / 60);
          return (_hours > 0 ? (_hours > 1 ? _hours + " hours "  : _hours + " hour ") : "") + (_minutes > 0 ? (_minutes > 1 ? _minutes + " minutes " : _minutes + " minute") : "");
        }

        storage.keys((err, keys)=> {
            // https://github.com/caolan/async
            async.mapSeries(keys, (name, cb)=> storage.get(name, (error, data)=> {
                // console.debug('logTime data', error, data);
                // if (error) return cb(error);
                if (data['type'] == 'card') {
                  totalStored.push(data.time);
                }

                if (data['type'] == 'card' && data['day']) {
                  totalStoredDay.push({day: data.day, time: data.time});
                }

                if (data['type'] == 'card' && data['time'] > 60 || data['type'] == 'label' && data['time'] > 60 ) {
                    // console.debug('tdata', [tdata, data['type'], tdata[data['type']]]);
                    tdata[data['type']].push(data);
                }
                return cb(null, 1);
            }), (err, result) => {
                if (!err) {
                    // var _grabTime = (acc, cur)=>acc += cur.name + ' - ' + Math.floor(cur.time / 60) + ' minute(s)\n';
                    // console.log(tdata);
                    for ( i = 6; i > -2; i-- ) {

                      var filteredCardData = tdata.card.filter(filterByDay);
                      var filteredLabelData = tdata.label.filter(filterByDay);
                      var filteredTime = totalStoredDay.filter(filterByDay);
                      var filteredTotalDay = filteredTime.map(function(a) {return a.time;});
                      var dayOfWeek = "**" + daysOfWeek[i] + "**";

                      if (filteredCardData.length > 0) {
                        var _grabTime = (acc, cur)=>acc += ">" + cur.name + ' - ' + Math.floor(cur.time / 60) + (Math.floor(cur.time / 60) > 1 ? ' minutes\n' : ' minute\n' );
                        var cardtime = filteredCardData.reduce(_grabTime, '');
                        var labeltime = filteredLabelData.reduce(_grabTime, '');
                        var printStored = filteredTotalDay.reduce( (a,b) => a + b, 0 );

                        if (i == 0 && filteredCardData.length > 0) {
                            var sundayTime = filteredCardData.map(function(a) {return a.time;});
                            printStored = sundayTime.reduce( (a,b) => a + b, 0 );
                        }
                        trelloTime += dayOfWeek + "\n\n*TASKS:*\n\n\n\n" + cardtime + "\n--------\n" + "*LABELS*\n\n" +  labeltime + "\n--------\n" + "\n*TIME SPENT:*\n" + "\n" + ">" + hoursAndMinutes(printStored) + "\n\n\n\n--------\n";
                      }
                    };

                    mergeLabelNames(tdata.label);
                    totalLabelTime = totalLabelTime.reduce(_grabTime, '');

                    var timeThisWeek = totalStored.reduce( (a,b) => a + b, 0 );

                    // trelloTime += "\n\n#WEEKLY#\n\n\n\n" + "*LABELS*\n\n" +  labeltime + "\n--------\n" + "*TOTAL WEEKLY TIME*\n\n" + hoursAndMinutes(timeThisWeek) + "\n--------\n" + "----------";
                    trelloTime += "\n\n#WEEKLY#\n\n\n\n" + "*LABELS*\n\n" +  totalLabelTime + "\n--------\n" + "*TOTAL TIME SPENT*\n\n" + hoursAndMinutes(timeThisWeek) + "\n--------\n" + "----------";
                    // console.debug('trelloTime', {trelloTime, cardtime, labeltime});
                    Trello.put('/cards/' + logCard + '/desc', {value: trelloTime})
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
