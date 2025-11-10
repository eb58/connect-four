const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const [COLS, ROWS] = [7, 6]
const BOARD_SIZE = COLS * ROWS
const MAXVAL = 100
const Player = { ai: 0, hp: 1 } // AI / human player
const TT_FLAGS = { exact: 1, lower_bound: 2, upper_bound: 3 }

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
  store(hash, score, depth, flag) {
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
      if (flag === TT_FLAGS.exact) return score
      if (flag === TT_FLAGS.lower_bound && score >= beta) return score
      if (flag === TT_FLAGS.upper_bound && score <= alpha) return score
    }
    return null
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
const pieceKeys = [
  227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957,
  1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671,
  901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931,
  311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967,
  398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066,
  1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180
]

const printBoard = (b) => {
  const has = (bb, idx) => (idx < 32 ? bb[0] & (1 << idx) : bb[1] & (1 << (idx - 32)))

  let res = ''
  for (let r = ROWS - 1; r >= 0; r--) {
    let row = ''
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c
      if (has(b.bitboards[0], idx)) row += ' X '
      else if (has(b.bitboards[1], idx)) row += ' O '
      else row += ' _ '
    }
    res += row + '\n'
  }
  console.log(res)
}

class Board {
  init(player = Player.ai) {
    this.heightCols = new Uint32Array(COLS)
    this.currentPlayer = player
    this.cntMoves = 0
    this.bitboards = [new Uint32Array(2), new Uint32Array(2)]
    this.hash = 0
  }

  constructor() {
    this.init()
  }

  doMove = (c) => {
    const idx = c + COLS * this.heightCols[c]
    this.hash ^= pieceKeys[this.currentPlayer ? idx : idx + 42]
    this.bitboards[this.currentPlayer][idx < 32 ? 0 : 1] |= 1 << (idx < 32 ? idx : idx - 32)
    this.heightCols[c]++
    this.currentPlayer = 1 - this.currentPlayer
    this.cntMoves++
  }

  undoMove = (c) => {
    this.cntMoves--
    this.currentPlayer = 1 - this.currentPlayer
    --this.heightCols[c]
    const idx = c + COLS * this.heightCols[c]
    this.bitboards[this.currentPlayer][idx < 32 ? 0 : 1] &= ~(1 << (idx < 32 ? idx : idx - 32))
    this.hash ^= pieceKeys[this.currentPlayer ? idx : idx + 42]
  }

  checkWinForColumn = (c) => this.checkWinning(c, this.heightCols[c], this.currentPlayer)

  checkWinning = (col, row, player) => {
    const bb = this.bitboards[player]
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
}
let board = new Board()
const searchInfo = { nodes: 0 }
const timeOut = () => Date.now() >= searchInfo.stopAt

const negamax = (columns, depth, alpha, beta) => {
  searchInfo.nodes++
  const originalAlpha = alpha

  const cached = tt.getScore(board.hash, depth, alpha, beta)
  if (cached !== null) return { score: cached }

  if (board.cntMoves >= BOARD_SIZE || depth === 0) return { score: 0 }

  let bestScore = -MAXVAL
  let bestMove = null
  let flag = TT_FLAGS.exact

  for (const col of columns)
    if (board.heightCols[col] < ROWS && board.checkWinForColumn(col)) {
      tt.store(board.hash, MAXVAL, depth, flag)
      return { score: MAXVAL, move: col }
    }

  for (const col of columns)
    if (board.heightCols[col] < ROWS) {
      board.doMove(col)
      const child = negamax(columns, depth - 1, -beta, -alpha)
      board.undoMove(col)

      const score = -child.score

      if (score >= beta) {
        bestScore = score
        bestMove = col
        flag = TT_FLAGS.lower_bound
        break
      }
      if (score > bestScore) {
        bestScore = score
        bestMove = col
      }
      if (score > alpha) alpha = score
    }

  if (bestScore <= originalAlpha) flag = TT_FLAGS.upper_bound
  else if (bestScore >= beta) flag = TT_FLAGS.lower_bound

  tt.store(board.hash, bestScore, depth, flag)

  return { score: bestScore, move: bestMove }
}

const findBestMove = (opts) => {
  const t = timer()
  opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
  searchInfo.nodes = 0
  searchInfo.stopAt = Date.now() + opts.maxThinkingTime
  let res, depth
  const columns = [3, 2, 4, 1, 5, 0, 6].filter((c) => board.heightCols[c] < ROWS)
  for (depth = 1; depth <= opts.maxDepth; depth++) {
    tt = new TranspositionTable(getTTSizeForDepth(depth))
    res = negamax(columns, depth, -MAXVAL, MAXVAL)
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
  moves.forEach((c) => board.doMove(c))
  return board
}

if (typeof module !== 'undefined') module.exports = { findBestMove, initGame }
