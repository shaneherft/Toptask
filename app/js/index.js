
const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

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

var cardHeight;
var listHeight;
var cardLength;
var nextCardId;
var cardsInList = [];
var $cards;
var $list;
var $loading;
// var $checklists;
var trelloWindow;

jQuery(document).ready(function ($) {
  //do jQuery stuff when DOM is ready
  $(".toggle").hide();
  $(".loading").hide();
  $(".container").hide();
  // var checkAuth = Trello.authorized();
  // if (checkAuth === true) {
  //   console.log(checkAuth);
  //   onAuthorize();
  // }

  var onAuthorize = function () {
    updateLoggedIn();
    $("#listOutput").empty();
    getList();
    $loading = $("<div>")
      .addClass('loading')
      .text("Loading")
      .appendTo("#welcome-loading");
    };

    //TRELLO FUNCTIONS

    var getList = function() {

      $('.container').show();
      $('.cardOutput').empty();
      $("#singleCard").hide();
      $('#listSelect').show();
      $('#listOutput').show();
      $('#listOutput').empty();
      $('.toggle').hide();

      Trello.members.get("me", (member)=> {

        // $("#fullName").text(member.fullName);

        $list = $("<div>")
          .appendTo("#listOutput");

        Trello.get("members/me/boards", (boards)=> {
          Trello.get("boards/52a964092424e6632f0d6921/lists", (lists)=> {
            Trello.get("lists/55d26f54726fb67f022db618/cards", (cards)=> {
              // console.debug(boards, lists, cards)
              $list.empty();
              $.each(cards, function (ix, card) {

                cardsinList = [];
                cardsInList.push(card.id);

                $("<a>")
                  .addClass("card")
                  .text(card.name)
                  .click(function () {
                    $('#listSelect').hide();
                    $('#welcome-loading').show();
                    ipcRenderer.send('set-size', 266, 66);
                    cardSelected(card.id);
                  })
                  .appendTo($list);
              });
              $('#welcome-loading').hide();
              ipcRenderer.send('set-size', 266, 58 + $list.outerHeight());
            })
          })
        })
      });
    };


  var cardSelected = function (selectedCard) {

    $("#singleCard").show();
    $('#cardOutput').empty();
    $("#listOutput").empty();
    $('#labels').empty();
    $('#badges').empty();


    Trello.get("cards/" + selectedCard, function (card) {

      $cards = $("<div>")
        .appendTo("#cardOutput");

      $cards.empty();
      $("<a>")
        .addClass("cards")
        .text(card.name)
        .appendTo($cards);

      //CHECK ALL BADGES (SHOULD MAKE THIS A FUNCTION)

      if (card.badges.description === true) {
        $('<span>')
          .addClass("icon-sm icon-description badge-spacer")
          .appendTo('#badges');
      }

      if (card.badges.comments > 0) {
        $('<span>')
          .addClass("icon-sm icon-comment badge-spacer")
          .appendTo('#badges');
        $('<span>')
          .addClass("badge-text")
          .text(card.badges.comments)
          .appendTo('#badges');
      }


      if (card.badges.checkItems > 0) {
        $('<span>')
          .addClass("icon-sm icon-checklist badge-spacer")
          .appendTo('#badges');
        $('<span>')
          .addClass("badge-text")
          .text(card.badges.checkItemsChecked + "/" + card.badges.checkItems)
          .appendTo('#badges');
      }
      else {
        $('.cardChecklist').remove();
      }
      //Displays correct color label

      var labelLength = card.labels.length;
      var labelSort = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      for (var i = 0; i < labelLength; i++) {

        var cardLabel = card.labels[i].color;

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
      console.log(labelSort);

      for (var i = 0; i < labelSort.length; i++) {
        cardLabel = labelSort[i];

        switch (cardLabel) {

          case "green":
            $("<div class=cardLabel></div>")
              .css("background-color", "#61bd4f")
              .appendTo("#labels");
            break;

          case "red":
            $("<div class=cardLabel></div>")
              .css("background-color", "#eb5a46")
              .appendTo("#labels");
            break;

          case "sky":
            $("<div class=cardLabel></div>")
              .css("background-color", "#00c2e0")
              .appendTo("#labels");
            break;

          case "orange":
            $("<div class=cardLabel></div>")
              .css("background-color", "#ffab4a")
              .appendTo("#labels");
            break;

          case "yellow":
            $("<div class=cardLabel></div>")
              .css("background-color", "#f2d600")
              .appendTo("#labels");
            break;

          case "blue":
            $("<div class=cardLabel></div>")
              .css("background-color", "#0079bf")
              .appendTo("#labels");
            break;

          case "pink":
            $("<div class=cardLabel></div>")
              .css("background-color", "#ff80ce")
              .appendTo("#labels");
            break;

          case "lime":
            $("<div class=cardLabel></div>")
              .css("background-color", "#51e898")
              .appendTo("#labels");
            break;

          case "purple":
            $("<div class=cardLabel></div>")
              .css("background-color", "#c377e0")
              .appendTo("#labels");
            break;

          case "black":
            $("<div class=cardLabel></div>")
              .css("background-color", "#4d4d4d")
              .appendTo("#labels");
            break;

          default:
            console.log("No label");
        }
      }

      $("#welcome-loading").hide();
      getCardHeight();
      ipcRenderer.send('set-size', 266, 15 + cardHeight);
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
        .click(function () {
          ipcRenderer.send('trello-open', card.url);
        });

      $(".back")
        .click(function () {
          event.stopPropagation();
          ipcRenderer.send('set-size', 266, 66);
          $('#welcome-loading').show();
          clearList();
          clearCard();
          getList();

        });

      $(".tick")
        .click(function () {
          event.stopPropagation();
          var nextCardIndex = cardsInList.indexOf(card.id) + 1;
          nextCardId = cardsInList[nextCardIndex];
          completeCard(card.id);
          cardSelected(nextCardId);
        });

      $(".drag")
        .click(function () {
          event.stopPropagation();
        });

    });

  };

ipcRenderer.on("refresh-card", function() {
  clearCard();
  cardSelected(currentCard);
});

ipcRenderer.on("log-out", function() {
  logout();
  location.reload();
});

var completeCard = function (cardId) {
  Trello.put("cards/" + cardId + "/idList", {value: "5403bf2888d0ac13dcc52c4a"});
}

var getCardHeight = function () {  //define a function with the code you want to call
      cardHeight = $('.container').outerHeight();
  };

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

var clearCard = function() {
  $('#badges').empty();
  $('#labels').empty();
  $('#cardOutput').empty();
  $cards.empty();
  // $checklists.empty();
};

var clearList = function() {
  $cards.empty();
  $list.empty();
  $('#listOutput').empty();
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
  };

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


  $("#disconnect").click(logout);

// end jQuery(document).ready
});
