const cfEngine = (() => {
  const range = (n) => [...Array(n).keys()]

  const NCOL = 7,
    NROW = 6
  const MAXVAL = 50
  const Player = { blue: 1, red: 2 } // AI / human player

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  const cache = (insertCondition = (_) => true, c = {}, cnt = 0) => ({
    add: (key, val, ...args) => {
      if (insertCondition(val, ...args)) {
        cnt++ > 10000000 && ((c = {}), (cnt = 0))
        c[key] = val
      }
      return val
    },
    get: (key) => c[key],
    clear: () => ((cnt = 0), (c = {})),
    info: (s = '') => (cnt ? `${s}CACHE:${cnt}` : ''),
  })
  const CACHE = cache((score) => score >= MAXVAL - 50)
  const memoize =
    (f, hash, c = CACHE) =>
    (...args) => {
      const h = hash(...args)
      const val = c.get(h)
      return val !== undefined ? val : c.add(h, f(...args), ...args)
    }
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
        acc,
      ),
    [],
  )

  // list of indices on allWinningRows for each field of board
  const winningRowsForFields = range(NCOL * NROW).map((i) => winningRows.reduce((acc, wr, j) => (wr.row.includes(i) ? [...acc, j] : acc), []))

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  const rand8 = () => Math.floor(Math.random() * 255 + 1)
  const rand48 = () => rand8() * 2 ** 40 + rand8() * 2 ** 32 + rand8() * 2 ** 24 + rand8() * 2 ** 16 + rand8() * 2 ** 8 + rand8()
  const sideKeys = range(3).map(rand48)
  const pieceKeys = range(84).map(rand48)

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  const state = {} // state that is used for evaluating
  let columns = []

  const init = (player = Player.blue) => {
    state.heightCols = range(NCOL).map(() => 0)
    state.wrCounterRed = winningRows.map(() => 0)
    state.wrCounterBlue = winningRows.map(() => 0)
    state.side = player
    state.cntMoves = 0
    state.hash = 0
  }

  const doMove = (c) => {
    const idxBoard = c + NCOL * state.heightCols[c]
    state.heightCols[c]++
    state.side = 3 - state.side
    const counters = state.side === Player.blue ? state.wrCounterBlue : state.wrCounterRed
    winningRowsForFields[idxBoard].forEach((i) => ++counters[i])
    state.isMill = winningRowsForFields[idxBoard].some((i) => counters[i] >= 4)
    state.hash += pieceKeys[idxBoard] + sideKeys[state.side]
    state.cntMoves++
  }

  const undoMove = (c) => {
    --state.heightCols[c]
    state.cntMoves--
    const idxBoard = c + NCOL * state.heightCols[c]
    state.hash -= pieceKeys[idxBoard] + sideKeys[state.side]
    const counters = state.side === Player.blue ? state.wrCounterBlue : state.wrCounterRed
    winningRowsForFields[idxBoard].forEach((i) => counters[i]--)
    state.side = 3 - state.side
    state.isMill = false
  }

  const isWinningColumn = (c) => {
    const counters = state.side === Player.red ? state.wrCounterBlue : state.wrCounterRed
    return winningRowsForFields[c + NCOL * state.heightCols[c]].some((i) => counters[i] === 3)
  }

  const _computeScore = () => {
    const x = winningRows.reduce(
      (res, wr, i) => res + (state.wrCounterRed[i] !== 0 && state.wrCounterBlue[i] !== 0 ? 0 : state.wrCounterBlue[i] - state.wrCounterRed[i]) * wr.val,
      0,
    )
    return state.side === Player.blue ? -x : x
  }
  let computeScore = _computeScore

  let negamax = (depth, alpha, beta) => {
    if (state.isMill) return -depth
    if (depth === 0) return 0
    if (state.cntMoves === 42) return 0
    for (const c of columns) if (state.heightCols[c] < NROW && isWinningColumn(c)) return depth
    // no performance gain ???!!! ---if (columns.reduce((acc, c) => acc + (state.heightCols[c] < NROW && isWinningColumn2(c)) ? 1 : 0, 0) >= 2) return -MAXVAL + depth
    for (const c of columns)
      if (state.heightCols[c] < NROW) {
        doMove(c)
        const score = -negamax(depth - 1, -beta, -alpha)
        undoMove(c)
        if (score > alpha) alpha = score
        if (alpha >= beta) return alpha
      }
    return alpha
  }
  negamax = decorator(negamax, () => ++searchInfo.nodes & 65535 || !timeOut())
  // negamax = memoize(negamax, () => state.hash);

  const searchInfo = { nodes: 0, stopAt: 0, depth: 0, bestMoves: [] }
  const timeOut = () => Date.now() >= searchInfo.stopAt

  const _searchBestMove = (maxThinkingTime, maxDepth, compScore) => {
    computeScore = compScore
    CACHE.clear()
    searchInfo.nodes = 0
    searchInfo.startAt = Date.now()
    searchInfo.stopAt = searchInfo.startAt + maxThinkingTime
    columns = [3, 4, 2, 5, 1, 6, 0].filter((c) => state.heightCols[c] < NROW)
    for (const depth of range(maxDepth / 2).map((x) => 2 * (x + 1))) {
      searchInfo.depth = depth
      searchInfo.bestMoves = []
      let score = 0
      for (const c of columns) {
        doMove(c)
        score = -negamax(depth, -MAXVAL, +MAXVAL)
        searchInfo.bestMoves.push({ move: c + 1, score })
        undoMove(c)
        if (score > 0 || timeOut()) break
      }
      // console.log(`DEPTH:${searchInfo.depth} { ${searchInfo.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${searchInfo.nodes} ${Date.now() - searchInfo.startAt + 'ms'} ${CACHE.info()}`)
      if (score > 0 || timeOut()) break
      if (searchInfo.bestMoves.every((m) => m.score < 0)) break // all moves lead to disaster
    }
    searchInfo.bestMoves.sort((a, b) => b.score - a.score)
    return searchInfo
  }

  const searchBestMove = (opts) => {
    opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
    // 1: look as far possible if we can find a winning move
    return _searchBestMove(opts.maxThinkingTime, opts.maxDepth, () => 0)
    if (sc.bestMoves.length === 0 || sc.bestMoves[0].score > MAXVAL - 50) return sc
    // 2:  look for best move with better evaluating function
    return _searchBestMove(opts.maxThinkingTime / 2, opts.maxDepth, _computeScore)
  }

  const initGame = (fen) => {
    init()
    fen
      .trim()
      .split('')
      .map((x) => x - 1)
      .forEach((c) => doMove(c))
  }

  const isMill = () => state.wrCounterRed.some((i) => i >= 4) || state.wrCounterBlue.some((i) => i >= 4)

  init()
  return {
    CACHE,
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
    hash: () => state.hash,
    isDraw: () => state.cntMoves === NROW * NCOL && !isMill(),
  }
})()

if (typeof module !== 'undefined') module.exports = cfEngine
