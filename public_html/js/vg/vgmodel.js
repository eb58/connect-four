var vgmodel = (function () {
    "use strict";
    var NCOL = staticModel.getDIM().NCOL;
    var NROW = staticModel.getDIM().NROW;
    var STYP = {empty: 0, player1: 1, player2: 2, neutral: 3};

    var state = {
        hcol: [], // height of cols
        fld: [], // playing field
        whosTurn: STYP.player1,
        isMill: 0,
        cntMove: 0,
        actMove: -1,
        grstate: []
    };
    var transitionGR = function (a, e) {
        if (a === STYP.empty)
            return e;
        if (a === e)
            return a; // or e
        if (a !== e)
            return STYP.neutral;
        if (a === STYP.neutral)
            return  a === STYP.neutral;
    };

    function move(c) {
        if (state.hcol[c] === NROW)
            return {state:'notallowed'};
        state.actMove = c + NCOL * state.hcol[c]
        state.cntMove += 1;
        var sgrs = staticModel.grs[state.actMove];
        $.each(sgrs, function (n,v) {
            var x = state.grstate[v];
            x.occupiedBy = transitionGR(x.occupiedBy, state.whosTurn);
            if( x.occupiedBy!==STYP.neutral) x.cnt++;
            if (x.cnt >= 4) {
                state.isMill = true;
            }
        });
        state.hcol[c] += 1;
        state.whosTurn = state.whosTurn === STYP.player1 ? STYP.player2 : STYP.player1;

        return state.isMill ? {state:'ismill'}: {state:'ok'};
    }
    function init(amzug) {
        state.whosTurn = amzug || STYP.player1;
        for (var s = 0; s < NCOL; s++) {
            state.hcol.push(0);
        }
        $.each(staticModel.gr, function (n) {
            state.grstate[n] = {occupiedBy: STYP.empty, cnt: 0};
        });
    }

    // API
    return {
        getRowOfCol: function (c) {
            return NROW - state.hcol[c]
        },
        whosTurn: function () {
            return state.whosTurn === STYP.player1 ? 'player1' : 'player2';
        },
        getField: function () {
            return  state.sfeld[c + NCOL * r];
        },
        move: move,
        init: init
    };
}());