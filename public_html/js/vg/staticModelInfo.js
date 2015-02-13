var staticModel = (function () {
    var DIM = {SANZ:7, ZANZ:7 };
    var SANZ = DIM.SANZ;
    var ZANZ = DIM.ZANZ;
    var gr = []; // Gewinnreihen
    var grs = []; // Gewinnreihen pro Feld  

    berechneGRs: function berechneGRs(dx, dy, s, z) {
        var arr = [];
        while (s >= 0 && s < SANZ && z >= 0 && z < ZANZ) {
            arr.push(s + SANZ * z);
            if (arr.length === 4) {
                gr.push(arr);
                return;
            }
            s += dx;
            z += dy;
        }
    }
    init: function init() {
        gr = [];
        for (var s = 0; s < SANZ; s++) {
            for (var z = 0; z < ZANZ; z++) {
                berechneGRs(0, 1, s, z);
                berechneGRs(1, 1, s, z);
                berechneGRs(1, 0, s, z);
                berechneGRs(-1, 1, s, z);
            }
        }
        grs = [];
        for (i = 0; i < SANZ * ZANZ; i++) {
            var arr = [];
            for (j = 0; j < gr.length; j++) {
                if (1){ // _.contains(gr[j], i)) {
                    arr.push(j);
                }
            }
            grs[i] = arr;
        }
        dump();
    }
    dump: function dump() {
        $.each(gr, function (idx, val) {
            console.log("gr: " + val);
        });
        $.each(grs, function (idx, val) {
            console.log("grs: " + val);
        });
    }
    test: function test() {
       init();
       return gr.length===88;
    }
// Interface
    return {
        getDIM: function(){ return DIM; },
        init: init,
        dump: dump,
        test: test
    };
}());

test('staticModel', function () {
    equal(staticModel.getDIM().SANZ, 7, 'Dimension ok.');
    equal(staticModel.getDIM().ZANZ, 7, 'Dimension ok.');
});
   