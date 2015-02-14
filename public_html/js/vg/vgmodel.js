var vgmodel = (function () {
    var NCOL = staticModel.getDIM().NCOL;
    var NROW = staticModel.getDIM().NROW;
    var STYP = {CMP: 1, MAN: 0};

    var state = {
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
        aktWert: 0
    };
    function move(c) {
        if (state.hoehe[c] === NROW)
            return false;
        state.sfeld[c + NCOL * state.hoehe[c]] = state.amzug;
        state.hoehe[c] += 1;
        state.amzug = state.amzug === STYP.MAN ? STYP.CMP : STYP.MAN;
        return true;
    }
    function init(amzug) {
        state.amzug = amzug || STYP.CMP;
        for (var s = 0; s < NCOL; s++) {
            state.hoehe.push(0);
        }
    }
    function getField(r, c) {
        var x = state.sfeld[c + NCOL * r];
        if (x === undefined)
            return " ";
        return x === STYP.CMP ? "X" : "O"
    }
    // API
    return {
        getRowOfCol: function(c){ return NROW - state.hoehe[c]},
        amzug: function(){ return state.amzug; },
        move: move,
        init: init,
        getField: getField
    };
}());