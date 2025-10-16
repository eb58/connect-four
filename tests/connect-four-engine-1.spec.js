const cf = require('../js/cf-engine.js')

const range = (n) => [...Array(n).keys()]
const loosingMove = (m) => m.score < 0

const { Player, winningRows, winningRowsForFields } = { ...cf }

beforeEach(() => cf.init())

test('initialized correctly', () => {
  expect(winningRows.length).toBe(69)
  expect(winningRowsForFields.length).toBe(42)
  expect(winningRowsForFields[0]).toEqual([0, 1, 2])
  expect(winningRowsForFields[1]).toEqual([0, 3, 4, 5])
  expect(winningRowsForFields[10]).toEqual([7, 11, 15, 18, 21, 24, 25, 26, 48, 54])
  expect(cf.side()).toBe(Player.ai)
  range(7).forEach((c) => expect(cf.getHeightOfCol(c)).toEqual(0))
  expect(cf.isMill()).toBeFalsy()
})

test('isMill', () => {
  cf.initGame('')
  expect(cf.isMill()).toBeFalsy()
  cf.initGame('1414141')
  expect(cf.isMill()).toBeTruthy()
})

test('whoseTurn works', () => {
  expect(cf.side()).toBe(Player.ai)
  cf.doMove(0)
  expect(cf.side()).toBe(Player.hp)
  cf.doMove(3)
  expect(cf.side()).toBe(cf.Player.ai)
  expect(cf.isMill()).toBe(false)
})

test('draw - full board', () => {
  cf.initGame('434447474773233337766665661111112225552525')
  expect(cf.searchBestMove().bestMoves.length).toBe(0)
  expect(cf.isDraw()).toBe(true)
})

test('draw - board almost full', () => {
  cf.initGame('434447474773233337766665661111112225552')
  const sc = cf.searchBestMove()
  // console.log(`DEPTH:${sc.depth} BestMoves:{${sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${sc.nodes} ${sc.elapsedTime}ms}`)
  expect(sc.bestMoves.length).toBe(2)
  expect(sc.bestMoves[0].move === 2 || sc.bestMoves[0].move === 5).toBeTruthy()
  expect(sc.bestMoves[0].score === 0).toBeTruthy() // -0!!
  expect(sc.bestMoves[1].score === 0).toBeTruthy() // -0!!
})

const h = (name, t) => {
  cf.initGame(t.fen, Player.ai)
  const searchInfo = cf.searchBestMove({ maxDepth: t.maxDepth || t.depth || 42, maxThinkingTime: t.maxThinkingTime || 1000 })

  // console.log(`${name} --- DEPTH:${searchInfo.depth} { ${cf.movesStr(searchInfo.bestMoves)}} NODES:${searchInfo.nodes} ${searchInfo.elapsedTime}ms FEN:${t.fen}`)
  if (t.depth) expect(searchInfo.depth).toBe(t.depth)
  if (t.bestMove) {
    if (typeof t.bestMove === 'number') expect(searchInfo.bestMoves[0].move).toBe(t.bestMove)
    else expect(t.bestMove.includes(searchInfo.bestMoves[0].move)).toBeTruthy()
  }
  if (t.cond) expect(t.cond(searchInfo.bestMoves)).toBeTruthy()
}

test('eval1', () => h('eval1', { fen: '14141', bestMove: 1, cond: (bm) => bm.slice(1).every(loosingMove) }))
test('eval2', () => h('eval2', { fen: '41414', depth: 1, bestMove: 4, cond: (bm) => bm.slice(1).every(loosingMove) }))
test('eval3', () => h('eval3', { fen: '415', depth: 4, bestMove: [3, 6], cond: (bm) => bm.slice(2).every(loosingMove) }))
test('eval4', () => h('eval4', { fen: '41415', depth: 4, bestMove: [1, 3, 6], cond: (bm) => bm.slice(3).every(loosingMove) }))
test('eval5', () => h('eval5', { fen: '375', depth: 4, bestMove: [2, 4, 6], cond: (bm) => bm.slice(3).every(loosingMove) }))
test('eval6', () => h('eval6', { fen: '553', depth: 4, bestMove: [2, 4, 6], cond: (bm) => bm.slice(3).every(loosingMove) }))
test('eval7', () => h('eval7', { fen: '445', depth: 4, bestMove: [3, 6], cond: (bm) => bm.slice(2).every(loosingMove) }))
test('eval8', () => h('eval8', { fen: '443', depth: 4, bestMove: [2, 5], cond: (bm) => bm.slice(2).every(loosingMove) }))
test('eval9', () => h('eval9', { fen: '', depth: 8 }))

test('loose1', () => h('loose1', { fen: '141526', cond: (bm) => bm.every(loosingMove) }))
test('loose2', () => h('loose2', { fen: '44516', cond: (bm) => bm.every(loosingMove) }))
test('loose3', () => h('loose3', { fen: '15143411235443', cond: (bm) => bm.every(loosingMove) }))
test('loose4', () => h('loose4', { fen: '15243434433433747277', cond: (bm) => bm.every(loosingMove) }))
test('loose5', () => h('loose5', { fen: '47443521141324432211323735', cond: (bm) => bm.every(loosingMove) }))

// winning
test('win-easy-1', () => h('win-easy-1', { fen: '22144426444', bestMoves: 5 }))
test('win-easy-2', () => h('win-easy-2', { fen: '265756512', bestMoves: 5 }))
test('win-easy-3', () => h('win-easy-3', { fen: '6625244723134', bestMoves: 3 }))
test('win-easy-4', () => h('win-easy-4', { fen: '1717172', bestMove: 7 }))
test('win-easy-5', () => h('win-easy-5', { fen: '1514341123', bestMoves: 3 }))

test('win01', () => h('win01', { fen: '14154', depth: 2, bestMove: [3, 6] }))
test('win02', () => h('win02', { fen: '15141134453', depth: 6, bestMove: 7 }))
test('win03', () => h('win03', { fen: '151434112', depth: 6, bestMove: [3, 5, 6] }))
test('win05', () => h('win04', { fen: '44444646323336621223356625555', depth: 8, bestMove: 5 }))
test('win06', () => h('win05', { fen: '4744352114132443221132377', bestMove: 7 }))
test('win07', () => h('win06', { fen: '4451', bestMoves: [3, 5] }))
test('win08', () => h('win07', { fen: '3353', depth: 2, bestMove: 4 }))
test('win09', () => h('win08', { fen: '6554532355664644443333', depth: 10, bestMove: 5 }))
test('win10', () => h('win09', { fen: '5443441333443322', depth: 14, bestMove: 5 }))
test('win11', () => h('win10', { fen: '444342442122152211', depth: 16, bestMove: 5 }))
test('win12', () => h('win11', { fen: '434232', depth: 12, bestMove: 4 }))
test('win13', () => h('win12', { fen: '434233445215445633', depth: 18, bestMove: 2 }))
// test('win14', () => h({fen: '6165173152', depth: 12, bestMoves: 3}))
// test('win15', () => h({fen: '15143411344433545', depth: 22, bestMove: 5})) // ~750ms
// test('win16', () => h({fen: '443521344445336', depth: 20, bestMove: 5, maxThinkingTime: 2000})) // ~1200ms
// test('win17', () => h({fen: '4246', bestMove: 4, maxThinkingTime: 2000})) // ~3000
// test('win18', () => h({fen: '4147', depth: 18, bestMove: 4, maxThinkingTime: 15000}))  //  ~8000ms
// test('win19', () => h({fen: '4156', depth: 18, bestMove: 4, maxThinkingTime: 30000})) // ~20000ms
