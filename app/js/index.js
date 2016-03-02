// fix for node integration
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

jQuery(document).ready(function ($) {
  //do jQuery stuff when DOM is ready
  $(".toggle").hide();

  var cardLength;
// var cardHeight;

  var onAuthorize = function () {
    updateLoggedIn();

    $("#singleCard").hide();
    $("#listOutput").empty();

    Trello.members.get("me", (member)=> {

      $("#fullName").text(member.fullName);

      var $cards = $("<div>")
        .text("Loading list...")
        .appendTo("#listOutput");

      // get first list from first board and get its cards
      Trello.get("members/me/boards", (boards)=> {
        Trello.get("boards/" + boards[0].id + "/lists", (lists)=> {
          Trello.get("lists/" + lists[0].id + "/cards", (cards)=> {
            // console.debug(boards, lists, cards)
            $cards.empty();
            $.each(cards, function (ix, card) {

              $("<a>")
              // .attr({href: card.url, target: "trello"})
                .addClass("card")
                .text(card.name)
                .click(function () {
                  $('#listSelect').remove();
                  // cardLength = card.name.length;
                  // if (cardLength > 32) {
                  //   window.resizeTo(266, 88);
                  // }
                  // else {
                  //   console.log("no resize");
                  // };
                  cardSelected(card.id);
                })
                .appendTo($cards);

              window.resizeTo(266, 58 + $cards.outerHeight());

            });

          })
        })
      });


    });
  };


// var checkLength = function(cardLength) {
//   if (cardLength < 32) {
//     console.log("card is one line " + cardLength );
//     cardHeight = 58;
//     }
//   else if (cardLength >= 32 && cardLength < 63 ) {
//     console.log("card is two lines");
//     cardHeight = 76;
//   }
//   else if (cardLength >= 63 && cardLength < 94 ) {
//     console.log("card is three lines")
//     cardHeight = 94;
//   }
//   else {
//     console.log("card is over 4 lines")
//     cardHeight = 112;
//   }
// };

  var cardSelected = function (selectedCard) {

    $("#singleCard").show();

    var $cards = $("<div>")
      .empty()
      .text("Loading card...")
      .appendTo("#cardOutput");

    // var $labels = $("<div>")
    //     .appendTo("#labels");

    var $checklists = $("<span>")
      .appendTo("#checklistOutput");

    Trello.get("cards/" + selectedCard, function (card) {
      // window.resizeTo(266,58);

      $cards.empty();
      $("<a>")
      // .attr({href: card.url, target: "trello"})
        .addClass("cards")
        .text(card.name)
        .appendTo($cards);


      if (card.badges.checkItems > 0) {
        $('<span>')
          .text(card.badges.checkItemsChecked + "/" + card.badges.checkItems)
          .appendTo($checklists);
      }
      else {
        $('.checklistIcon').remove();
        $('.cardChecklist').remove();
      }

      var cardLink = card.url;

      // var checklistNum = [card.badges.checkItemsChecked,card.badges.checkItems];
      // console.log(checklistNum[0]+"/"+checklistNum[1]);

      //Displays correct color label
      var cardLabel;
      var labelSort = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      var labelLength = card.labels.length;

      for (var i = 0; i < labelLength; i++) {
        cardLabel = card.labels[i].color;

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
      $(".toggle").show();

      $(".toggle").click(function (event) {
        event.preventDefault();
        $("div.overlay").fadeToggle("fast");

      });

      $(".toggle")
        .mouseover(function () {
          $('.icons').show();
          // $('a.trello').attr('href','www.google.com');
        })
        .mouseout(function () {
          $('.icons').hide();
        });

      $(".trello")
        .click(function () {
          window.open(cardLink, "Card Link", "width=760,height=660,titlebar=yes,scrollbars=no,status=yes,frame=yes");
        });

      $(".settings")
        .click(function () {
          document.location.reload(true);
        });

    });

  };


//DO NOT TOUCH

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
      // expiration: 'never',
      success: onAuthorize,
      error: (err)=> console.debug('Trello error', err),
    });
  });

  $("#disconnect").click(logout);

// end jQuery(document).ready
});
