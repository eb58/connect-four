var staticModel = (function () {
    "use strict";
    var DIM = {NCOL: 7, NROW: 7};
    var gr = []; // Gewinnreihen
    var grs = []; // Gewinnreihen pro Feld  

    function berechneGRs(r, c, dr, dc) { // dr = delta row,  dc = delta col
        var arr = [];
        while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL) {
            arr.push(c + DIM.NCOL * r);
            if (arr.length === 4) {
                gr.push(arr);
                return;
            }
            c += dc;
            r += dr;
        }
    }
    function init() {
        gr = [];
        for (var r = 0; r < DIM.NROW; r++) {
            for (var c = 0; c < DIM.NCOL; c++) {
                berechneGRs(r, c, 0, 1);
                berechneGRs(r, c, 1, 1);
                berechneGRs(r, c, 1, 0);
                berechneGRs(r, c, -1, 1);
            }
        }
        grs = [];
        for (var i = 0; i < DIM.NCOL * DIM.NROW; i++) {
            var arr = [];
            for (var j = 0; j < gr.length; j++) {
                if (_.contains(gr[j], i)) {
                    arr.push(j);
                }
            }
            grs[i] = arr;
        }
        //dump();
    }
    function dump() {
        $.each(gr, function (idx, val) {
            console.log("gr: " + val);
        });
        $.each(grs, function (idx, val) {
            console.log("grs: " + val);
        });
    }
    function test() {
        return gr.length === 88;
    }
    init();
// Interface
    return {
        getDIM: function () {
            return DIM;
        },
        init: init,
        dump: dump,
        test: test,
        gr: gr,
        grs: grs
    };
}());

QUnit.test('staticModel', function () {
    equal(staticModel.getDIM().NCOL, 7, 'Dimension ok.');
    equal(staticModel.getDIM().NROW, 7, 'Dimension ok.');
    ok(staticModel.test, "Interne Tests ok");
});
   