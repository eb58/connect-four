const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })

const cfEngine = (() => {
  const range = (n) => [...Array(n).keys()]
  const loosingMove = (m) => m.score < 0

  const [NCOL, NROW] = [7, 6]
  const MAXVAL = 100
  const Player = { ai: -1, hp: +1 } // AI / human player

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  const cache = (insertCondition = (_) => true, c = {}, fromCache = 0) => ({
    add: (key, val) => {
      if (insertCondition(val)) c[key] = val
      return val
    },
    get: (key) => {
      if (c[key] !== undefined) fromCache++
      return c[key]
    },
    clear: () => ((c = {}), (fromCache = 0)),
    info: (s = '') => `${s}CACHE:{ size:${Object.keys(c).length},  hits:${fromCache} }` // ${JSON.stringify(c)}`
  })
  const CACHE = cache((x) => x > 0)
  const memoize =
    (f, hash, c = CACHE) =>
    (...args) => {
      const h = hash(...args)
      const val = c.get(h)
      return val !== undefined ? val : c.add(h, f(...args))
    }
  const decorator =
    (f, preCondition) =>
    (...args) =>
      preCondition() ? f(...args) : 0

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  const computeWinningRows = (p, dr, dc) => {
    // dr = delta row,  dc = delta col
    let {r,c} = p;
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
  const winningRows = range(NROW)
    .reduce((acc, r) => [...acc, ...range(NCOL).map((c) => ({ r, c }))], [])
    .reduce((acc, p) => [...acc, ...computeWinningRows(p, 0, 1), ...computeWinningRows(p, 1, 1), ...computeWinningRows(p, 1, 0), ...computeWinningRows(p, -1, 1)], [])

  const code = (xs) => xs.reduce((acc, n) => acc + Math.pow(2, n), 0)

  const decode = (x) => {
    const y = Number(x)
      .toString(2)
      .split('')
      .map((x) => Number(x))
      .toReversed()
    return y.reduce((acc, x, idx) => (x ? [...acc, idx] : acc), [])
  }

  const winningRowsX = winningRows.map((x) => code(x.row))

  // list of indices on allWinningRows for each field of board
  const winningRowsForFields = range(NCOL * NROW).map((i) => winningRows.reduce((acc, wr, j) => (wr.row.includes(i) ? [...acc, j] : acc), []))

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  /*
  const rand8 = () => Math.floor((Math.random() * 255) + 1)
  const rand32 = () => rand8() << 23 | rand8() << 16 | rand8() << 8 | rand8();
  const sideKeys = [rand32(), rand32()]
  const pieceKeys = range(84).map(() => rand32())
  */
  const sideKeys = [127938607, 1048855538]
  const pieceKeys = [
    227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957,
    1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671,
    901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931,
    311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967,
    398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066,
    1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180
  ]

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  const hash = (idxBoard) => {
    const idx = state.side === Player.ai ? 1 : 2
    state.hash ^= pieceKeys[idxBoard * idx] ^ sideKeys[idx]
  }

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
    hash(idxBoard)
  }

  const undoMove = (c) => {
    --state.heightCols[c]
    const idxBoard = c + NCOL * state.heightCols[c]
    const counters = state.side === Player.ai ? state.wrCounterAI : state.wrCounterHumanPlayer
    winningRowsForFields[idxBoard].forEach((i) => counters[i]--)
    hash(idxBoard)
    state.side = -state.side
    state.isMill = false
    state.cntMoves--
  }

  const computeScoreOfNode = (s) =>
    s.side * winningRows.reduce((res, wr, i) => res + (s.wrCounterAI[i] > 0 && s.wrCounterHumanPlayer[i] > 0 ? 0 : s.wrCounterHumanPlayer[i] - s.wrCounterAI[i]), 0)

  const isWinningColumn = (c) => {
    const counters = state.side === Player.hp ? state.wrCounterAI : state.wrCounterHumanPlayer
    return winningRowsForFields[c + NCOL * state.heightCols[c]].some((i) => counters[i] === 3)
  }

  let negamax = (columns, depth, maxDepth, alpha, beta) => {
    if (depth === maxDepth || state.cntMoves === 42) return 0

    for (const c of columns) if (state.heightCols[c] < NROW && isWinningColumn(c)) return MAXVAL - depth - 1

    for (const c of columns)
      if (state.heightCols[c] < NROW) {
        doMove(c)
        const score = -negamax(columns, depth + 1, maxDepth, -beta, -alpha)
        undoMove(c)
        if (score > alpha) alpha = score
        if (alpha >= beta) return alpha
      }
    return alpha
  }
  negamax = memoize(negamax, () => state.hash)
  negamax = decorator(negamax, () => ++searchInfo.nodes & 65535 || !timeOut())

  const searchInfo = {}
  const timeOut = () => Date.now() >= searchInfo.stopAt

  const searchBestMove = (opts) => {
    CACHE.clear()
    const t = timer()
    opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
    searchInfo.nodes = 0
    searchInfo.stopAt = Date.now() + opts.maxThinkingTime
    const columns = [3, 4, 2, 5, 1, 6, 0].filter((c) => state.heightCols[c] < NROW)

    for (const c of columns) if (isWinningColumn(c)) return { nodes: 0, depth: 1, bestMoves: [{ move: c + 1, score: 1 }], elapsedTime: t.elapsedTime() }

    for (let depth = 1; depth <= opts.maxDepth; depth++) {
      searchInfo.depth = depth
      searchInfo.bestMoves = []
      let score = 0
      for (const c of columns) {
        doMove(c)
        score = -negamax(columns, 0, depth, -MAXVAL, +MAXVAL)
        searchInfo.bestMoves.push({ move: c + 1, score })
        undoMove(c)
        if (score > 0 || timeOut()) break
      }
      searchInfo.bestMoves.sort((a, b) => b.score - a.score)
      // console.log(`DEPTH:${searchInfo.depth} { ${movesStr(searchInfo.bestMoves)}} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms ${CACHE.info()}`)
      if (score > 0 || timeOut()) break
      const loosingMoves = searchInfo.bestMoves.filter(loosingMove)
      if (loosingMoves.length >= searchInfo.bestMoves.length - 1) break // all moves but one lead to disaster
    }
    return { ...searchInfo, elapsedTime: t.elapsedTime(), CACHE }
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

  const movesStr = (bm) => bm.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')

  init()
  return {
    winningRows,
    winningRowsForFields,
    code,
    decode,
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
    movesStr,
    isDraw: () => state.cntMoves === NROW * NCOL && !isMill()
  }
})()

if (typeof module !== 'undefined') module.exports = cfEngine
