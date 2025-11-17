import { ROWS } from './cf-board.js'
import { TT_FLAGS, TranspositionTable } from './cf-transpositionTable.js'

const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const MAXVAL = 100

class CfEngine {
  constructor(board, searchInfo, tt) {
    this.tt = tt
    this.board = board
    this.searchInfo = searchInfo
  }

  negamax = (columns, depth, alpha, beta) => {
    // console.log(columns, depth, alpha, beta); this.board.print()
    ++this.searchInfo.nodes
    if (depth === 0 || this.board.cntMoves === 42) return 0

    let cachedScore = this.tt.getScore(this.board.hash, depth, alpha, beta)
    if (cachedScore !== null) return cachedScore

    for (const c of columns)
      if (this.board.checkWinForColumn(c)) {
        this.searchInfo.bestMove = c
        return this.tt.store(this.board.hash, depth, MAXVAL, TT_FLAGS.exact)
      }

    for (const c of columns)
      if (this.board.heightCols[c] < ROWS) {
        this.board.doMove(c)
        const score = -this.negamax(columns, depth - 1, -beta, -alpha)
        this.board.undoMove(c)
        if (score > alpha) {
          alpha = score
          this.searchInfo.bestMove = c
        }
        if (alpha >= beta) return this.tt.store(this.board.hash, depth, alpha, TT_FLAGS.lower_bound)
      }
    return this.tt.store(this.board.hash, depth, alpha, TT_FLAGS.upper_bound)
  }
}

export const findBestMove = (board, opts) => {
  const t = timer()
  opts = { maxThinkingTime: 1000, minDepth: 1, maxDepth: 42 - board.cntMoves, ...opts }
  const searchInfo = { nodes: 0, stopAt: Date.now() + opts.maxThinkingTime }
  const timeOut = () => Date.now() >= searchInfo.stopAt

  const columns = [3, 2, 4, 1, 5, 0, 6].filter((c) => board.heightCols[c] < ROWS)

  for (let depth = opts.minDepth; depth <= opts.maxDepth; depth++) {
    const cf = new CfEngine(board, searchInfo, new TranspositionTable(depth))
    searchInfo.depth = depth
    searchInfo.score = cf.negamax(columns, depth, -MAXVAL, MAXVAL)
    console.log(`DEPTH:${depth} SCORE:${searchInfo.score} MOVE:${searchInfo.bestMove} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
    if (searchInfo.score || timeOut()) break
  }

  console.log(`DEPTH:${searchInfo.depth} SCORE:${searchInfo.score} MOVE:${searchInfo.bestMove} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
  return { ...searchInfo, elapsedTime: t.elapsedTime() }
}
