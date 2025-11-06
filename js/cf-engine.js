const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })

const cfEngine = (() => {
  const loosingMove = (m) => m.score < 0

  const [COLS, ROWS] = [7, 6]
  const MAXVAL = 100
  const Player = { ai: 0, hp: 1 } // AI / human player

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  // --- Transposition Table ---
  const TT_FLAGS = { exact: 1, lower_bound: 2, upper_bound: 3 }
  const TT = (() => {
    const table = {}
    let [hits, misses] = [0, 0]
    return {
      store: (hash, depth, score, flag) => ((table[hash] = { depth, score, flag }), score),
      probe: (hash, depth, alpha, beta) => {
        const entry = table[hash]
        if (!entry) {
          misses++
          return null
        }
        if (entry.depth < depth) return null
        hits++
        if (entry.flag === TT_FLAGS.exact) return entry.score
        if (entry.flag === TT_FLAGS.lower_bound && entry.score >= beta) return entry.score
        if (entry.flag === TT_FLAGS.upper_bound && entry.score <= alpha) return entry.score
        return null
      },
      clear: () => {
        for (const k in table) delete table[k]
        hits = misses = 0
      },
      info: () => `TT size:${Object.keys(table).length} hits:${hits} misses:${misses}`
    }
  })()

  const decorator =
    (f, preCondition) =>
    (...args) =>
      preCondition() ? f(...args) : 0

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  /*
  const rand8 = () => Math.floor((Math.random() * 255) + 1)
  const rand32 = () => rand8() << 23 | rand8() << 16 | rand8() << 8 | rand8();
  const sideKeys = [rand32(), rand32()]
  const pieceKeys = range(84).map(() => rand32())
  */
  const pieceKeys = [
    227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957,
    1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671,
    901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931,
    311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967,
    398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066,
    1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180
  ]

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

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

  const state = {} // state that is used for evaluating

  const init = (player = Player.ai) => {
    state.moveHistory = new Uint32Array(COLS * ROWS)
    state.heightCols = new Uint32Array(COLS)
    state.currentPlayer = player
    state.cntMoves = 0
    state.bitboards = [new Uint32Array(2), new Uint32Array(2)]
    state.hash = 0
    TT.clear()
  }

  const doMove = (c) => {
    const idx = c + COLS * state.heightCols[c]
    state.hash ^= pieceKeys[idx + (state.currentPlayer ? 0 : 42)]
    state.bitboards[state.currentPlayer][idx < 32 ? 0 : 1] |= 1 << (idx < 32 ? idx : idx - 32)
    state.heightCols[c]++
    state.currentPlayer = 1 - state.currentPlayer
    state.moveHistory[state.cntMoves++] = c
  }

  const undoMove = (c) => {
    state.cntMoves--
    state.currentPlayer = 1 - state.currentPlayer
    --state.heightCols[c]
    const idx = c + COLS * state.heightCols[c]
    state.bitboards[state.currentPlayer][idx < 32 ? 0 : 1] &= ~(1 << (idx < 32 ? idx : idx - 32))
    state.hash ^= pieceKeys[idx + (state.currentPlayer ? 0 : 42)]
  }

  const checkWinningBoard = () => {
    const col = state.moveHistory[state.cntMoves - 1]
    const row = state.heightCols[col] - 1
    return checkWinning(col, row, 1 - state.currentPlayer)
  }

  const checkWinningCol = (c) => checkWinning(c, state.heightCols[c], state.currentPlayer)

  const checkWinning = (col, row, player) => {
    if (state.cntMoves < 6) return false

    const bb = state.bitboards[player]
    const bbLo = bb[0]
    const bbHi = bb[1]
    const has = (idx) => (idx < 32 ? bbLo & (1 << idx) : bbHi & (1 << (idx - 32)))

    // vertical
    if (row >= 3) for (let count = 1, r = row - 1; r >= 0 && has(r * COLS + col); r--) if (++count >= 4) return true

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

  let negamax = (columns, depth, alpha, beta) => {
    if (depth === 0 || state.cntMoves === 42) return 0

    const ttScore = TT.probe(state.hash, depth, alpha, beta)
    if (ttScore !== null) return ttScore

    for (const c of columns) if (state.heightCols[c] < ROWS && checkWinningCol(c)) return 22 - ((state.cntMoves + 2) >> 1)

    const alphaOrig = alpha
    for (const c of columns)
      if (state.heightCols[c] < ROWS) {
        doMove(c)
        const score = -negamax(columns, depth - 1, -beta, -alpha)
        undoMove(c)
        if (score >= beta) return TT.store(state.hash, depth, score, TT_FLAGS.lower_bound)
        if (score > alpha) alpha = score
      }
    return TT.store(state.hash, depth, alpha, alpha <= alphaOrig ? TT_FLAGS.upper_bound : TT_FLAGS.exact)
  }
  negamax = decorator(negamax, () => ++searchInfo.nodes & 65535 || !timeOut())

  let negascout = (columns, depth, alpha, beta) => {
    if (depth === 0 || state.cntMoves === 42) return 0

    const ttScore = TT.probe(state.hash, depth, alpha, beta)
    if (ttScore !== null) return ttScore

    for (const c of columns) if (state.heightCols[c] < ROWS && checkWinningCol(c)) return 22 - ((state.cntMoves + 2) >> 1)

    const alphaOrig = alpha
    let isFirstChild = true

    for (const c of columns) {
      if (state.heightCols[c] < ROWS) {
        doMove(c)
        let score
        if (isFirstChild) {
          score = -negascout(columns, depth - 1, -beta, -alpha)
          isFirstChild = false
        } else {
          score = -negascout(columns, depth - 1, -alpha - 1, -alpha)
          if (score > alpha && score < beta) score = -negascout(columns, depth - 1, -beta, -score)
        }
        undoMove(c)
        if (score >= beta) return TT.store(state.hash, depth, score, TT_FLAGS.lower_bound)
        if (score > alpha) alpha = score
      }
    }
    return TT.store(state.hash, depth, alpha, alpha <= alphaOrig ? TT_FLAGS.upper_bound : TT_FLAGS.exact)
  }
  negascout = decorator(negascout, () => ++searchInfo.nodes & 65535 || !timeOut())

  const searchInfo = {}
  const timeOut = () => Date.now() >= searchInfo.stopAt

  const findBestMove = (opts) => {
    const t = timer()
    opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
    searchInfo.nodes = 0
    searchInfo.stopAt = Date.now() + opts.maxThinkingTime
    const columns = [3, 4, 2, 5, 1, 6, 0].filter((c) => state.heightCols[c] < ROWS)

    for (const c of columns) if (checkWinningCol(c)) return { bestMoves: [{ move: c, score: 22 - ((state.cntMoves + 2) >> 1) }], elapsedTime: t.elapsedTime() }

    for (let depth = 1; depth <= opts.maxDepth; depth++) {
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
      // console.log(`DEPTH:${searchInfo.depth} { ${movesStr(searchInfo.bestMoves)}} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms ${TT.info()}`)
      if (score > 0 || timeOut()) break
      const loosingMoves = searchInfo.bestMoves.filter(loosingMove)
      if (loosingMoves.length >= searchInfo.bestMoves.length - 1) break // all moves but one lead to disaster
    }
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

  const isMill = () => checkWinningBoard()

  const movesStr = (bm) => bm.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')

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
    isMill,
    isAllowedMove: (c) => state.heightCols[c] < ROWS && !isMill() && state.cntMoves !== ROWS * COLS,
    getHeightOfCol: (c) => state.heightCols[c],
    currentPlayer: () => state.currentPlayer,
    movesStr,
    isDraw: () => state.cntMoves === ROWS * COLS && !isMill()
  }
})()

if (typeof module !== 'undefined') module.exports = cfEngine
