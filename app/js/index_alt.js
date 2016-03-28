
const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const storage = require('electron-json-storage');

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

var opts = {
  "version": 1,
  "apiEndpoint": "https://api.trello.com",
  "authEndpoint": "https://trello.com",
  "intentEndpoint": "https://trello.com",
  "key": "b9ba7c2037190da4db4bc8ee0d643164"
};

var Trello = require('./lib/client-enode')(window, jQuery, opts);
var bootstrap = require('bootstrap');

jQuery(document).ready(function ($) {
  //do jQuery stuff when DOM is ready

  storage.get('authStatus', function(error, data) {
    if (error) throw error;

    if (data.auth === true) {
      $("#connectLink").ready(function doAuth() {
        Trello.authorize({
          type: 'popup',
          // type: "redirect",
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
    }

    else {
      $("#connectLink").click(function doAuth() {
        Trello.authorize({
          type: 'popup',
          // type: "redirect",
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
      console.log(data);
    }

  });

  var $loading;
  var cardsInList;
  var cardTimer;

  var onAuthorize = function () {
    updateLoggedIn();
    $loading = $("<div>")
      .addClass('loading')
      .text("Loading")
      .appendTo("#welcome-loading");
    getList();

    storage.set('authStatus', { auth: Trello.authorized() }, function(error) {
      if (error) throw error;
    });
  };

    //TRELLO FUNCTIONS

  var getList = function() {

    $('#cardOutput').empty();
    $('#listOutput').empty();
    $('.toggle').hide();

    Trello.members.get("me", (member)=> {

      // Trello.get("members/me/boards", (boards)=> {
      //   Trello.get("boards/52a964092424e6632f0d6921/lists", (lists)=> {
          Trello.get("lists/55d26f54726fb67f022db618/cards", (cards)=> {
            // console.debug(boards, lists, cards)
            cardsInList = [];

            var $listOutput = $("#listOutput");
            var listName = "PRIORITY";
            var $list = $("<div class='listName'>" + listName + "</div>")
              // .addClass('')
              .appendTo("#listOutput");

            $("<div class='listDrag'></div>").appendTo("#listOutput");

            $.each(cards, function (ix, card) {

              cardsInList.push(card.id);

              var cardNumber = $listOutput.children().length;
              $listOutput.append('<div class="cardContainer" id="cardNumber' + $listOutput.children().length + '"></div>');
              // $('<div class="overlay"></div>').appendTo('#cardNumber' + cardNumber);

              cardDisplay(card, cardNumber);

            });

            // $('.overlay').hide();

            ipcRenderer.send('set-size', 269, 30 + $listOutput.outerHeight());
            $('#welcome-loading').hide();
            // $(".cardContainer")
            //   .mouseover(function () {
            //     $('.overlay').show();
            //   })
            //   .mouseout(function () {
            //     $(this).hide();
            //   });
            //
            // $(".overlay").click(function (event) {
            //   event.preventDefault();
            //   $("div.overlay").fadeToggle("fast");

            // });

          })
      //   })
      // })
    });
  };

  //DISPLAYS CARD CORRECTLY ON LISTS AND CARD SELECTION

  var cardDisplay = function(displayCard, cardNumber) {

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

  var cardAction = function(currentCard, cardNumber) {

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
    .click(function () {
      event.stopPropagation();
      ipcRenderer.send('set-size', 269, 66);
      $('#welcome-loading').show();
      $('#listOutput').empty();
      saveTime(currentCard);
      getList();
    });

  $(".tick")
    .unbind('click')
    .click(function () {
      event.stopPropagation();
      $('#welcome-loading').show();
      var nextCardId = cardsInList[cardsInList.indexOf(currentCard.id)+1];
      completeCard(currentCard.id);
      saveTime(currentCard.id, currentCard.labels);

      if (nextCardId != null) {
      cardSelected(nextCardId, cardNumber);
      }
      else {
        $('#welcome-loading').show();
        $('#listOutput').empty();
        getList();
      }

    });

  $(".drag")
    .click(function () {
      event.stopPropagation();
    });


  ipcRenderer.on("refresh-card", function() {
    saveTime(currentCard);
    location.reload();
  });

  var completeCard = function (cardId) {
    Trello.put("cards/" + cardId + "/idList", {value: "5403bf2888d0ac13dcc52c4a"});
  }

  var cardTimer = function() {
    setInterval(function() {
      $cardNumber.toggleClass('pulse');
    }, 900000);
  };

  timer();
  cardTimer();

  var h1 = document.getElementsByTagName('h1')[0],
      seconds = 0, minutes = 0, hours = 0,
      t;

  var secondsTimer = 0;

  storage.get(currentCard.id, function(error, data) {
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

  var timeDisplay = function(time) {
    var cardSeconds = time - (Math.floor(time / 60) * 60)
    var cardMinutes = Math.floor(time / 60);
    var cardHours = Math.floor(time / 3600);
    seconds = seconds + cardSeconds;
    minutes = minutes + cardMinutes;
    hours = hours + cardHours;
  }

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

      h1.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "0") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00");
      timer();
  }

  function timer() {
    t = setTimeout(add, 1000);
  }

  var saveTime = function(currentCard) {
    var cardTime = secondsTimer;
    var timeLabels = currentCard.labels;


    for (i = 0; i < timeLabels.length; i++) {

      var labelTime = secondsTimer;
      var labelName = timeLabels[i].name;
      console.log(labelName);

      storage.get(labelName, function(error, data) {
        if (error) throw error;

        if (data.time > 0) {
        labelTime = labelTime + data.time;
        }

      });

      storage.set(labelName, { time: labelTime, name: "Label: " + labelName }, function(error) {
        if (error) throw error;
      });



    }

    clearTimeout(t);
    secondsTimer = 0;
    h1.textContent = "0:00";
    seconds = 0; minutes = 0; hours = 0;

    printTime();

  }



};

// CHECKS IF CARD OR LABEL HAS PREVIOUS TIME ON IT

var totalTime = function (key, newTime) {

storage.get(key, function(error, data) {
  if (error) throw error;

  if (data.time > 0) {
  newTime += data.time;
  }

  printTime();

};

// PRINTS TOTAL TIME TO CARD

var printTime = function () {

  storage.keys(function(error, keys) {
  if (error) throw error;

  for (var key of keys) {

    storage.get(key, function(error, data) {
      if (error) throw error;
      if (data.time > 0) {
        console.log(data.name + " " + data.time);
      }
    });

  }

  });

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

ipcRenderer.on("log-out", function() {
  logout();
  location.reload();
});

ipcRenderer.on('global-shortcut', function (arg) {
  location.reload();
});

var  ellipsis = {
    'value' : ['', '.', '..', '...'],
  	'count' : 0,
  	'run' : false,
  	'timer' : null,
  	'element' : '.ellipsis',
  	'start' : function () {
  	  var t = this;
  		this.run = true;
  		this.timer = setInterval(function () {
  			if (t.run) {
  				$(t.element).html(t.value[t.count % t.value.length]).text();
  				t.count++;
  			}
  		}, 250);
  	},
  	'stop' : function () {
  		this.run = false;
  		clearInterval(this.timer);
  		this.count = 0;
  	}
  };


$("#zoom a").click(function(e) {
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
    storage.set('authStatus', { auth: Trello.authorized() }, function(error) {
      if (error) throw error;
    });
  };


  $("#disconnect").click(logout);

// end jQuery(document).ready
});
