var vg = (function () {
    var STYP = {CMP: 1, MAN: 0, };
    var SANZ = 7;
    var ZANZ = 7;

 var model = {
        amzug: STYP.CMP,
        hoehe: [], // Hoehe von Spalten
        sfeld: [], // Spielfeld
        isMuehle: false,
        cr: 0,
        czwei: 0,
        cdrei: 0,
        sr: 0,
        szwei: 0,
        sdrei: 0,
        zugnr: 0,
        wert: 0,
        aktZug: -1,
        aktWert: 0,
        ziehe: function ziehe(c) {
            this.s[c][hoehe[c]] = this.amzug;
            this.hoehe[c] += 1;
            this.amzug = this.amzug === STYP.MAN ? STYP.CMP : STYP.MAN;
        },
        init: function init(amzug) {
            this.amzug = amzug;
            for (var s = 0; s < SANZ; s++) {
                this.hoehe.push(0);
                this.s.push([]);
            }
        }
    };
    var view = {
        setSpielstein: function setSpielstein(col, row) {
            $($("#vg tr > td:nth-child(" + col + ")")[row]).css('background-image', "url(img/playera.gif)");
        },
        render: function render(divid, model) {
            var table = $('<table id="vg"></table>');
            for (var i = 0; i < 6; i++) {
                var row = $('<tr></tr>');
                for (var j = 0; j < 7; j++) {
                    row.append($('<td></td>'));
                }
                table.append(row);
            }
            var foot = $('<tfoot></tfoot>');
            row = $('<tr></tr>');
            for (var j = 0; j < 7; j++) {
                var butt = $('<button id=id' + j + '/>').on('click',
                        function (col) {
                            return function () {
                                model.ziehe(col);
                                //view.render()
                            };
                        }(j));
                foot.append($('<td></td>').append(butt));
            }
            foot.append(row);
            table.append(foot);
            $(divid).append(table);
        }
    };
    model.init();
    return {
        model: model,
        view: view,
    };
}());

////////////////////////////////////////////////////////////////////////////////////////////////
var myModule = (function () {
    return {
        hello: function hello() {
            return 'Hello, world!';
        }
    };
}());
test('Module pattern', function () {
    equal(myModule.hello(), 'Hello, world!', 'Module works.');
});
