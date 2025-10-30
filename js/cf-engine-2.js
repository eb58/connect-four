const BitSet64 = require('./bitset64.js')
const { winningRowsBS, winningRowsForFields } = require('./cf-winning-rows')

const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const range = (n) => [...Array(n).keys()]
const [COLS, ROWS] = [7, 6]
const BOARD_SIZE = COLS * ROWS
const MAXVAL = 1000

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

const getTTSizeForDepth= (depth) => {
  if (depth >= 38) return (1 << 28) - 1
  if (depth >= 36) return (1 << 26) - 1
  if (depth >= 18) return (1 << 23) - 1
  if (depth >= 10) return (1 << 18) - 1
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
    this.bitboards = { 1: new BitSet64(), 2: new BitSet64() }
    this.currentPlayer = 1
    this.moveHistory = new Uint32Array(COLS * ROWS)
    this.colHeights = new Uint32Array(COLS)
    this.moveCount = 0
    this.hash = 0
  }

  printBoard = () => {
    let res = ''
    for (let r = ROWS - 1; r >= 0; r--) {
      let row = ''
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c
        if (this.bitboards[1].has(idx)) row += ' X '
        else if (this.bitboards[2].has(idx)) row += ' O '
        else row += ' _ '
      }
      res += row + '\n'
    }
    console.log(res)
  }

  makeMove(col) {
    const row = this.colHeights[col]
    const index = row * COLS + col

    // Bitboards
    this.bitboards[this.currentPlayer].set(index)

    // History & heights
    this.colHeights[col]++
    this.moveHistory[this.moveCount] = col
    this.moveCount++

    // Hash
    this.hash ^= zobrist[index][this.currentPlayer]

    // Switch player
    this.currentPlayer = 3 - this.currentPlayer
  }

  undoMove(col) {
    col = col || this.moveHistory[this.moveCount - 1]
    const row = this.colHeights[col] - 1
    const index = row * COLS + col

    // switch player
    this.currentPlayer = 3 - this.currentPlayer

    // hash
    this.hash ^= zobrist[index][this.currentPlayer]

    // undo history & heights
    this.colHeights[col]--
    this.moveCount--

    // clear bitboards
    this.bitboards[this.currentPlayer].clear(index)
  }

  checkWin = () => {
    const col = this.moveHistory[this.moveCount - 1]
    const idx = (this.colHeights[col] - 1) * COLS + col
    const bs = this.bitboards[3 - this.currentPlayer]
    const wrs = winningRowsForFields[idx]
    return wrs.some(wr => (winningRowsBS[wr].isSubsetOf(bs)))
  }

  winForColumn = (col) => {
    const bs = this.bitboards[this.currentPlayer]
    const idx = this.colHeights[col] * COLS + col
    const wrs = winningRowsForFields[idx]
    bs.set(idx)
    const ret = wrs.some(wr => (winningRowsBS[wr].isSubsetOf(bs)))
    bs.clear(idx)
    return ret
  }
}

let tt
let nodes = 0

const negamax = (columns, board, depth, alpha, beta) => {
  nodes++
  const originalAlpha = alpha

  // Check for cached result
  const cached = tt.getScore(board.hash, depth, alpha, beta)
  if (cached !== null) return { score: cached }

  if (board.checkWin()) return { score: ((board.moveCount + 1) >> 1) - 22 }
  if (board.moveCount >= BOARD_SIZE || depth === 0) return { score: 0 }

  let bestScore = -MAXVAL
  let bestMove = null
  let flag = 1
  const colHeights = board.colHeights

  for (const col of columns)
    if (colHeights[col] < ROWS && board.winForColumn(col)) {
      tt.put(board.hash, 22 - ((board.moveCount + 2) >> 1), depth, flag)
      return { score: 22 - ((board.moveCount + 2) >> 1), move: col }
    }

  for (const col of columns)
    if (colHeights[col] < ROWS) {
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

const findBestMove = (board, maxDepth = 14) => {
  const t = timer()
  nodes = 0
  let res, depth
  const columns = [3, 2, 4, 1, 5, 0, 6].filter((c) => board.colHeights[c] < ROWS)
  for (depth = 1; depth <= maxDepth; depth++) {
    tt = new TranspositionTable(getTTSizeForDepth(depth))
    res = negamax(columns, board, depth, -MAXVAL, MAXVAL)
    if (res.score) break
  }
  // console.log(`DEPTH:${depth} SCORE: ${res.score} MOVE:${res.move} NODES:${nodes} ${t.elapsedTime()}ms`)
  return { ...res, depth, nodes, elapsedTime: t.elapsedTime() }
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
