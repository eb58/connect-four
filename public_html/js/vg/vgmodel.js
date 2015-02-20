var vgmodel = (function () {

    "use strict";
    var MAXVAL = 1000000;
    var NCOL = vgmodelstatic.getDIM().NCOL;
    var NROW = vgmodelstatic.getDIM().NROW;
    var STYP = vgmodelstatic.STYP;

    var NROWNCOL = NROW * NCOL;
    var ord = [3, 4, 2, 5, 1, 6, 0];
    var maxLev = 2;
    var state = vgmodelstatic.getInitialState();

    function init(whosTurn) {
        state = vgmodelstatic.getInitialState();
        state.whosTurn = whosTurn === 'player1' ? STYP.player1 : STYP.player2;
        state.cnt = { player1:0, player2:0 };
    }

    function transitionGR(state, a) {
        if (a === STYP.empty){
            var cnt = state.whosTurn===STYP.player1? state.cnt.player1:state.cnt.player2 ;
            cnt++;
            return state.whosTurn;
        }
        if (a === state.whosTurn){
            return a; // or e
        }
        if (a !== state.whosTurn ){
            var cnt = state.whosTurn===STYP.player1? state.cnt.player1:state.cnt.player2 ;
            cnt--;
            return STYP.neutral;
        }
        if (a === STYP.neutral){
            return a === STYP.neutral;
        }
    }

    function move(c, mstate) {
        if (mstate === undefined)
            mstate = state;
        if (mstate.hcol[c] === NROW)
            return 'notallowed';
        if (mstate.isMill)
            return 'notallowed';
        var fldnr = c + NCOL * mstate.hcol[c];
        mstate.cntMove += 1;
        var grs = vgmodelstatic.grs[fldnr];
        $.each(grs, function (n, v) {
            var x = mstate.grstate[v];
            x.occupiedBy = transitionGR(mstate, x.occupiedBy );
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

    function computeVal(state) {  	
        return state.isMill * MAXVAL;
    }

    function miniMax(state, lev, alpha, beta) { // bewerte state rekursiv, Negamax!
        if (state.cntMove >= NROWNCOL) {
            return 0;
        }

        if (state.isMill || lev === 0) {
            return -(computeVal(state) + lev);
        }

        state.maxVal = alpha;
        for (var c = 0; c < NCOL; c++) {
            var ordc = ord[c];
            if (state.hcol[ordc] < NROW) { // Untersuche alle möglichen Züge 
                var lstate = $.extend(true, {}, state);
                move(ordc, lstate);
                var val = -miniMax(lstate, lev - 1, -beta, -state.maxVal);
                if (val > state.maxVal) {
                    state.maxVal = val;
                    state.bestMove = ordc;
                    if (state.maxVal >= beta) {
                        return state.maxVal;
                    }
                }
            }
        }
        return state.maxVal;
    }

    function bestMove() {
        var lstate = $.extend(true, {}, state);
        miniMax(lstate, 1, -MAXVAL, +MAXVAL);
        if (lstate.isMill)            
            return lstate.bestMove;
        miniMax(state, maxLev, -MAXVAL, +MAXVAL);
        return state.bestMove;
    }
    init();
    ////////////////////////////////////////////////////////////
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
        bestMove: bestMove
    };
}());

QUnit.test('model', function () {
    var model = vgmodel;

    equal(model.setMaxLevel(3), 3, 'SetMaxLevel ok.');
    equal(model.setMaxLevel(4), 4, 'SetMaxLevel ok.');
    model.init('player1');
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
    equal(model.whosTurn(), 'player1', 'WhosTurn7 ok.');
    //ok(model.bestMove() > 0, 'Evaluate ok');
    model.init();
});

