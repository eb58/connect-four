var vgmodel = (function () {

    "use strict";
    var MAXVAL = 1000000;
    var NCOL = vgmodelstatic.getDIM().NCOL;
    var NROW = vgmodelstatic.getDIM().NROW;
    var NROWNCOL = NROW * NCOL;
    var STYP = {empty: 0, player1: 1, player2: 2, neutral: 3};
    var ord = [3, 4, 2, 5, 1, 6, 0];
    var maxLev = 8;

    var initState = {
        hcol: [], // height of cols
        //fld: [], // playing field
        whosTurn: STYP.player1,
        isMill: 0,
        cntMove: 0,
        actMove: -1,
        bestMove: -1,
        maxVal: -MAXVAL,
        grstate: []
    };
    var state;

    for (var s = 0; s < NCOL; s++) {
        initState.hcol.push(0);
    }
    for (var i = 0; i < vgmodelstatic.gr.length; i++) {
        initState.grstate[i] = {
            occupiedBy: STYP.empty,
            cnt: 0
        };
    }

    function transitionGR(a, e) {
        if (a === STYP.empty)
            return e;
        if (a === e)
            return a; // or e
        if (a !== e)
            return STYP.neutral;
        if (a === STYP.neutral)
            return  a === STYP.neutral;
    }

    function move(c, mstate) {
        if (mstate === undefined)
            mstate = state;
        if (mstate.hcol[c] === NROW)
            return 'notallowed';
        if (mstate.isMill )
            return 'notallowed';
        mstate.actMove = c + NCOL * mstate.hcol[c]
        mstate.cntMove += 1;
        var sgrs = vgmodelstatic.grs[mstate.actMove];
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
        return 'ok';
    }

    function init(whosTurn) {
        state = $.extend(true, {}, initState);
        state.whosTurn = whosTurn === 'player2' ? STYP.player2 : STYP.player1;
    }

    function computeVal(state, lev) {  	// Wert der Stellung aus Sicht Spielers am Zug
        var v = state.isMill * MAXVAL;
        return lev % 2 ? v : -v;
    }

    function miniMax(state, lev, alpha, beta) { // bewerte state aus Sicht von player1
        if (state.cntMove >= NROWNCOL) {
            return 0; // Remis!
        }

        if (state.isMill || lev === maxLev) {
            return computeVal(state);
        }
        state.maxVal = alpha;
        for (var c = 0; c < NCOL; c++) {
            if (state.hcol[ord[c]] < NROW) { // Untersuche alle möglichen Züge 
                var lstate = $.extend(true, {}, state);
                move(ord[c], lstate);
                var val = -miniMax(lstate, lev + 1, -beta, -state.maxVal);
                if (val > state.maxVal) {
                    state.maxVal = val;
                    state.bestMove = ord[c];
                    if (state.maxVal >= beta) {
                        return state.maxVal;
                    }
                }
            }
        }
        return state.maxVal;
    }

    function evalState() {
        //var lstate = $.extend(true, {}, state);
        miniMax(state, 0, -MAXVAL, +MAXVAL);
        return state.bestMove;
    }

    function alpha_betax(state, lev, alpha, beta) {
        // Liefert Wert der Stellung ss aus Sicht der Seite, die am Zug ist!
        // Setzt außerdem den Wert ss->zug als dem besten Zug für diese Stellung!

        if (state.cntMove >= NROWNCOL)
            return 0; // Remis!

        if (lev >= maxLev) {
            var v = computeVal(state);
            return lev % 2 === 0 ? v : -v;
        }

        var maxVal = -MAXVAL + lev; // wir gehen vom schlimmsten aus; (+lev siehe Kommentar unten)

        var lstates = [];
        for (var c = 0; c < NCOL; c++) {
            if (state.hcol[c] < NROW) { // Untersuche alle möglichen Zuege 
                lstate = $.extend(true, {}, state);
                move(c, lstate);
                if (lstate.isMill) {
                    state.bestMove = c;
                    // Wert aus Sicht der Seite, die am Zug war; 
                    // -lev, damit Züge, die möglichst schnell zum MATT führen, bevorzugt werden!
                    return MAXVAL - lev;
                }
                lstates[c] = lstate;
            }
        }
        for (var c = 0; c < NCOL; c++) {
            if (state.hcol[ord[c]] < NROW) {
                var val = -alpha_beta(lstates[c], lev + 1, -beta, -alpha);
                if (val > maxVal) {  // neuer bester Wert gefunden 
                    maxVal = val;
                    state.bestMove = ord[i];

                    if (val >= beta) {
                        state.bestMove = bestMove;
                        state.maxVal = maxVal;
                        return state;
                    }
                    if (val > alpha)
                        alpha = val;// Verbesserter alpha Wert 
                }
            }
        }
        state.bestMove = bestMove;
        state.bestVal = maxVal;
        return maxVal;
    }
    init();
    // API
    return {
        isMill: function () {
            return state.isMill;
        },
        setMaxLevel: function (n) {
            return state.maxLev = n;
        },
        getRowOfCol: function (c) {
            return NROW - state.hcol[c];
        },
        whosTurn: function () {
            return state.whosTurn === STYP.player1 ? 'player1' : 'player2';
        },
        getField: function () {
            return  state.sfeld[c + NCOL * r];
        },
        move: move,
        init: init,
        evalState: evalState
    };
}());

QUnit.test('model', function () {
    var model = vgmodel;

    equal(model.setMaxLevel(3), 3, 'SetMaxLevel ok.');
    equal(model.setMaxLevel(4), 4, 'SetMaxLevel ok.');
    model.init();
    equal(model.whosTurn(), 'player1', 'WhosTurn1 ok.');
    model.init('player2');
    equal(model.whosTurn(), 'player2', 'WhosTurn2 ok.');
    model.init('player1');
    equal(model.whosTurn(), 'player1', 'WhosTurn3 ok.');
    model.move(4);
    equal(model.whosTurn(), 'player2', 'WhosTurn4 ok.');
    model.move(3); // p2
    equal(model.whosTurn(), 'player1', 'WhosTurn5 ok.');
    model.move(4);
    model.move(3);
    equal(model.whosTurn(), 'player1', 'WhosTurn6 ok.');
    model.move(4);
    model.move(3);
    ok(model.evalState() > 0, 'Evaluate ok');
    equal(model.whosTurn(), 'player1', 'WhosTurn7 ok.');
    ok(model.evalState() >= 1000, 'Evaluate ok');
    model.init();
});

