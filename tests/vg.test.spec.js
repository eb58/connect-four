const { findBestMove, initGame } = require('../js/vg-engine.js')



const h = (t) => {
  const si = findBestMove(initGame(t.fen), t.depth || 12)

  console.log(`DEPTH:${si.depth} NODES:${si.nodes} ${si.elapsedTime}ms ${si.CACHE?.info()} FEN:${t.fen} `)
  // if (t.depth) expect(si.depth).toBe(t.depth)
  if (t.bestMove) {
    if (typeof t.bestMove === 'number') expect(si.move).toBe(t.bestMove)
    else expect(t.bestMove.includes(si.move)).toBeTruthy()
  }
  if (t.score) expect(si.score).toBe(t.score)
}

test('win1', () => h({ fen: '32164625', depth: 13, score: 11, bestMove: 2})) // ~650ms
test('win2', () => h({ fen: '6146', depth: 18, score: 18, bestMove: 4, })) // ~650ms
test('win3', () => h({ fen: '243335424257', score: 12, bestMove: 5 })) // ~650ms
test('win4', () => h({ fen: '5512243243536', score: 13, bestMove: 3 })) // ~650ms
test('win5', () => h({ fen: '22144426444', score: 15, bestMove: 4 })) // ~650ms
