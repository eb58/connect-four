const cf = require('../js/cf-engine.js')

const range = (n) => [...Array(n).keys()]
const loosingMove = (m) => m.score < 0

beforeEach(() => cf.init())

describe('SIMPLE TESTS', () => {
  test('initialized correctly', () => {
    expect(cf.currentPlayer()).toBe(cf.Player.ai)
    range(7).forEach((c) => expect(cf.getHeightOfCol(c)).toEqual(0))
  })

  test('whoseTurn works', () => {
    expect(cf.currentPlayer()).toBe(cf.Player.ai)
    cf.doMove(0)
    expect(cf.currentPlayer()).toBe(cf.Player.hp)
    cf.doMove(3)
    expect(cf.currentPlayer()).toBe(cf.Player.ai)
  })

  test('draw - full board', () => {
    cf.initGame('434447474773233337766665661111112225552525')
    expect(cf.findBestMove().bestMoves.length).toBe(0)
    expect(cf.isDraw()).toBe(true)
  })

  test('draw - board almost full', () => {
    cf.initGame('434447474773233337766665661111112225552')
    const si = cf.findBestMove()
    // console.log(`DEPTH:${sc.depth} {${sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${sc.nodes} ${sc.elapsedTime}ms}`)
    expect(si.bestMoves.length).toBe(2)
    expect(si.bestMoves[0].move === 1 || si.bestMoves[0].move === 4).toBeTruthy()
    expect(si.bestMoves[0].score).toBe(0)
    expect(si.bestMoves[1].score).toBe(0)
  })
})

const h = (name, t) => {
  cf.initGame(t.fen)
  const si = cf.findBestMove({ maxDepth: t.maxDepth || t.depth || 42, maxThinkingTime: t.maxThinkingTime || 1000 })

  // console.log(`${name} --- ${cf.infoStr(si)} FEN:${t.fen}`, si.bestMoves.slice(1))
  if (t.depth) expect(si.depth).toBe(t.depth)
  if (t.bestMove) {
    if (typeof t.bestMove === 'number') expect(si.bestMoves[0].move + 1).toBe(t.bestMove)
    else expect(t.bestMove.includes(si.bestMoves[0].move + 1)).toBeTruthy()
    if (t.score) expect(si.bestMoves[0].score).toBe(t.score)
  }
  if (t.cond) expect(t.cond(si.bestMoves)).toBeTruthy()
}

describe('EVAL', () => {
  test('eval1', () => h('eval1', { fen: '14141', bestMove: 1, cond: (bm) => bm.slice(1).every(loosingMove) }))
  test('eval2', () => h('eval2', { fen: '41414', depth: 1, bestMove: 4, cond: (bm) => bm.slice(1).every(loosingMove) }))
  test('eval3', () => h('eval3', { fen: '415', depth: 4, bestMove: [3, 6], cond: (bm) => bm.slice(2).every(loosingMove) }))
  test('eval4', () => h('eval4', { fen: '41415', depth: 4, bestMove: [1, 3, 6], cond: (bm) => bm.slice(3).every(loosingMove) }))
  test('eval5', () => h('eval5', { fen: '375', depth: 4, bestMove: [2, 4, 6], cond: (bm) => bm.slice(3).every(loosingMove) }))
  test('eval6', () => h('eval6', { fen: '553', depth: 4, bestMove: [2, 4, 6], cond: (bm) => bm.slice(3).every(loosingMove) }))
  test('eval7', () => h('eval7', { fen: '445', depth: 4, bestMove: [3, 6], cond: (bm) => bm.slice(2).every(loosingMove) }))
  test('eval8', () => h('eval8', { fen: '443', depth: 4, bestMove: [2, 5], cond: (bm) => bm.slice(2).every(loosingMove) }))
  test('eval9', () => h('eval9', { fen: '', depth: 8 }))
})

const loosing = (bm) => bm[0].score < 0
const winning = (bm) => bm[0].score > 0 || (bm[0].score >= 0 && bm.slice(1).every((m) => m.score < 0))

describe('LOOSE', () => {
  test('loose1', () => h('loose1', { fen: '141526', cond: loosing }))
  test('loose2', () => h('loose2', { fen: '44516', cond: loosing }))
  test('loose3', () => h('loose3', { fen: '15143411235443', cond: loosing }))
  test('loose4', () => h('loose4', { fen: '15243434433433747277', cond: loosing }))
  test('loose5', () => h('loose5', { fen: '47443521141324432211323735', cond: loosing }))
})

describe('WIN EASY ', () => {
  test('win-easy-1', () => h('win-easy-1', { fen: '22144426444', bestMoves: 5, cond: winning }))
  test('win-easy-2', () => h('win-easy-2', { fen: '265756512', bestMoves: 5, cond: winning }))
  test('win-easy-3', () => h('win-easy-3', { fen: '6625244723134', bestMoves: 3, cond: winning }))
  test('win-easy-4', () => h('win-easy-4', { fen: '1717172', bestMove: 7, cond: winning }))
  test('win-easy-5', () => h('win-easy-5', { fen: '1514341123', bestMoves: 3, cond: winning }))
})

describe('WIN 1 ', () => {
  test('win01', () => h('win01', { fen: '14154', depth: 2, bestMove: [3, 6], cond: winning }))
  test('win02', () => h('win02', { fen: '15141134453', depth: 6, bestMove: 7, cond: winning }))
  test('win03', () => h('win03', { fen: '151434112', depth: 6, bestMove: [3, 5, 6], cond: winning }))
  test('win05', () => h('win05', { fen: '44444646323336621223356625555', depth: 8, bestMove: 5, cond: winning }))
  test('win06', () => h('win06', { fen: '4744352114132443221132377', bestMove: 7, cond: winning }))
  test('win07', () => h('win07', { fen: '4451', bestMoves: [3, 5], cond: winning }))
  test('win08', () => h('win08', { fen: '3353', depth: 2, bestMove: 4, cond: winning }))
  test('win09', () => h('win09', { fen: '6554532355664644443333', depth: 10, bestMove: 5, cond: winning }))
  test('win10', () => h('win10', { fen: '5443441333443322', depth: 14, bestMove: 5, cond: winning }))
  test('win11', () => h('win11', { fen: '444342442122152211', depth: 16, bestMove: 5, cond: winning }))
  test('win12', () => h('win12', { fen: '434232', bestMove: 4, cond: winning }))
  test('win13', () => h('win13', { fen: '434233445215445633', depth: 18, bestMove: 2, cond: winning }))
  test('win14', () => h('win14', { fen: '6165173152', bestMoves: 3, cond: winning }))
})

describe('WIN 2 ', () => {
  test('win1', () => h('win1', { fen: '4246', bestMove: 4 }))
  test('win2', () => h('win2', { fen: '4147', bestMove: 4 }))
  test('win3', () => h('win3', { fen: '15143411344433545', depth: 22, bestMove: 5 })) // ~600ms
  test('win4', () => h('win4', { fen: '443521344445336', depth: 20, bestMove: 5 })) // ~650ms
  test('win5', () => h('win5', { fen: '414144', depth: 14, bestMove: 5 })) // ~650ms
  test('win6', () => h('win6', { fen: '4443424433', depth: 18, bestMove: 3 }))
  // test('win7', () => h('win7', { fen: '4156', bestMove: 4, maxThinkingTime: 30600 })) // ~5000ms
})
