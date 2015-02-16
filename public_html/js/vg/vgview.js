"use strict";
var vgview = function (m) {
    return function (m) {
        var NCOL = vgmodelstatic.getDIM().NCOL;
        var NROW = vgmodelstatic.getDIM().NROW;
        function setSpielstein(c) {
            var r = m.getRowOfCol(c);
            var cls = m.whosTurn();
            $($("#vg tr > td:nth-child(" + (c + 1) + ")")[r]).addClass(cls);
        }
        function onClickHandler(c) {
            return function () {
                if (m.isMill()) {
                    return alert("Mühle -- Spiel ist beendet!");
                }
                if (m.move(c).mstate === 'notallowed') {
                    return alert("Move not allowed");
                }
                setSpielstein(c);
                if (m.isMill()) {
                    return alert("Mühle");
                }
                var bestMove = m.evalState();
                m.move(bestMove);
                setSpielstein(bestMove);
                if (m.isMill()) {
                    return alert("Mühle");
                }
            }
        }
        function render(divid) {
            var table = $('<table id="vg"></table>');
            for (var r = 0; r < NROW; r++) {
                var $row = $('<tr></tr>');
                for (var c = 0; c < NCOL; c++) {
                    var x = ''; //m.getValOfField(r, c);
                    var td = $('<td>' + x + '</td>');
                    $(td).on('click', onClickHandler(c));
                    $row.append(td);
                }
                table.append($row);
            }
            $(divid).empty().append(table);
        }
        // Interface
        return {
            render: render
        };
    }(m);
};