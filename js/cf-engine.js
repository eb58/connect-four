const { TT_FLAGS, TranspositionTable } = require('./cf-transpositionTable')

const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const MAXVAL = 100

class CfEngine {
  constructor(board, searchInfo, tt) {
    this.tt = tt
    this.board = board
    this.searchInfo = searchInfo
    this.bestMove = null
  }

  negamax = (columns, depth, alpha, beta) => {
    ++this.searchInfo.nodes
    if (depth === 0 || this.board.cntMoves === 42) return 0

    let cachedScore = this.tt.getScore(this.board.hash, depth, alpha, beta)
    if (cachedScore !== null) return cachedScore

    for (const c of columns) if (this.board.heightCols[c] < ROWS && this.board.checkWinForColumn(c)) return this.tt.store(this.board.hash, depth, MAXVAL, TT_FLAGS.exact)

    let bestScore = alpha
    for (const c of columns)
      if (this.board.heightCols[c] < ROWS) {
        this.board.doMove(c)
        const score = -this.negamax(columns, depth - 1, -beta, -alpha)
        this.board.undoMove(c)
        if (score > bestScore) {
          bestScore = score
          this.bestMove = c
          if (score >= beta) return this.tt.store(this.board.hash, depth, score, TT_FLAGS.lower_bound)
        }
        if (score > alpha) alpha = score
      }
    return this.tt.store(this.board.hash, depth, bestScore, bestScore >= beta ? TT_FLAGS.lower_bound : TT_FLAGS.upper_bound)
  }
}

findBestMove = (board, opts) => {
  const t = timer()
  opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
  const searchInfo = { nodes: 0, stopAt: Date.now() + opts.maxThinkingTime }
  const timeOut = () => Date.now() >= searchInfo.stopAt

  const columns = [3, 2, 4, 1, 5, 0, 6].filter((c) => board.heightCols[c] < ROWS)

  for (const c of columns)
    if (board.checkWinForColumn(c)) return { ...searchInfo, depth: 1, score: MAXVAL, move: c, bestMoves: [{ move: c, score: MAXVAL }], elapsedTime: t.elapsedTime() }

  for (let depth = 1; depth <= opts.maxDepth; depth++) {
    const cf = new CfEngine(board, searchInfo, new TranspositionTable(depth))
    searchInfo.depth = depth
    searchInfo.score = cf.negamax(columns, depth, -MAXVAL, MAXVAL)
    console.log(`DEPTH:${depth} SCORE:${searchInfo.score} MOVE:${cf.bestMove} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
    if (searchInfo.score > 0 || timeOut()) {
      searchInfo.bestMove = cf.bestMove
      break
    }
  }
  console.log(`DEPTH:${searchInfo.depth} SCORE:${searchInfo.score} MOVE:${searchInfo.bestMove} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
  return { ...searchInfo, elapsedTime: t.elapsedTime() }
}

if (typeof module !== 'undefined') module.exports = findBestMove
