/* global vgmodelstatic, _, QUnit */

var vgmodel = (function () {
   "use strict";
   var MAXVAL = 1000000;
   var NCOL = vgmodelstatic.getDIM().NCOL;
   var NROW = vgmodelstatic.getDIM().NROW;
   var STYP = vgmodelstatic.STYP;

   var ord = [3, 4, 2, 5, 1, 6, 0];
   var whoBegins;
   var courseOfGame = [];
   var maxLev = 4;
   var state = vgmodelstatic.getInitialState();

   function possibleMoves(state) {
      var mvs = _.range(NCOL).filter(function (c) {
         state.hcol[c] < NROW;
      });
      return mvs;
   }
   
   function init(whosTurn) {
      state = vgmodelstatic.getInitialState();
      state.whosTurn = whosTurn === 'player1' ? STYP.player1 : STYP.player2;
      state.cnt = {player1: 0, player2: 0};
      whoBegins = state.whosTurn;
   }

   function transitionGR(e, a) {
      if (a === STYP.empty) {
         return e;
      }
      if (a === e) {
         return a; // or e
      }
      if (a !== e) {
         return STYP.neutral;
      }
      if (a === STYP.neutral) {
         return STYP.neutral;
      }
   }

   function move(c, mstate) {
      if (mstate === undefined)
         mstate = state;
      if (mstate.hcol[c] === NROW)
         return 'notallowed';
      if (mstate.isMill)
         return 'notallowed';
      mstate.cntMoves += 1;
      var grs = vgmodelstatic.grs[c + NCOL * mstate.hcol[c]];
      grs.forEach( function (v) {
         var gr = mstate.grstate[v];
         gr.occupiedBy = transitionGR(mstate.whosTurn, gr.occupiedBy);
         if (gr.occupiedBy !== STYP.neutral)
            gr.cnt++;
         if (gr.cnt >= 4) {
            mstate.isMill = true;
         }
      });
      mstate.hcol[c] += 1;
      mstate.whosTurn = mstate.whosTurn === STYP.player1 ? STYP.player2 : STYP.player1;
      courseOfGame.push(c);
      return 'ok';
   }

   function undoLastMove() {
      init(whoBegins);
      courseOfGame.pop();
   }

   function computeVal(state) {
      var v = 0;
      state.grstate.forEach(function (gr,idx) {
         var n = gr.cnt;
         var factor = n===3 ? vgmodelstatic.gr[idx].val : 1;
         v += gr.occupiedBy === STYP.player1 ? n * n * n * n * factor : 0;
         v -= gr.occupiedBy === STYP.player2 ? n * n * n * n * factor : 0;
      });
      return state.whosTurn === STYP.player1 ? v : -v;
   }

   function miniMax(state, lev, alpha, beta) { // evaluate state recursive, negamax algorithm!
      state.bestMove = -1;

      if (state.isMill) {
         return -MAXVAL - lev;
      }
      if (lev === 0) {
         return computeVal(state);
      }
      state.maxVal = alpha;
      for (var c = 0; c < NCOL; c++) {
         var ordc = ord[c];
         if (state.hcol[ordc] < NROW) { // try all possible moves
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
//      var val = miniMax(lstate, 2, -MAXVAL, +MAXVAL);
//      if (val >= MAXVAL)
//         return lstate.bestMove;
      lstate = $.extend(true, {}, state);
      miniMax(lstate, maxLev, -MAXVAL, +MAXVAL);
      if (lstate.bestMove !== -1)
         return lstate.bestMove;
      // there is no best move, just take first possible,
      var mvs = possibleMoves(state);
      return mvs.length ? mvs[0] : -1;
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
      getField: function (r,c) {
         return  state.sfeld[c + NCOL * r];
      },
      move: move,
      undoLastMove: undoLastMove,
      init: init,
      bestMove: bestMove

   };
}());

QUnit.test('model', function () {
   function move(m, arr) {
      arr.forEach(function (v) {
         m.move(v);
      });
   }
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
   move(model, [0, 6, 0, 6, 0, 6]);
   ok(model.bestMove() === 0, 'Evaluate ok');
   move(model, [1]);
   ok(model.bestMove() === 6, 'Evaluate ok');
   model.init();
   move(model, [3, 3, 4, 4]);
   ok(model.bestMove() === 5, 'Evaluate ok');
   model.init();
}
);