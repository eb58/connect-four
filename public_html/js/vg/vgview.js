var vgview = function (m) {
    "use strict";
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
                if (m.move(c) === 'notallowed') {
                    return; // alert("Zug is nicht");
                }
                setSpielstein(c);
                if (m.isMill()) {
                    return alert("Gratuliere, du hast gewonnen!");
                }
                var bestMove = m.evalState();
                m.move(bestMove);
                setSpielstein(bestMove);
                if (m.isMill()) {
                    return alert("Bedaure, du hast verloren!");
                }
            }
        }
        function render(divid) {
            var table = $('<table id="vg"></table>');
            for (var r = 0; r < NROW; r++) {
                var $row = $('<tr></tr>');
                for (var c = 0; c < NCOL; c++) {
                    //$(td).on('click', onClickHandler(c));
                    $row.append( $('<td></td>').on('click', onClickHandler(c)));
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