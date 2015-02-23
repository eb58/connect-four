var vgview = function (m) {
    "use strict";
    return function (m) {
        var NCOL = vgmodelstatic.getDIM().NCOL;
        var NROW = vgmodelstatic.getDIM().NROW;

        function myAlert(msg) {
            $('<div></div').dialog({
                buttons: {
                    OK: function () {
                        $(this).dialog("close");
                    },
                },
                autoOpen: false,
                title: 'Meldung'
            }).text(msg).dialog("open");
        }
        function setSpielstein(c) {
            var r = m.getRowOfCol(c);
            var cls = m.whosTurn();
            $($("#vg tr > td:nth-child(" + (c + 1) + ")")[r]).addClass(cls);
            $("#info").html("Mein letzter Zug:" + (c + 1));
        }
        function makeMove(c) {
            var bestMove = m.bestMove();
            m.move(bestMove);
            setSpielstein(bestMove);
        }
        function onClickHandler(c) {
            return function () {
                if (m.move(c) === 'notallowed') {
                    return;
                }
                setSpielstein(c);
                var bestMove = m.bestMove();
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
            var table = $('<table id="vg"></table>');
            for (var r = 0; r < NROW; r++) {
                var row = $('<tr></tr>');
                for (var c = 0; c < NCOL; c++) {
                    row.append($('<td></td>').on('click', onClickHandler(c)));
                }
                table.append(row);
            }
            $(divid).empty().append(table);
        }
        // Interface
        return {
            render: render
        };
    }(m);
};