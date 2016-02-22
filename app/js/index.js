var cardLength;
// var cardHeight;

var onAuthorize = function() {
    updateLoggedIn();
    $("#singleCard").hide();
    $("#listOutput").empty();

    Trello.members.get("me", function(member){
        $("#fullName").text(member.fullName);

        var $cards = $("<div>")
            .text("Loading list...")
            .appendTo("#listOutput");
        // Output a list of all of the cards that the member
        // is assigned to
        Trello.get("lists/55d26f54726fb67f022db618/cards", function(cards) {
            $cards.empty();
            $.each(cards, function(ix, card) {
                $("<a>")
                // .attr({href: card.url, target: "trello"})
                .addClass("card")
                .text(card.name)
                .appendTo($cards)
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
                });
            });
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

var cardSelected = function(selectedCard) {

      $("#singleCard").show();

      var $cards = $("<div>")
          .empty()
          .text("Loading card...")
          .appendTo("#cardOutput");

      var $labels = $("<div>")
          .appendTo("#label");

      var $checklists = $("<span>")
          .appendTo("#checklistOutput");

      Trello.get("cards/" + selectedCard, function(card) {
          // window.resizeTo(266,58);

          $cards.empty();
              $("<a>")
              // .attr({href: card.url, target: "trello"})
              .addClass("cards")
              .text(card.name)
              .appendTo($cards);


              if (card.badges.checkItems > 0) {
              $('<span>')
              .text(card.badges.checkItemsChecked+"/"+card.badges.checkItems)
              .appendTo($checklists);
              }
              else {
                $('.checklistIcon').remove();
                $('.cardChecklist').remove();
              }

              var cardLink = card.url

              // var checklistNum = [card.badges.checkItemsChecked,card.badges.checkItems];
              // console.log(checklistNum[0]+"/"+checklistNum[1]);

              //Displays correct color label
              var cardLabel = card.labels[0].color;
              console.log(cardLabel);

              switch (cardLabel) {
                case "red":
                  $(".cardLabel")
                  .css("background-color", "#eb5a46");
                  break;

                case "sky":
                  $(".cardLabel")
                  .css("background-color", "#00c2e0");
                  break;

                case "green":
                  $(".cardLabel")
                  .css("background-color", "#61bd4f");
                  break;

                case "orange":
                  $(".cardLabel")
                  .css("background-color", "#ffab4a");
                  break;

                case "yellow":
                  $(".cardLabel")
                  .css("background-color", "#f2d600");
                  break;

                case "blue":
                  $(".cardLabel")
                  .css("background-color", "#0079bf");
                  break;

                case "pink":
                  $(".cardLabel")
                  .css("background-color", "#ff80ce");
                  break;

                case "lime":
                  $(".cardLabel")
                  .css("background-color", "#51e898");
                  break;

                case "purple":
                  $(".cardLabel")
                  .css("background-color", "#c377e0");
                  break;

                case "black":
                  $(".cardLabel")
                  .css("background-color", "#4d4d4d");
                  break;

                default:
                  console.log(cardLabel + " does not work :(");
              };

              $(".toggle").click(function(event) {
              event.preventDefault();
              $("div.overlay").fadeToggle("fast");

              });

              $(".toggle")
              .mouseover(function() {
                $('.icons').show();
                // $('a.trello').attr('href','www.google.com');
                  })
              .mouseout(function() {
                $('.icons').hide();
                  });

              $(".trello")
              .click(function(){
                  window.open(cardLink,"Card Link","width=760,height=660,titlebar=yes,scrollbars=no,status=yes,frame=yes");
                  });

              $(".settings")
              .click(function(){
                  document.location.reload(true);
                  });

      });

};


//DO NOT TOUCH

var updateLoggedIn = function() {
    var isLoggedIn = Trello.authorized();
    $("#loggedout").toggle(!isLoggedIn);
    $("#loggedin").toggle(isLoggedIn);
};

var logout = function() {
    Trello.deauthorize();
    updateLoggedIn();
};

Trello.authorize({
    interactive:false,
    success: onAuthorize
});

$("#connectLink")
.click(function(){
    Trello.authorize({
        type: "redirect",
        success: onAuthorize,
        name: "Toptask"
    })
});

$("#disconnect").click(logout);
