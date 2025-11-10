const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const [COLS, ROWS] = [7, 6]
const BOARD_SIZE = COLS * ROWS
const MAXVAL = 100
const Player = { ai: 0, hp: 1 } // AI / human player
const TT_FLAGS = { exact: 1, lower_bound: 2, upper_bound: 3 }

const TT = (() => {
  const table = new Map()
  let hits = 0,
    misses = 0
  return {
    store: (hash, depth, score, flag) => (table.set(hash, { depth, score, flag }), score),
    probe: (hash, depth, alpha, beta) => {
      if (table.size > 10000000) table.clear()
      const entry = table.get(hash)
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
    clear: () => (table.clear(), (hits = misses = 0)),
    info: () => `TT size:${table.size} hits:${hits} misses:${misses}`
  }
})()

////////////////////////////////////////////////////////////////////////////////////////////////////////

const pieceKeys = [
  227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957,
  1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671,
  901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931,
  311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967,
  398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066,
  1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180
]

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
    TT.clear()
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

    const ttScore = TT.probe(state.hash, depth, alpha, beta)
    if (ttScore !== null) return ttScore

    for (const c of columns) if (state.heightCols[c] < ROWS && checkWinningCol(c)) return MAXVAL

    const alphaOrig = alpha
    for (const c of columns)
      if (state.heightCols[c] < ROWS) {
        doMove(c)
        const score = -negamax(columns, depth - 1, -beta, -alpha)
        undoMove(c)
        if (score >= beta) return score // TT.store(state.hash, depth, score, TT_FLAGS.lower_bound) //  faster without this!!!!!!!
        if (score > alpha) alpha = score
      }
    return TT.store(state.hash, depth, alpha, alpha <= alphaOrig ? TT_FLAGS.upper_bound : TT_FLAGS.exact)
  }


  const findBestMove = (opts) => {
    TT.clear()
    const t = timer()
    opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
    searchInfo.nodes = 0
    searchInfo.stopAt = Date.now() + opts.maxThinkingTime
    const columns = [3, 4, 2, 5, 1, 6, 0].filter((c) => state.heightCols[c] < ROWS)

    for (const c of columns) if (checkWinningCol(c)) return { ...searchInfo, bestMoves: [{ move: c, score: MAXVAL }], elapsedTime: t.elapsedTime(), TT }

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
      // console.log(infoStr({ ...searchInfo, elapsedTime: t.elapsedTime(), TT }))
      if (score > 0 || timeOut()) break
      const loosingMoves = searchInfo.bestMoves.filter(loosingMove)
      if (loosingMoves.length >= searchInfo.bestMoves.length - 1) break // all moves but one lead to disaster
    }
    return { ...searchInfo, elapsedTime: t.elapsedTime(), TT }
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
