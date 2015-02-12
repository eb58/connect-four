
require(["/js/vendor/qunit.js"]);
require(["/js/vendor/underscore.js"]);
require(["/js/vendor/jquery-1.9.1.min.js"]);
require(["/js/vg/staticModelInfo.js"]);
       
var vg = (function () {
    var STYP = {CMP: 1, MAN: 0};
    var DIM = staticModel.getDIM();
    var SANZ = DIM.SANZ;
    var ZANZ = DIM.ZANZ;
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
        ziehe: function (c) {
            this.s[c][hoehe[c]] = this.amzug;
            this.hoehe[c] += 1;
            this.amzug = this.amzug === STYP.MAN ? STYP.CMP : STYP.MAN;
        },
        init: function (amzug) {
            this.amzug = amzug;
            for (var s = 0; s < SANZ; s++) {
                this.hoehe.push(0);
                this.sfeld.push([]);
            }
        }
    };
    var view = {
        setSpielstein: function (col, row) {
            $($("#vg tr > td:nth-child(" + col + ")")[row]).css('background-image', "url(img/playera.gif)");
        },
        render: function () {
            var table = $('<table id="vg"></table>');
            for (var i = 0; i < 6; i++) {
                for (var j = 0; j < 7; j++) {
                    $('<tr></tr>').append($('<td></td>'));
                }
                table.append(row);
            }
            var row = $('<tr></tr>');
            for (var j = 0; j < 7; j++) {
                var butt = $('<button id=id' + j + '/>').on('click',
                        function (col) {
                            return function () {
                                model.ziehe(col);
                                render()
                            };
                        }(j));
                row.append($('<td></td>').append(butt));
            }
            $('<tfoot></tfoot>').append(row);
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
