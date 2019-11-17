const vgview = function (m) {
  "use strict";
  return function (m) {
    const NCOL = vgmodelstatic.DIM.NCOL;
    const NROW = vgmodelstatic.DIM.NROW;

    const myAlert = msg => {
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

    const setSpielstein = (c) => {
      const row = m.getRowOfCol(c);
      const cls = m.whosTurn();
      $($("#vg tr > td:nth-child(" + (c + 1) + ")")[row]).addClass(cls);
      $("#info").html("Mein letzter Zug:" + (c + 1));
    }

    const onClickHandler = c => {
      return () => {
        // Player
        if (m.move(c) === 'notallowed') {
          return;
        }
        setSpielstein(c);  
        
        // Computer
        const bestMove = m.bestMove();
        const result = m.move(bestMove);
        if (result === 'notallowed') {
          myAlert("Gratuliere, du hast gewonnen!");
        }
        setSpielstein(bestMove);
        if (result === 'endOfGame') {
          myAlert("Bedaure, du hast verloren!");
        }
      };
    }

    const render = divid => {
      const table = $('<table id="vg"></table>');
      for (let r = 0; r < NROW; r++) {
        const row = $('<tr></tr>');
        for (let c = 0; c < NCOL; c++) {
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