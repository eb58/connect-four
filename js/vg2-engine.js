const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const range = (n) => [...Array(n).keys()]
const [COLS, ROWS] = [7, 6]
const BOARD_SIZE = COLS * ROWS

// Create a simple PRNG for Zobrist hashing to always get the same result when running tests
const makePRNG = (seed) => {
  let state = seed >>> 0
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return state >>> 0
  }
}

const rand = makePRNG(123456789)
const zobrist = range(BOARD_SIZE).map(() => [0, rand(), rand()])

function getTTSizeForDepth(depth) {
  if (depth >= 38) return 1 << 28
  if (depth >= 36) return 1 << 26
  if (depth >= 18) return 1 << 23
  if (depth >= 10) return 1 << 18
  return 1 << 16
}

class TranspositionTable {
  constructor(size = 1 << 22) {
    this.size = size
    this.keys = new Uint32Array(size)
    this.scores = new Int16Array(size)
    this.depths = new Int8Array(size)
    this.flags = new Uint8Array(size)
  }
  put(hash, score, depth, flag) {
    const idx = hash & (this.size - 1)
    this.keys[idx] = hash
    this.scores[idx] = score
    this.depths[idx] = depth
    this.flags[idx] = flag
  }
  getScore(hash, depth, alpha, beta) {
    const idx = hash & (this.size - 1)
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
    this.bitboards = { 1: [0, 0], 2: [0, 0] } // 64-bit integers simulated with two 32-bit ints, bottom and top bits
    this.currentPlayer = 1
    this.moveHistory = new Uint8Array(COLS * ROWS)
    this.colHeights = new Uint8Array(COLS)
    this.lastMove = null
    this.moveCount = 0

    // Zobrist (32-bit per entry), incremental mirrored hash kept too
    this.zobristHash = 0

    // Per-column bit masks for incremental symmetry
    this.cols = [
      0, // unused to make indexing easier and faster
      new Uint8Array(COLS), // player 1
      new Uint8Array(COLS) // player 2
    ]
  }

  makeMove(col) {
    const row = this.colHeights[col]
    const index = row * COLS + col
    const player = this.currentPlayer

    // Update column mask
    this.cols[player][col] |= 1 << row

    // Bitboards
    this.bitboards[player][index < 32 ? 0 : 1] |= 1 << index % 32

    // History & heights
    this.lastMove = col
    this.moveHistory[this.moveCount] = col
    this.colHeights[col]++
    this.moveCount++

    // Zobrist
    this.zobristHash ^= zobrist[index][player]

    // Switch player
    this.currentPlayer = 3 - player
  }

  undoMove() {
    const col = this.moveHistory[this.moveCount - 1]
    const row = this.colHeights[col] - 1
    const index = row * COLS + col
    const player = 3 - this.currentPlayer

    // Clear column mask
    this.cols[player][col] &= ~(1 << row)

    // Clear bitboards
    this.bitboards[player][index < 32 ? 0 : 1] &= ~(1 << index % 32)

    // Undo history/heights
    this.colHeights[col]--
    this.moveHistory[this.moveCount - 1] = 0
    this.moveCount--
    this.lastMove = this.moveHistory[this.moveCount - 1] ?? null

    // Zobrist
    this.zobristHash ^= zobrist[index][player]

    this.currentPlayer = player
  }

  checkWin() {
    // Check using lastMove only
    const player = 3 - this.currentPlayer
    const col = this.lastMove
    const row = this.colHeights[col] - 1

    const bbLo = this.bitboards[player][0]
    const bbHi = this.bitboards[player][1]

    const rowCols = row * COLS

    // Horizontal
    let count = 1
    for (let c = col + 1; c < COLS && c <= col + 3; c++) {
      const idx = rowCols + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    for (let c = col - 1; c >= 0 && c >= col - 3; c--) {
      const idx = rowCols + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    // Vertical
    count = 1
    for (let r = row + 1; r < ROWS && r <= row + 3; r++) {
      const idx = r * COLS + col
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1; r >= 0 && r >= row - 3; r--) {
      const idx = r * COLS + col
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    // Diagonal \
    count = 1
    for (let r = row + 1, c = col + 1; r < ROWS && c < COLS && r <= row + 3 && c <= col + 3; r++, c++) {
      const idx = r * COLS + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && r >= row - 3 && c >= col - 3; r--, c--) {
      const idx = r * COLS + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    // Diagonal /
    count = 1
    for (let r = row + 1, c = col - 1; r < ROWS && c >= 0 && r <= row + 3 && c >= col - 3; r++, c--) {
      const idx = r * COLS + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1, c = col + 1; r >= 0 && c < COLS && r >= row - 3 && c <= col + 3; r--, c++) {
      const idx = r * COLS + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        count++
        if (count >= 4) return true
      } else break
    }

    return false
  }

  winForColumn(col) {
    const player = this.currentPlayer
    const row = this.colHeights[col]

    const bbLo = this.bitboards[player][0]
    const bbHi = this.bitboards[player][1]
    const idxThisMove = row * COLS + col
    const rowCols = row * COLS

    // Horizontal
    let count = 1
    for (let c = col + 1; c < COLS && c <= col + 3; c++) {
      const idx = rowCols + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    for (let c = col - 1; c >= 0 && c >= col - 3; c--) {
      const idx = rowCols + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    // Vertical
    count = 1
    for (let r = row + 1; r < ROWS && r <= row + 3; r++) {
      const idx = r * COLS + col
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1; r >= 0 && r >= row - 3; r--) {
      const idx = r * COLS + col
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    // Diagonals (same pattern as checkWin)
    count = 1
    for (let r = row + 1, c = col + 1; r < ROWS && c < COLS && r <= row + 3 && c <= col + 3; r++, c++) {
      const idx = r * COLS + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && r >= row - 3 && c >= col - 3; r--, c--) {
      const idx = r * COLS + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    count = 1
    for (let r = row + 1, c = col - 1; r < ROWS && c >= 0 && r <= row + 3 && c >= col - 3; r++, c--) {
      const idx = r * COLS + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1, c = col + 1; r >= 0 && c < COLS && r >= row - 3 && c <= col + 3; r--, c++) {
      const idx = r * COLS + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        count++
        if (count >= 4) return true
      } else break
    }

    return false
  }
}

let tt

// Variable size of TT depending on depth

let nodes = 0
const negamax = (board, depth, alpha, beta) => {
  nodes++
  const originalAlpha = alpha
  const moveCount = board.moveCount

  // Check for symmetry and get appropriate hash
  const hash = board.zobristHash

  // Check for cached result
  const cached = tt.getScore(hash, depth, alpha, beta)
  if (cached !== null) return { score: cached, move: null }

  if (board.checkWin()) return { score: ((moveCount + 1) >> 1) - 22, move: null }
  if (moveCount >= BOARD_SIZE || depth === 0) return { score: 0, move: null }

  let bestScore = -100
  let bestMove = null
  let flag = 1
  const colHeights = board.colHeights

  // Immediate win: use symmetric ordering if mirror
  const colOrder = [3, 2, 4, 1, 5, 0, 6]
  for (const col of colOrder)
    if (colHeights[col] < ROWS && board.winForColumn(col)) {
      tt.put(hash, 22 - ((moveCount + 2) >> 1), depth, flag)
      return { score: 22 - ((moveCount + 2) >> 1), move: col }
    }

  // Recursive search
  for (const col of colOrder)
    if (colHeights[col] < ROWS) {
      board.makeMove(col)
      const child = negamax(board, depth - 1, -beta, -alpha)
      board.undoMove()

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

  tt.put(hash, bestScore, depth, flag)

  return { score: bestScore, move: bestMove }
}

const findBestMove = (board, depth = 14) => {
  nodes = 0
  tt = new TranspositionTable(getTTSizeForDepth(depth))
  const t = timer()
  let res
  for (let d = 1; d <= depth; d++) {
    res = negamax(board, d, -100, 100)
    if (res.score !== 0) return { ...res, depth: d, elapsedTime: t.elapsedTime() }
  }
  return { ...res, depth, elapsedTime: t.elapsedTime() }
}

const initGame = (fen) => {
  const board = new Board()
  const moves = fen
    .trim()
    .split('')
    .map((x) => x - 1)
  moves.forEach((c) => board.makeMove(c))
  return board
}

if (typeof module !== 'undefined')
  module.exports = {
    findBestMove,
    initGame
  }
