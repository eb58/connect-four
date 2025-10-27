const range = (n) => [...Array(n).keys()]

const [NCOL, NROW] = [7, 6]

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
const zobrist = range(NROW * NCOL).map(() => [rand(), rand()])

class TranspositionTable {
  constructor(size = 1 << 28) {
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
    this.moveHistory = new Uint8Array(NCOL * NROW)
    this.colHeights = new Uint8Array(NCOL)
    this.lastMove = null
    this.moveCount = 0
    this.hash = 0

    // Per-column bit masks for incremental symmetry
    this.cols = [
      new Uint8Array(NCOL), // unused to make indexing easier and faster
      new Uint8Array(NCOL), // player 1
      new Uint8Array(NCOL) // player 2
    ]
  }

  makeMove(col) {
    const row = this.colHeights[col]
    const index = row * NCOL + col

    this.cols[this.currentPlayer][col] |= 1 << row
    this.bitboards[this.currentPlayer][index < 32 ? 0 : 1] |= 1 << index % 32

    this.lastMove = col
    this.colHeights[col]++

    this.moveHistory[this.moveCount] = col
    this.moveCount++

    this.hash ^= zobrist[index][this.currentPlayer - 1]

    this.currentPlayer = 3 - this.currentPlayer
  }

  unmakeMove() {
    const col = this.moveHistory[this.moveCount - 1]
    const row = this.colHeights[col] - 1
    const index = row * NCOL + col
    const player = 3 - this.currentPlayer

    // Clear column mask
    this.cols[player][col] &= ~(1 << row)

    // Clear bitboards
    this.bitboards[player][index < 32 ? 0 : 1] &= ~(1 << index % 32)

    // Undo heights/history
    this.colHeights[col]--
    this.lastMove = this.moveHistory[this.moveCount - 1] ?? null

    this.moveHistory[this.moveCount - 1] = 0
    this.moveCount--

    this.hash ^= zobrist[index][player - 1]

    this.currentPlayer = player
  }

  checkWin() {
    const player = 3 - this.currentPlayer
    const col = this.lastMove
    const row = this.colHeights[col] - 1

    const bbLo = this.bitboards[player][0]
    const bbHi = this.bitboards[player][1]

    const rowCols = row * NCOL

    // Horizontal
    let count = 1
    for (let c = col + 1; c < NCOL && c <= col + 3; c++) {
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
    for (let r = row + 1; r < NROW && r <= row + 3; r++) {
      const idx = r * NCOL + col
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1; r >= 0 && r >= row - 3; r--) {
      const idx = r * NCOL + col
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    // Diagonal \
    count = 1
    for (let r = row + 1, c = col + 1; r < NROW && c < NCOL && r <= row + 3 && c <= col + 3; r++, c++) {
      const idx = r * NCOL + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && r >= row - 3 && c >= col - 3; r--, c--) {
      const idx = r * NCOL + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    // Diagonal /
    count = 1
    for (let r = row + 1, c = col - 1; r < NROW && c >= 0 && r <= row + 3 && c >= col - 3; r++, c--) {
      const idx = r * NCOL + c
      if (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1, c = col + 1; r >= 0 && c < NCOL && r >= row - 3 && c <= col + 3; r--, c++) {
      const idx = r * NCOL + c
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
    const idxThisMove = row * NCOL + col
    const rowCols = row * NCOL

    // Horizontal
    let count = 1
    for (let c = col + 1; c < NCOL && c <= col + 3; c++) {
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
    for (let r = row + 1; r < NROW && r <= row + 3; r++) {
      const idx = r * NCOL + col
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1; r >= 0 && r >= row - 3; r--) {
      const idx = r * NCOL + col
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    // Diagonals (same pattern as checkWin)
    count = 1
    for (let r = row + 1, c = col + 1; r < NROW && c < NCOL && r <= row + 3 && c <= col + 3; r++, c++) {
      const idx = r * NCOL + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && r >= row - 3 && c >= col - 3; r--, c--) {
      const idx = r * NCOL + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    if (count >= 4) return true

    count = 1
    for (let r = row + 1, c = col - 1; r < NROW && c >= 0 && r <= row + 3 && c >= col - 3; r++, c--) {
      const idx = r * NCOL + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        if (++count >= 4) return true
      } else break
    }
    for (let r = row - 1, c = col + 1; r >= 0 && c < NCOL && r >= row - 3 && c <= col + 3; r--, c++) {
      const idx = r * NCOL + c
      if (idx === idxThisMove || (idx < 32 ? (bbLo & (1 << idx)) !== 0 : (bbHi & (1 << (idx - 32))) !== 0)) {
        count++
        if (count >= 4) return true
      } else break
    }

    return false
  }
}

let tt
const boardSize = NCOL * NROW

let nodes = 0
const negamax = (board, depth, alpha, beta) => {
  nodes++
  const originalAlpha = alpha

  // Check for cached result
  const cached = tt.getScore(board.hash, depth, alpha, beta)
  if (cached) return { score: cached }

  if (board.checkWin()) return { score: ((board.moveCount + 1) >> 1) - 22 }
  if (board.moveCount >= boardSize || depth === 0) return { score: 0 }

  let bestScore = -100
  let bestMove = null
  let flag = 1
  const colHeights = board.colHeights

  for (const col of [3, 2, 4, 1, 5, 0, 6]) if (colHeights[col] < NROW && board.winForColumn(col)) return { score: 22 - ((board.moveCount + 2) >> 1), move: col }

  for (const col of [3, 2, 4, 1, 5, 0, 6])
    if (colHeights[col] < NROW) {
      board.makeMove(col)
      const child = negamax(board, depth - 1, -beta, -alpha)
      board.unmakeMove()

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

  return { score: bestScore, nodes, move: bestMove }
}

const findBestMove = (board, depth) => {
  tt = new TranspositionTable()
  const result = negamax(board, depth, -100, 100)
  return { move: result.move, score: result.score, nodes }
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
