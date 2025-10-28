// const { initGame, searchBestMove } = require('../js/vg-engine.js')
const { findBestMove, initGame } = require('../js/vg2-engine')

const h1 = (t) => {
  const si = searchBestMove(initGame(t.fen), t.depth || 12)
  // console.log(`DEPTH:${si.depth || 12} MOVE:${si.bestMoves[0].move} SCORE:${si.bestMoves[0].score} NODES:${si.nodes} FEN:${t.fen} ${si.elapsedTime}ms`)
  // if (t.depth) expect(si.depth).toBe(t.depth)
  if (si.bestMoves[0].move) {
    if (typeof t.bestMove === 'number') expect(si.bestMoves[0].move).toBe(t.bestMove)
    else expect(t.bestMove.includes(si.bestMoves[0].move)).toBeTruthy()
  }
  if (t.score) expect(si.bestMoves[0].score).toBe(t.score)
}

const h2 = (t) => {
  const si = findBestMove(initGame(t.fen), 20)

  // console.log(`DEPTH:${si.depth || 12} MOVE:${si.bestMoves[0].move} SCORE:${si.bestMoves[0].score} NODES:${si.nodes} FEN:${t.fen} ${si.elapsedTime}ms`)
  // if (t.depth) expect(si.depth).toBe(t.depth)
  if (si.move && t.bestMove) expect(si.move).toBe(t.bestMove - 1)
  if (t.score) expect(si.score).toBe(t.score)
}

const h = h2
describe('WIN 1 ', () => {
  test('win1', () => h({ fen: '32164625', score: 11, bestMove: 3 }))
  test('win2', () => h({ fen: '6146', score: 18, bestMove: 5 }))
  test('win3', () => h({ fen: '243335424257', score: 12, bestMove: 6 }))
  test('win4', () => h({ fen: '5512243243536', score: 13, bestMove: 4 }))
  test('win5', () => h({ fen: '22144426444', score: 15, bestMove: 5 }))
  test('win6', () => h({ fen: '265756512', score: -12, bestMove: 5 }))
  test('win7', () => h({ fen: '65444437612', score: 13, bestMove: 2 }))
  test('win8', () => h({ fen: '17516442226766', score: 8, bestMove: 5 }))
})
