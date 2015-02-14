var vgmodel = (function () {

    "use strict";
    var MAXVAL = 100000;
    var NCOL = staticModel.getDIM().NCOL;
    var NROW = staticModel.getDIM().NROW;
    var NROWNCOL = NROW * NCOL;
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

    function move(c,mstate) {
        if( mstate===undefined) 
            mstate = state;
        if (mstate.hcol[c] === NROW)
            return {mstate: 'notallowed'};
        mstate.actMove = c + NCOL * mstate.hcol[c]
        mstate.cntMove += 1;
        var sgrs = staticModel.grs[mstate.actMove];
        $.each(sgrs, function (n, v) {
            var x = mstate.grstate[v];
            x.occupiedBy = transitionGR(x.occupiedBy, mstate.whosTurn);
            if (x.occupiedBy !== STYP.neutral)
                x.cnt++;
            if (x.cnt >= 4) {
                mstate.isMill = true;
            }
        });
        mstate.hcol[c] += 1;
        mstate.whosTurn = mstate.whosTurn === STYP.player1 ? STYP.player2 : STYP.player1;

        return mstate.isMill ? {mstate: 'ismill'} : {mstate: 'ok'};
    }

    function init(whosTurn) {
        state.whosTurn = whosTurn || STYP.player1;
        for (var s = 0; s < NCOL; s++) {
            state.hcol.push(0);
        }
        for (var i = 0; i < staticModel.gr.length; i++) {
            state.grstate[i] = {
                occupiedBy: STYP.empty,
                cnt: 0
            };
        }
    }
   
    function val(state) {  	// Wert der Stellung aus Sicht des Computers
        return state.isMill * 1000;
    }

    function alpha_beta(state, lev, alpha, beta) {
        // Liefert Wert der Stellung ss aus Sicht der Seite, die am Zug ist!
        // Setzt außerdem den Wert ss->zug als dem besten Zug für diese Stellung!
        var ord = [3, 4, 2, 5, 1, 6, 0];

        if (state.cntMove > NROWNCOL)
            return 0; // Remis!

        if (lev >= maxlev) {
            var v = val(state);
            return lev % 2 === 0 ? v : -v;
        }

        var max = -MAXVAL + lev; // wir gehen vom schlimmsten aus; (+lev siehe Kommentar unten)
        var besterzug = -1;

        var lstates = [];
        for (var c = 0; c < NCOL; c++) {
            if (state.hcol[c] < NROW) { // Untersuche alle Zuege 
                lstates[c] = $.extend(true, {}, state);
                lstate.move(c,lstates[c]);
                if (lstate.isMill) {
                    //if( lev===0 ) zug = i; 
                    // Wert aus Sicht der Seite, die am Zug war; 
                    // -lev, damit Züge, die möglichst schnell zum MATT führen, bevorzugt werden!
                    return MAXVAL - lev;
                }
            }
        }
        for (c = 0; c < NCOL; c++) {
            if (state.h[ord[c]] < NROW) {
                var w = -alpha_beta(lstates[c], lev + 1, -beta, -alpha);
                if (w > max) {  // neuer bester Wert gefunden 
                    max = w;
                    besterzug = ord[i];

                    if (w >= beta) {
                        //if( lev==0 ) ss->zug = besterzug;
                        return max;
                    }
                    if (w > alpha)
                        alpha = w;// Verbesserter alpha Wert 
                }
            }
        }
        if (lev === 0)
            state.bestmove = besterzug;
        return max;
    }
    init();
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