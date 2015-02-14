var vgview = function (m) {
    return function (model) {
        var NCOL = staticModel.getDIM().NCOL;
        var NROW = staticModel.getDIM().NROW;

        function setSpielstein(c) {
            var r = model.getRowOfCol(c);
            var amzug = model.amzug();
            var cls = amzug ? "playera" : "playerb";
            $($("#vg tr > td:nth-child(" + (c + 1) + ")")[r]).addClass(cls);
        }
        function render(divid, divbtns) {
            var table = $('<table id="vg"></table>');
            for (var r = 0; r < NROW; r++) {
                var row = $('<tr></tr>');
                for (var c = 0; c < NCOL; c++) {
                    var x = '';//model.getValOfField(r, c);
                    var td = $('<td>' + x + '</td>');
                    $(td).on('click', function (c) {
                        return function () {
                            if (!model.move(c)) {
                                return alert("Move not allowed");
                            }
                            setSpielstein(c);
                        };
                    }(c));
                    row.append(td);
                }
                table.append(row);
            }
            $(divid).empty().append(table);

            var btntable = $('<table id="btns"></table>');
            var btnrow = $('<tr></tr>');
            for (var c = 0; c < NCOL; c++) {
                var butt = $('<button id=id' + c + '/>');
                butt.on('click',
                        function (c) {
                            return function () {
                                if (!model.move(c)) {
                                    return alert("Move not allowed");
                                }
                                setSpielstein(c);
                            };
                        }(c));
                btnrow.append($('<td></td>').append(butt));
            }
            btntable.append(btnrow);
            $(divbtns).empty().append(btntable);
        }
        return {
            render: render
        };
    }(m);
};