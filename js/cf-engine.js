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
    if (depth === 0 || this.board.cntMoves === 42) return 0

    const score = this.tt.getScore(this.board.hash, depth, alpha, beta)
    if (score !== null) return score

    for (const c of columns) if (this.board.heightCols[c] < ROWS && this.board.checkWinForColumn(c)) return this.tt.store(this.board.hash, depth, MAXVAL, TT_FLAGS.exact)

    const alphaOrig = alpha
    for (const c of columns)
      if (this.board.heightCols[c] < ROWS) {
        this.board.doMove(c)
        const score = -this.negamax(columns, depth - 1, -beta, -alpha)
        this.board.undoMove(c)
        if (score >= beta) {
          this.tt.store(this.board.hash, depth, score, TT_FLAGS.lower_bound) //  faster without this ????
          return score
        }
        if (score > alpha) alpha = score
      }
    return this.tt.store(this.board.hash, depth, alpha, alpha <= alphaOrig ? TT_FLAGS.upper_bound : TT_FLAGS.exact)
  }
}

findBestMove = (board, opts) => {
  const t = timer()
  opts = { maxThinkingTime: 1000, maxDepth: 42, ...opts }
  const searchInfo = { nodes: 0, stopAt: Date.now() + opts.maxThinkingTime }
  const timeOut = () => Date.now() >= searchInfo.stopAt

  const columns = [3, 4, 2, 5, 1, 6, 0].filter((c) => board.heightCols[c] < ROWS)

  for (const c of columns)
    if (board.checkWinForColumn(c)) return { ...searchInfo, depth: 1, score: MAXVAL, move: c, bestMoves: [{ move: c, score: MAXVAL }], elapsedTime: t.elapsedTime() }

  for (let depth = 1; depth <= opts.maxDepth; depth++) {
    const cf = new CfEngine(board, searchInfo, new TranspositionTable(depth))

    searchInfo.depth = depth
    searchInfo.bestMoves = []
    let score = -MAXVAL

    for (const c of columns) {
      board.doMove(c)
      score = -cf.negamax(columns, depth, -MAXVAL, +MAXVAL)
      searchInfo.bestMoves.push({ move: c, score: score === -0 ? 0 : score })
      board.undoMove(c)
      if (score > 0 || timeOut()) break
    }

    searchInfo.bestMoves.sort((a, b) => b.score - a.score)
    console.log(infoStr({ ...searchInfo, elapsedTime: t.elapsedTime() }))
    if (score > 0 || timeOut()) break
    const loosingMoves = searchInfo.bestMoves.filter((m) => m.score < 0)
    if (loosingMoves.length === searchInfo.bestMoves.length) {
      // all moves lead to disaster
      searchInfo.score = -MAXVAL
      searchInfo.move = searchInfo.bestMoves[0].move
      return { ...searchInfo, elapsedTime: t.elapsedTime() }
    }

    if (loosingMoves.length >= searchInfo.bestMoves.length - 1) {
      // all moves but one lead to disaster
      const bm = searchInfo.bestMoves.filter((m) => m.score >= 0)[0]
      searchInfo.score = bm.score
      searchInfo.move = bm.move
      return { ...searchInfo, elapsedTime: t.elapsedTime() }
    }
  }
  searchInfo.score = searchInfo.bestMoves[0].score
  searchInfo.move = searchInfo.bestMoves[0].move
  return { ...searchInfo, elapsedTime: t.elapsedTime() }
}

const infoStr = (sc) => {
  const movesStr = sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')
  return `DEPTH:${sc.depth} { ${movesStr} } NODES:${sc.nodes} ${sc.elapsedTime}ms}`
}

if (typeof module !== 'undefined') module.exports = findBestMove
