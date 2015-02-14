"use strict";
var vgview = function (m) {
    return function (model) {
        var NCOL = staticModel.getDIM().NCOL;
        var NROW = staticModel.getDIM().NROW;

        function setSpielstein(c) {
            var r = model.getRowOfCol(c);
            var cls = model.whosTurn();
            $($("#vg tr > td:nth-child(" + (c + 1) + ")")[r]).addClass(cls);
        }
        function render(divid) {
            var table = $('<table id="vg"></table>');
            for (var r = 0; r < NROW; r++) {
                var $row = $('<tr></tr>');
                for (var c = 0; c < NCOL; c++) {
                    var x = '';//model.getValOfField(r, c);
                    var td = $('<td>' + x + '</td>');
                    $(td).on('click', function (c) {
                        return function () {
                            var state = model.move(c).mstate;
                            if (state==='notallowed') {
                                return alert("Move not allowed");
                            }
                            setSpielstein(c);
                            if (state==='ismill') {
                                return alert("Mühle");
                            }
                        };
                    }(c));
                    $row.append(td);
                }
                table.append($row);
            }
            $(divid).empty().append(table);
        }
        return {
            render: render
        };
    }(m);
};