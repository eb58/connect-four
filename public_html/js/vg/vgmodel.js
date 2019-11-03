/* global vgmodelstatic, _, QUnit */

const vgmodel = (function () {
  "use strict";
  const MAXVAL = 1000000;
  const NCOL = vgmodelstatic.DIM.NCOL;
  const NROW = vgmodelstatic.DIM.NROW;
  const STYP = vgmodelstatic.STYP;

  const ord = [3, 4, 2, 5, 1, 6, 0];
  const courseOfGame = [];
  const maxLev = 4;
  let state = vgmodelstatic.getInitialState();

  function possibleMoves(state) {
    return _.range(NCOL).filter(c => state.hcol[c] < NROW);
  }

  function init(whosTurn) {
    state = vgmodelstatic.getInitialState();
    state.whosTurn = whosTurn === 'player1' ? STYP.player1 : STYP.player2;
    state.cnt = {player1: 0, player2: 0};
  }

  function transitionGR(e, a) { // e eingang   a ausgang
    if (a === STYP.empty)
      return e;
    if (a === e)
      return a; // or e
    if (a !== e)
      return STYP.neutral;
  }

  function move(c, mstate) {
    if (mstate === undefined)
      mstate = state;
    if (mstate.hcol[c] === NROW)
      return 'notallowed';
    if (mstate.isMill)
      return 'notallowed';
    const grs = vgmodelstatic.grs[c + NCOL * mstate.hcol[c]];
    if (!grs)
      return 'notallowed';
    mstate.cntMoves += 1;
    grs.forEach(function (v) {
      const gr = mstate.grstate[v];
      gr.occupiedBy = transitionGR(mstate.whosTurn, gr.occupiedBy);
      if (gr.occupiedBy !== STYP.neutral)
        gr.cnt++;
      if (gr.cnt >= 4) {
        mstate.isMill = true;
      }
    });
    mstate.hcol[c] += 1;
    mstate.whosTurn = mstate.whosTurn === STYP.player1 ? STYP.player2 : STYP.player1;
    return 'ok';
  }

  function undoMove() {
    init(state.whosTurn);
    courseOfGame.pop();
  }

  function computeVal(state) {
    let v = 0;
    state.grstate.forEach((gr, idx)=> {
      const n = gr.cnt;
      const factor = n === 3 ? vgmodelstatic.gr[idx].val : 1;
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
    for (let c = 0; c < NCOL; c++) {
      const ordc = ord[c];
      if (state.hcol[ordc] < NROW) { // try all possible moves
        const lstate = $.extend(true, {}, state);
        move(ordc, lstate);
        const val = -miniMax(lstate, lev - 1, -beta, -state.maxVal);
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
    let lstate = $.extend(true, {}, state);
//      const val = miniMax(lstate, 2, -MAXVAL, +MAXVAL);
//      if (val >= MAXVAL)
//         return lstate.bestMove;
    miniMax(lstate, maxLev, -MAXVAL, +MAXVAL);
    if (lstate.bestMove !== -1)
      return lstate.bestMove;
    // there is no best move, just take first possible,
    const mvs = possibleMoves(state);
    return mvs.length ? mvs[0] : -1;
  }
  init();
  ////////////////////////////////////////////////////////////
  return {
    isMill: state.isMill,
    setLevel: n => state.maxLev = n,
    getRowOfCol: c => NROW - state.hcol[c],
    whosTurn: () => state.whosTurn === STYP.player1 ? 'player1' : 'player2',
    getField: (r, c)  =>  state.sfeld[c + NCOL * r],
    move: move,
    undoMove: undoMove,
    init: init,
    bestMove: bestMove

  };
}());
