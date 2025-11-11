const { TT_FLAGS, getTTSizeForDepth, TranspositionTable, pieceKeys } = require('./cf-transpositionTable')

const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const [COLS, ROWS] = [7, 6]
const MAXVAL = 100
const Player = { ai: 0, hp: 1 } // AI / human player

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

  let bestScore = tt.getScore(board.hash, depth, alpha, beta)
  if (bestScore !== null) return { bestScore }

  if (board.cntMoves >= 42 || depth === 0) return { bestScore: 0 }

  for (const col of columns)
    if (board.heightCols[col] < ROWS && board.checkWinForColumn(col)) {
      tt.store(board.hash, depth, MAXVAL, TT_FLAGS.exact)
      return { bestScore: MAXVAL, bestMove: col }
    }

  let flag = TT_FLAGS.lower_bound
  bestScore = -MAXVAL
  let bestMove = null

  for (const col of columns)
    if (board.heightCols[col] < ROWS) {
      board.doMove(col)
      const child = negamax(columns, depth - 1, -beta, -alpha)
      board.undoMove(col)

      if (-child.bestScore >= beta) {
        bestScore = -child.bestScore
        bestMove = col
        flag = TT_FLAGS.lower_bound
        break
      }
      if (-child.bestScore > bestScore) {
        bestScore = -child.bestScore
        bestMove = col
      }
      if (-child.bestScore > alpha) alpha = -child.bestScore
    }

  if (bestScore <= originalAlpha) flag = TT_FLAGS.upper_bound
  else if (bestScore >= beta) flag = TT_FLAGS.lower_bound

  tt.store(board.hash, depth, bestScore, flag)
  return { bestScore, bestMove }
}

const findBestMove = (opts) => {
  const t = timer()
  opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
  searchInfo.stopAt = Date.now() + opts.maxThinkingTime
  let res, depth
  const columns = [3, 2, 4, 1, 5, 0, 6].filter((c) => board.heightCols[c] < ROWS)
  for (depth = 1; depth <= opts.maxDepth; depth++) {
    searchInfo.nodes = 0
    tt = new TranspositionTable(getTTSizeForDepth(depth))
    res = negamax(columns, depth, -MAXVAL, MAXVAL)
    console.log(`DEPTH:${depth} SCORE: ${res.bestScore} MOVE:${res.bestMove} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
    if (res.bestScore || timeOut()) break
  }
  // console.log(`DEPTH:${depth} SCORE: ${res.bestScore} MOVE:${res.bestMove} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
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
