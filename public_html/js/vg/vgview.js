const vgview = function (m) {
  "use strict";
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
    const row = NROW - m.getHeightOfCol(c);
    const cls = m.whosTurn();
    $($("#vg tr > td:nth-child(" + (c + 1) + ")")[row]).addClass(cls);
    $("#info").html("Mein letzter Zug:" + (c + 1));
  }

  const onClickHandler = c => {
    return () => {
      // Player
      if (m.getHeightOfCol(c) >= NROW) {
        return;
      }
      const res1 = m.move(c);
      setSpielstein(c);
      if (res1 === 'isMill') {
        myAlert("Gratuliere, du hast gewonnen!");
        return;
      }
      if (res1 === 'draw') {
        myAlert("Gratuliere, du hast ein Remis geschafft!");
        return;
      }

      // Computer
      const bestMove = m.bestMove();
      const res2 = m.move(bestMove);
      setSpielstein(bestMove);
      if (res2 === 'isMill') {
        myAlert("Bedaure, du hast verloren!");
        return;
      }
      if (res2 === 'draw') {
        myAlert("Gratuliere, du hast ein Remis geschafft!");
        return;
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
};