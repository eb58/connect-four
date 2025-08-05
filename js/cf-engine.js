const cfEngine = (() => {
  const range = (n) => [...Array(n).keys()]
  const loosingMove = (m) => m.score < 0

  const [NCOL, NROW] = [7, 6]
  const MAXVAL = 50
  const Player = { ai: -1, hp: +1 } // AI / human player

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  const decorator =
    (f, preCondition) =>
    (...args) =>
      preCondition() ? f(...args) : 0

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  const computeWinningRows = (r, c, dr, dc) => {
    // dr = delta row,  dc = delta col
    const row = []
    const startRow = NROW - r
    while (r >= 0 && r < NROW && c >= 0 && c < NCOL && row.length < 4) {
      row.push(c + NCOL * r)
      c += dc
      r += dr
    }
    return row.length < 4 ? [] : [{ row, val: dc === 0 ? 1 : (dr !== 0 ? 4 : 8) * startRow }]
  }

  // winning rows - length should be 69 for DIM (7x6)
  const winningRows = range(NROW).reduce(
    (acc, r) =>
      range(NCOL).reduce(
        (acc, c) => [...acc, ...computeWinningRows(r, c, 0, 1), ...computeWinningRows(r, c, 1, 1), ...computeWinningRows(r, c, 1, 0), ...computeWinningRows(r, c, -1, 1)],
        acc
      ),
    []
  )

  // list of indices on allWinningRows for each field of board
  const winningRowsForFields = range(NCOL * NROW).map((i) => winningRows.reduce((acc, wr, j) => (wr.row.includes(i) ? [...acc, j] : acc), []))

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  const state = {} // state that is used for evaluating

  const init = (player = Player.ai) => {
    state.heightCols = range(NCOL).map(() => 0)
    state.wrCounterHumanPlayer = winningRows.map(() => 0)
    state.wrCounterAI = winningRows.map(() => 0)
    state.side = player
    state.cntMoves = 0
  }

  const doMove = (c) => {
    const idxBoard = c + NCOL * state.heightCols[c]
    state.heightCols[c]++
    state.side = -state.side
    const counters = state.side === Player.ai ? state.wrCounterAI : state.wrCounterHumanPlayer
    winningRowsForFields[idxBoard].forEach((i) => ++counters[i])
    state.isMill = winningRowsForFields[idxBoard].some((i) => counters[i] >= 4)
    state.cntMoves++
  }

  const undoMove = (c) => {
    --state.heightCols[c]
    state.cntMoves--
    const idxBoard = c + NCOL * state.heightCols[c]
    const counters = state.side === Player.ai ? state.wrCounterAI : state.wrCounterHumanPlayer
    winningRowsForFields[idxBoard].forEach((i) => counters[i]--)
    state.side = -state.side
    state.isMill = false
  }

  const isWinningColumn = (c) => {
    const counters = state.side === Player.hp ? state.wrCounterAI : state.wrCounterHumanPlayer
    return winningRowsForFields[c + NCOL * state.heightCols[c]].some((i) => counters[i] === 3)
  }

  let negamax = (columns, depth, alpha, beta) => {
    if (state.isMill) return -depth
    if (depth === 0 || state.cntMoves === 42) return 0

    const cols = columns.filter((c) => state.heightCols[c] < NROW)
    for (const c of cols) if (isWinningColumn(c)) return depth
    for (const c of cols) {
      doMove(c)
      const score = -negamax(cols, depth - 1, -beta, -alpha)
      undoMove(c)
      if (score > alpha) alpha = score
      if (alpha >= beta) return alpha
    }
    return alpha
  }
  negamax = decorator(negamax, () => ++searchInfo.nodes & 65535 || !timeOut())

  const searchInfo = { nodes: 0, stopAt: 0, depth: 0, bestMoves: [] }
  const timeOut = () => Date.now() >= searchInfo.stopAt

  const searchBestMove = (opts) => {
    opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
    searchInfo.nodes = 0
    searchInfo.startAt = Date.now()
    searchInfo.stopAt = searchInfo.startAt + opts.maxThinkingTime
    const columns = [3, 4, 2, 5, 1, 6, 0].filter((c) => state.heightCols[c] < NROW)
    for (const depth of range(opts.maxDepth).map((x) => x + 1)) {
      searchInfo.depth = depth
      const bestMoves = []
      let score = 0
      for (const c of columns) {
        doMove(c)
        score = -negamax(columns, depth, -MAXVAL, +MAXVAL)
        bestMoves.push({ move: c + 1, score })
        undoMove(c)
        if (score > 0 || timeOut()) break
      }
      if (!timeOut()) searchInfo.bestMoves = bestMoves.sort((a, b) => b.score - a.score)

      const moves = searchInfo.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')
      console.log(`DEPTH:${searchInfo.depth} { ${moves}} NODES:${searchInfo.nodes} ${Date.now() - searchInfo.startAt + 'ms'}`)
      if (score > 0 || timeOut()) return searchInfo
      const loosingMoves = searchInfo.bestMoves.filter(loosingMove)
      if (loosingMoves.length >= searchInfo.bestMoves.length - 1) return searchInfo // all moves (but one) lead to disaster
    }
    return searchInfo
  }

  const initGame = (fen, player) => {
    init(player)
    const moves = fen
      .trim()
      .split('')
      .map((x) => x - 1)
    moves.forEach((c) => doMove(c))
  }

  const isMill = () => state.wrCounterHumanPlayer.some((i) => i >= 4) || state.wrCounterAI.some((i) => i >= 4)

  init()
  return {
    winningRows,
    winningRowsForFields,
    NCOL,
    NROW,
    Player,
    init,
    initGame,
    doMove,
    undoMove,
    searchBestMove,
    isMill,
    isAllowedMove: (m) => state.heightCols[m - 1] < NROW && !isMill() && state.cntMoves !== NROW * NCOL,
    getHeightOfCol: (c) => state.heightCols[c],
    side: () => state.side,
    isDraw: () => state.cntMoves === NROW * NCOL && !isMill()
  }
})()

if (typeof module !== 'undefined') module.exports = cfEngine
