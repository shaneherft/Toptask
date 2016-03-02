window.$ = window.jQuery = require('./lib/jquery-2.2.1');

var getCards = function () {
  $(".toggle").hide();
  $('#loggedout').remove();
  $("#singleCard").hide();
  $("#listOutput").empty();


  Trello.members.get("me", (member)=> {

    $("#fullName").text(member.fullName);

    var $cards = $("<div>")
      .text("Loading list...")
      .appendTo("#listOutput");

    // get first list from first board and get its cards
    Trello.get("members/me/boards", (boards)=> {
      Trello.get("boards/52a964092424e6632f0d6921/lists", (lists)=> {
        Trello.get("lists/55d26f54726fb67f022db618/cards", (cards)=> {
          // console.debug(boards, lists, cards)
          $cards.empty();
          $.each(cards, function (ix, card) {

            $("<a>")
              .addClass("card")
              .text(card.name)
              .click(function () {
                $('#listSelect').remove();
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
