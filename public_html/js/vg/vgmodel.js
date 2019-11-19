/* global vgmodelstatic, _, QUnit */
const vgmodel = (function () {
  "use strict";

  const MAXVAL = 100000;
  const [NCOL, NROW] = [vgmodelstatic.DIM.NCOL, vgmodelstatic.DIM.NROW];
  const STYP = vgmodelstatic.STYP;
  const rangeNCOL = _.range(NCOL);
  const ORDER = [3, 4, 2, 5, 1, 6, 0];

  const origStateOfGame = {
    whoBegins: 'player1',
    maxLev: 6,
    courseOfGame: [],
  };

  const origState = {// state that is used for evaluating 
    hcol: rangeNCOL.map(() => 0), // height of cols = [0,0,0,...,0];
    grstate: _.range(vgmodelstatic.gr.length).map(() => ({occupiedBy: STYP.empty, cnt: 0})),
    whosTurn: origStateOfGame.whoBegins === 'player1' ? STYP.player1 : STYP.player2,
    isMill: false,
    bestMove: -1,
    cntMoves: 0,
  };

  let state;
  let stateOfGame;

  const init = whoBegins => {
    state = $.extend(true, {}, origState);
    stateOfGame = $.extend(true, {}, origStateOfGame);
    state.whosTurn = whoBegins === 'player1' ? STYP.player1 : STYP.player2;
    stateOfGame.whoBegins = whoBegins;
  }

  const possibleMoves = state => rangeNCOL.filter(c => state.hcol[c] < NROW);

  const transitionGR = (e, a) => { // e eingang   a ausgang
    if (a === STYP.empty)
      return e;
    if (a === e)
      return a; // or e
    if (a !== e)
      return STYP.neutral;
  }

  const move = (c, mstate) => {
    mstate = mstate || state;

    if (mstate.isMill || mstate.hcol[c] === NROW) {
      return 'notallowed';
    }

    // update state of gewinnreihen attached in move c
    const grs = vgmodelstatic.grs[c + NCOL * mstate.hcol[c]];
    grs && grs.forEach(v => {
      const gr = mstate.grstate[v];
      gr.occupiedBy = transitionGR(mstate.whosTurn, gr.occupiedBy);
      gr.cnt += gr.occupiedBy !== STYP.neutral;
      if (gr.cnt >= 4) {
        mstate.isMill = true; // !!!
      }
    });
    mstate.cntMoves += 1;
    mstate.hcol[c] += 1;
    mstate.whosTurn = mstate.whosTurn === STYP.player1 ? STYP.player2 : STYP.player1;

    return mstate.isMill ? 'isMill' : mstate.cntMoves === NROW * NCOL ? 'draw' : 'notallowed';
  }

  const undoMove = () => {
  }

  const computeValOfNode = state => {
    const v = state.grstate.reduce((acc, gr) => {
      const n = gr.cnt;
      const factor = 1;//  n === 3 ? vgmodelstatic.gr.val : 1;
      return acc
              + (gr.occupiedBy === STYP.player1 ? n * n * n * n * factor : 0)
              - (gr.occupiedBy === STYP.player2 ? n * n * n * n * factor : 0);
    }, 0);
    return state.whosTurn === STYP.player1 ? v : -v;
  }

  const miniMax = (state, lev, alpha, beta) => { // evaluate state recursive, negamax algorithm!
    state.bestMove = -1;
    if (state.isMill) {
      return -(MAXVAL + lev);
    }

    if (lev === 0) {
      return computeValOfNode(state);
    }

    const moves = possibleMoves(state);
    if (moves.length === 0) {
      return computeValOfNode(state);
    }

    let maxVal = alpha;
    const valuesOfMoves = rangeNCOL.map(() => alpha);

    for (let i = 0; i < moves.length; i++) {
      const ordc = ORDER[moves[i]];
      const lstate = $.extend(true, {}, state);
      move(ordc, lstate);
      const val = -miniMax(lstate, lev - 1, -beta, -maxVal);
      valuesOfMoves[ordc] = val;
      if (val > maxVal) {
        maxVal = val;
        state.bestMove = ordc;
        if ( maxVal >= beta) {
          break;
        }
      }
    }
    console.log('LEV:', lev, 'VALS:', valuesOfMoves, 'MAXVAL:', maxVal, 'BESTMOVE', state.bestMove)
    return maxVal;
  }
  
  const bestMove = () => {
      let lstate = $.extend(true, {}, state);
      miniMax(lstate, stateOfGame.maxLev, -MAXVAL, +MAXVAL);
      if (lstate.bestMove !== -1)
        return lstate.bestMove;
      // there is no best move, just take first possible,
      return possibleMoves(state)[0]
    }

  const api = {
    init: init,
    setLevel: n => stateOfGame.maxLev = n,
    setWhoBegins: player => stateOfGame.whoBegins = player,
    getHeightOfCol: c => state.hcol[c],
    whosTurn: () => state.whosTurn === STYP.player1 ? 'player1' : 'player2',
    undoMove: undoMove,
    move: move,
    bestMove: bestMove,
  }

  return api
}());