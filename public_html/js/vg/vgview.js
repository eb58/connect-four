const vgview = function (m) {
  "use strict";
  return function (m) {
    const NCOL = vgmodelstatic.DIM.NCOL;
    const NROW = vgmodelstatic.DIM.NROW;

    function myAlert(msg) {
      $('<div></div').dialog({
        buttons: {
          OK: function () {
            $(this).dialog("close");
          }
        },
        autoOpen: false,
        title: 'Meldung'
      }).text(msg).dialog("open");
    }

    function setSpielstein(c) {
      const row = m.getRowOfCol(c);
      const cls = m.whosTurn();
      $($("#vg tr > td:nth-child(" + (c + 1) + ")")[row]).addClass(cls);
      $("#info").html("Mein letzter Zug:" + (c + 1));
    }

    function onClickHandler(c) {
      return () => {
        if (m.move(c) === 'notallowed') {
          return;
        }
        setSpielstein(c);
        const bestMove = m.bestMove();
        if (m.move(bestMove) === 'notallowed') {
          return myAlert("Gratuliere, du hast gewonnen!");
        }
        setSpielstein(bestMove);
        if (m.isMill()) {
          return myAlert("Bedaure, du hast verloren!");
        }
      };
    }

    function render(divid) {
      const table = $('<table id="vg"></table>');
      for (var r = 0; r < NROW; r++) {
        const row = $('<tr></tr>');
        for (var c = 0; c < NCOL; c++) {
          row.append($('<td></td>').on('click', onClickHandler(c)));
        }
        table.append(row);
      }
      $(divid).empty().append(table);
    }

    return {// Interface
      render
    };
  }(m);
};