const { TT_FLAGS, getTTSizeForDepth, TranspositionTable, pieceKeys } = require('./cf-transpositionTable')

const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const [COLS, ROWS] = [7, 6]
const MAXVAL = 100
const Player = { ai: 0, hp: 1 } // AI / human player

////////////////////////////////////////////////////////////////////////////////////////////////////////

const cfEngine = (() => {
  const loosingMove = (m) => m.score < 0

  const printBoard = () => {
    const has = (bb, idx) => (idx < 32 ? bb[0] & (1 << idx) : bb[1] & (1 << (idx - 32)))

    let res = ''
    for (let r = ROWS - 1; r >= 0; r--) {
      let row = ''
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c
        if (has(state.bitboards[0], idx)) row += ' X '
        else if (has(state.bitboards[1], idx)) row += ' O '
        else row += ' _ '
      }
      res += row + '\n'
    }
    console.log(res)
  }

  const init = (player = Player.ai) => {
    state.heightCols = new Uint32Array(COLS)
    state.currentPlayer = player
    state.cntMoves = 0
    state.bitboards = [new Uint32Array(2), new Uint32Array(2)]
    state.hash = 0
  }

  const doMove = (c) => {
    const idx = c + COLS * state.heightCols[c]
    state.hash ^= pieceKeys[state.currentPlayer ? idx : idx + 42]
    state.bitboards[state.currentPlayer][idx < 32 ? 0 : 1] |= 1 << (idx < 32 ? idx : idx - 32)
    state.heightCols[c]++
    state.currentPlayer = 1 - state.currentPlayer
    state.cntMoves++
  }

  const undoMove = (c) => {
    state.cntMoves--
    state.currentPlayer = 1 - state.currentPlayer
    --state.heightCols[c]
    const idx = c + COLS * state.heightCols[c]
    state.bitboards[state.currentPlayer][idx < 32 ? 0 : 1] &= ~(1 << (idx < 32 ? idx : idx - 32))
    state.hash ^= pieceKeys[state.currentPlayer ? idx : idx + 42]
  }

  const checkWinningCol = (c, player = state.currentPlayer) => checkWinning(c, state.heightCols[c], player)

  const checkWinning = (col, row, player) => {
    const bb = state.bitboards[player]
    const bbLo = bb[0]
    const bbHi = bb[1]
    const has = (idx) => (idx < 32 ? bbLo & (1 << idx) : bbHi & (1 << (idx - 32)))

    // vertical
    for (let count = 1, r = row - 1; r >= 0 && has(r * COLS + col); r--) if (++count >= 4) return true

    // horizontal
    let count = 1
    for (let c = col - 1; c >= 0 && has(row * COLS + c); c--) if (++count >= 4) return true
    for (let c = col + 1; c < COLS && has(row * COLS + c); c++) if (++count >= 4) return true

    // diagonal \
    count = 1
    for (let r = row - 1, c = col - 1; c >= 0 && r >= 0 && has(r * COLS + c); r--, c--) if (++count >= 4) return true
    for (let r = row + 1, c = col + 1; c < COLS && r < ROWS && has(r * COLS + c); r++, c++) if (++count >= 4) return true

    // diagonal /
    count = 1
    for (let r = row - 1, c = col + 1; c < COLS && r >= 0 && has(r * COLS + c); r--, c++) if (++count >= 4) return true
    for (let r = row + 1, c = col - 1; c >= 0 && r < ROWS && has(r * COLS + c); r++, c--) if (++count >= 4) return true

    return false
  }

  const state = {} // state that is used for evaluating
  const searchInfo = { nodes: 0 }
  const timeOut = () => Date.now() >= searchInfo.stopAt

  const negamax = (columns, depth, alpha, beta) => {
    if ((++searchInfo.nodes & 65535) === 0 && timeOut()) return 0
    if (depth === 0 || state.cntMoves === 42) return 0

    const score  = tt.getScore(state.hash, depth, alpha, beta)
    if (score !== null) return score

    for (const c of columns)
      if (state.heightCols[c] < ROWS && checkWinningCol(c)) {
        tt.store(state.hash, depth, MAXVAL, TT_FLAGS.exact)
        return MAXVAL
      }

    const alphaOrig = alpha
    for (const c of columns)
      if (state.heightCols[c] < ROWS) {
        doMove(c)
        const score = -negamax(columns, depth - 1, -beta, -alpha)
        undoMove(c)
        if (score >= beta) {
          tt.store(state.hash, depth, score, TT_FLAGS.lower_bound) //  faster without this ????
          return score
        }
        if (score > alpha) alpha = score
      }
    tt.store(state.hash, depth, alpha, alpha <= alphaOrig ? TT_FLAGS.upper_bound : TT_FLAGS.exact)
    return alpha
  }

  const findBestMove = (opts) => {
    const t = timer()
    opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
    searchInfo.nodes = 0
    searchInfo.stopAt = Date.now() + opts.maxThinkingTime
    const columns = [3, 4, 2, 5, 1, 6, 0].filter((c) => state.heightCols[c] < ROWS)

    for (const c of columns) if (checkWinningCol(c)) return { ...searchInfo, bestMoves: [{ move: c, score: MAXVAL }], elapsedTime: t.elapsedTime() }

    for (let depth = 1; depth <= opts.maxDepth; depth++) {
      tt = new TranspositionTable(getTTSizeForDepth(depth))
      searchInfo.depth = depth
      searchInfo.bestMoves = []
      let score = 0

      for (const c of columns) {
        doMove(c)
        score = -negamax(columns, depth, -MAXVAL, +MAXVAL)
        searchInfo.bestMoves.push({ move: c, score: score === -0 ? 0 : score })
        undoMove(c)
        if (score > 0 || timeOut()) break
      }

      searchInfo.bestMoves.sort((a, b) => b.score - a.score)
      // console.log(infoStr({ ...searchInfo, elapsedTime: t.elapsedTime(), TT }))
      if (score > 0 || timeOut()) break
      const loosingMoves = searchInfo.bestMoves.filter(loosingMove)
      if (loosingMoves.length >= searchInfo.bestMoves.length - 1) break // all moves but one lead to disaster
    }
    searchInfo.bestScore = searchInfo.bestMoves[0].score
    return { ...searchInfo, elapsedTime: t.elapsedTime() }
  }

  const initGame = (fen, player) => {
    init(player)
    const moves = fen
      .trim()
      .split('')
      .map((x) => x - 1)
    moves.forEach((c) => doMove(c))
  }

  const infoStr = (sc) => {
    const movesStr = sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')
    return `DEPTH:${sc.depth} { ${movesStr} } NODES:${sc.nodes} ${sc.elapsedTime}ms ${sc.TT?.info()}`
  }

  init()
  return {
    COLS,
    ROWS,
    Player,
    printBoard,
    init,
    initGame,
    doMove,
    undoMove,
    findBestMove,
    infoStr,
    checkWinning,
    getHeightOfCol: (c) => state.heightCols[c],
    currentPlayer: () => state.currentPlayer,
    opponentPlayer: () => 1 - state.currentPlayer,
    isDraw: () => state.cntMoves === ROWS * COLS
  }
})()

if (typeof module !== 'undefined') module.exports = cfEngine
