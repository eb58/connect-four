const { TT_FLAGS, TranspositionTable } = require('./cf-transpositionTable')
const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })

const MAXVAL = 100

class CfEngine {
  constructor(board, searchInfo, tt) {
    this.tt = tt
    this.board = board
    this.searchInfo = searchInfo
  }

  negamax = (columns, depth, alpha, beta) => {
    ++this.searchInfo.nodes
    if (depth === 0 || this.board.cntMoves >= 42) return { score: 0 }

    let score = this.tt.getScore(this.board.hash, depth, alpha, beta)
    if (score !== null) return { score }

    for (const col of columns)
      if (this.board.heightCols[col] < ROWS && this.board.checkWinForColumn(col)) {
        this.tt.store(this.board.hash, depth, MAXVAL, TT_FLAGS.exact)
        return { score: MAXVAL, move: col }
      }

    score = alpha
    let move = null

    const alphaOrig = alpha
    for (const c of columns)
      if (this.board.heightCols[c] < ROWS) {
        this.board.doMove(c)
        const child = this.negamax(columns, depth - 1, -beta, -alpha)
        this.board.undoMove(c)

        if (-child.score > score) {
          score = -child.score
          move = c
          if (score >= beta) {
            this.tt.store(this.board.hash, depth, score, TT_FLAGS.lower_bound)
            return { score, move }
          }
        }
        if (-child.score > alpha) alpha = -child.score
      }

    let flag
    if (score <= alphaOrig) flag = TT_FLAGS.upper_bound
    if (score >= beta) flag = TT_FLAGS.lower_bound

    this.tt.store(this.board.hash, depth, score, flag)
    return { score, move }
  }
}

findBestMove = (board, opts) => {
  const t = timer()
  opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
  const searchInfo = { nodes: 0, stopAt: Date.now() + opts.maxThinkingTime }
  const timeOut = () => Date.now() >= searchInfo.stopAt
  let res = { score: -MAXVAL },
    depth
  const columns = [3, 2, 4, 1, 5, 0, 6].filter((c) => board.heightCols[c] < ROWS)
  for (depth = 1; depth <= opts.maxDepth; depth++) {
    const cf = new CfEngine(board, searchInfo, new TranspositionTable(depth))
    res = cf.negamax(columns, depth, res.score, MAXVAL)
    console.log(`DEPTH:${depth} SCORE:${res.score} MOVE:${res.move} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
    if (res.score || timeOut()) break
  }
  // console.log(`DEPTH:${depth} SCORE:${res.score} MOVE:${res.move} NODES:${searchInfo.nodes} ${t.elapsedTime()}ms`)
  searchInfo.bestMoves = [{ move: res.move, score: res.score }]
  searchInfo.bestScore = res.score
  searchInfo.bestMove = res.move

  return { ...res, ...searchInfo, depth, elapsedTime: t.elapsedTime() }
}

if (typeof module !== 'undefined') module.exports = findBestMove
