var vgmodelstatic = (function () {
    "use strict";
    var DIM = {NCOL: 7, NROW: 7};
    var gr = []; // Gewinnreihen
    var grs = []; // Gewinnreihen pro Feld  

    function getDIM() {
        return DIM;
    }

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
    function internalTests() {
        return gr.length === 88
                && _.isEqual(gr[0], [0, 1, 2, 3])
                && _.isEqual(gr[1], [0, 8, 16, 24])
                && _.isEqual(grs[0], [0, 1, 2])
                && _.isEqual(grs[1], [0, 3, 4, 5])
                ;
    }
    init();
// Interface
    return {
        // Test + Debug
        dump: dump,
        internalTests: internalTests,
        // Public
        getDIM: getDIM,
        gr: gr,
        grs: grs
    };
}());

QUnit.test('staticModel', function () {
    //vgmodelstatic.dump();
    equal(vgmodelstatic.getDIM().NCOL, 7, 'Dimension ok.');
    equal(vgmodelstatic.getDIM().NROW, 7, 'Dimension ok.');
    ok(vgmodelstatic.internalTests, "Interne Tests ok");
});
   