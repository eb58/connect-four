const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const range = (n) => [...Array(n).keys()]
const [COLS, ROWS] = [7, 6]
const BOARD_SIZE = COLS * ROWS
const MAXVAL = 1000

const pieceKeys = [
  227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957,
  1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671,
  901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931,
  311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967,
  398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066,
  1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180
]

const getTTSizeForDepth = (depth) => {
  if (depth >= 38) return (1 << 28) - 1
  if (depth >= 36) return (1 << 26) - 1
  if (depth >= 18) return (1 << 23) - 1
  return (1 << 16) - 1
}

class TranspositionTable {
  constructor(size = 8388593) {
    this.size = size
    this.keys = new Uint32Array(size)
    this.scores = new Int16Array(size)
    this.depths = new Int8Array(size)
    this.flags = new Uint8Array(size)
  }
  put(hash, score, depth, flag) {
    const idx = hash & this.size
    this.keys[idx] = hash
    this.scores[idx] = score
    this.depths[idx] = depth
    this.flags[idx] = flag
  }
  getScore(hash, depth, alpha, beta) {
    const idx = hash & this.size
    if (this.keys[idx] === hash && this.depths[idx] >= depth) {
      const score = this.scores[idx]
      const flag = this.flags[idx]
      if (flag === 1) return score
      if (flag === 2 && score >= beta) return score
      if (flag === 3 && score <= alpha) return score
    }
    return null
  }
}

class Board {
  constructor() {
    this.bitboards = [new Uint32Array(2), new Uint32Array(2)] // 64-bit integers simulated with two 32-bit ints, bottom and top bits
    this.currentPlayer = 1
    this.moveHistory = new Uint32Array(COLS * ROWS)
    this.colHeights = new Uint32Array(COLS)
    this.moveCount = 0
    this.hash = 0
  }

  makeMove(col) {
    const row = this.colHeights[col]
    const idx = row * COLS + col

    this.bitboards[this.currentPlayer][idx < 32 ? 0 : 1] |= 1 << idx % 32
    this.colHeights[col]++
    this.moveHistory[this.moveCount] = col
    this.moveCount++
    this.hash ^= pieceKeys[this.currentPlayer ? idx : idx + 42]
    this.currentPlayer = 1 - this.currentPlayer
  }

  undoMove(col) {
    col = col || this.moveHistory[this.moveCount - 1]
    const row = this.colHeights[col] - 1
    const idx = row * COLS + col
    this.currentPlayer = 1 - this.currentPlayer
    this.hash ^= pieceKeys[this.currentPlayer ? idx : idx + 42]
    this.colHeights[col]--
    this.moveCount--
    this.bitboards[this.currentPlayer][idx < 32 ? 0 : 1] &= ~(1 << idx % 32)
  }

  checkWinForBoard = () => {
    const col = this.moveHistory[this.moveCount - 1]
    const row = this.colHeights[col] - 1
    return this.checkWin(col, row, 1 - this.currentPlayer)
  }

  checkWinForColumn = (c) => this.checkWin(c, this.colHeights[c], this.currentPlayer)

  checkWin = (col, row, player) => {
    const bbLo = this.bitboards[player][0]
    const bbHi = this.bitboards[player][1]
    const has = (idx) => (idx < 32 ? bbLo & (1 << idx) : bbHi & (1 << (idx - 32)))

    // vertical
    for (let count = 1, r = row - 1; r >= 0 && has(r * COLS + col); r--) if (++count >= 4) return true

    // horizontal
    let count = 1
    for (let c = col + 1; c < COLS && has(row * COLS + c); c++) if (++count >= 4) return true
    for (let c = col - 1; c >= 0 && has(row * COLS + c); c--) if (++count >= 4) return true

    // diagonal \
    count = 1
    for (let r = row + 1, c = col + 1; c < COLS && r < ROWS && has(r * COLS + c); r++, c++) if (++count >= 4) return true
    for (let r = row - 1, c = col - 1; c >= 0 && r >= 0 && has(r * COLS + c); r--, c--) if (++count >= 4) return true

    // diagonal /
    count = 1
    for (let r = row + 1, c = col - 1; c >= 0 && r < ROWS && has(r * COLS + c); r++, c--) if (++count >= 4) return true
    for (let r = row - 1, c = col + 1; c < COLS && r >= 0 && has(r * COLS + c); r--, c++) if (++count >= 4) return true

    return false
  }
}

let tt
let board = new Board()

const searchInfo = { nodes: 0 }

const negamax = (columns, board, depth, alpha, beta) => {
  searchInfo.nodes++
  const originalAlpha = alpha

  // Check for cached result
  const cached = tt.getScore(board.hash, depth, alpha, beta)
  if (cached !== null) return { score: cached }

  if (board.checkWinForBoard()) return { score: ((board.moveCount + 1) >> 1) - 22 }
  if (board.moveCount >= BOARD_SIZE || depth === 0) return { score: 0 }

  let bestScore = -MAXVAL
  let bestMove = null
  let flag = 1

  for (const col of columns)
    if (board.colHeights[col] < ROWS && board.checkWinForColumn(col)) {
      tt.put(board.hash, 22 - ((board.moveCount + 2) >> 1), depth, flag)
      return { score: 22 - ((board.moveCount + 2) >> 1), move: col }
    }

  for (const col of columns)
    if (board.colHeights[col] < ROWS) {
      board.makeMove(col)
      const child = negamax(columns, board, depth - 1, -beta, -alpha)
      board.undoMove(col)

      const score = -child.score

      if (score >= beta) {
        bestScore = score
        bestMove = col
        flag = 2
        break
      }
      if (score > bestScore) {
        bestScore = score
        bestMove = col
      }
      if (score > alpha) alpha = score
    }

  if (bestScore <= originalAlpha) flag = 3
  else if (bestScore >= beta) flag = 2

  tt.put(board.hash, bestScore, depth, flag)

  return { score: bestScore, move: bestMove }
}

const timeOut = () => Date.now() >= searchInfo.stopAt

const findBestMove = (opts) => {
  opts = { maxDepth: 20, maxThinkingTime: 1000, ...opts }
  const t = timer()
  searchInfo.nodes = 0
  searchInfo.stopAt = Date.now() + opts.maxThinkingTime
  let res, depth
  const columns = [3, 2, 4, 1, 5, 0, 6].filter((c) => board.colHeights[c] < ROWS)
  for (depth = 1; depth <= opts.maxDepth; depth++) {
    tt = new TranspositionTable(getTTSizeForDepth(depth))
    res = negamax(columns, board, depth, -MAXVAL, MAXVAL)
    console.log(`DEPTH:${depth} SCORE: ${res.score} MOVE:${res.move} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
    if (res.score || timeOut()) break
  }
  console.log(`DEPTH:${depth} SCORE: ${res.score} MOVE:${res.move} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
  return { ...res, ...searchInfo, depth, elapsedTime: t.elapsedTime() }
}

const initGame = (fen) => {
  board = new Board()
  const moves = fen
    .trim()
    .split('')
    .map((x) => x - 1)
  moves.forEach((c) => board.makeMove(c))
  return board
}

if (typeof module !== 'undefined') module.exports = { findBestMove, initGame }
