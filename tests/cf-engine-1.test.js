import { Board, findBestMove } from '../js/cf-engine'

describe('BOARD', () => {
  test('for debug ', () => {
    expect(new Board('12 12 12').checkWinForColumn(0)).toBe(true)
  })

  test('easy tests ', () => {
    expect(new Board('112233').checkWinForColumn(3)).toBe(true)
    expect(new Board('12 12 12').checkWinForColumn(0)).toBe(true)
    expect(new Board('23 23 23').findWinningColumnForCurrentPlayer([0,1,2,3,4,5,6])).toBe(1)
    expect(new Board('23 23 2').findWinningColumnForOpponentPlayer([0,1,2,3,4,5,6])).toBe(1)
  })
})


const h = (name, t) => {
  const board = new Board(t.fen)
  board.print()
  const si = findBestMove(board, { maxDepth: t.maxDepth || t.depth || 42, maxThinkingTime: t.maxThinkingTime || 1000 })

  console.log(si)
  if (t.depth) expect(si.depth).toBe(t.depth)
  if (t.bestMove) {
    if (typeof t.bestMove === 'number') expect(si.bestMove + 1).toBe(t.bestMove)
    else expect(t.bestMove.includes(si.bestMove + 1)).toBeTruthy()
    if (t.score) expect(si.score).toBe(t.score)
  }
  if (t.cond) expect(t.cond(si)).toBeTruthy()
}

describe('EVAL ', () => {
  test('eval1', () => h('eval1', { fen: '', depth: 15 }))
  test('eval2', () => h('eval2', { fen: '14141', bestMove: 1 }))
})

const loosing = (si) => si.score < 0
const winning = (si) => si.score > 0

describe('LOOSE ', () => {
  test('loose1', () => h('loose1', { fen: '141526', cond: loosing }))
  test('loose2', () => h('loose2', { fen: '44516', cond: loosing }))
  test('loose3', () => h('loose3', { fen: '15143411235443', cond: loosing }))
  test('loose4', () => h('loose4', { fen: '15243434433433747277', cond: loosing }))
  test('loose5', () => h('loose5', { fen: '47443521141324432211323735', cond: loosing }))
  test('loose6', () => h('loose6', { fen: '265756512', cond: loosing }))
  test('loose7', () => h('loose6', { fen: '1514341123', cond: loosing }))
  test('loose8', () => h('loose8', { fen: '6625244723134', cond: loosing }))
  test('loose9', () => h('loose9', { fen: '41414', cond: loosing }))
  test('loose10', () => h('loose10', { fen: '41415', cond: loosing }))
})

describe('WIN EASY', () => {
  test('win-easy-1', () => h('win-easy-1', { fen: '22144426444', bestMove: 5, cond: winning }))
  test('win-easy-2', () => h('win-easy-2', { fen: '1717172', bestMove: 7, cond: winning }))
})

describe('WIN 1', () => {
  test('win01', () => h('win01', { fen: '14154', bestMove: [3, 6], cond: winning }))
  test('win02', () => h('win02', { fen: '15141134453', bestMove: 7, cond: winning }))
  test('win03', () => h('win03', { fen: '151434112', bestMove: [3, 5, 6], cond: winning }))
  test('win05', () => h('win05', { fen: '44444646323336621223356625555', bestMove: 5, cond: winning }))
  test('win06', () => h('win06', { fen: '4744352114132443221132377', bestMove: 7, cond: winning }))
  test('win07', () => h('win07', { fen: '4451', bestMove: [3, 5], cond: winning }))
  test('win08', () => h('win08', { fen: '3353', bestMove: 4, cond: winning }))
  test('win09', () => h('win09', { fen: '6554532355664644443333', bestMove: 5, cond: winning }))
  test('win10', () => h('win10', { fen: '5443441333443322', bestMove: 5, cond: winning }))
  test('win11', () => h('win11', { fen: '444342442122152211', bestMove: 5, cond: winning }))
  test('win12', () => h('win12', { fen: '434232', bestMove: 4, cond: winning }))
  test('win13', () => h('win13', { fen: '434233445215445633', bestMove: 2, cond: winning }))
  test('win14', () => h('win14', { fen: '6165173152', bestMove: 6, cond: winning }))
})

describe('WIN 2', () => {
  test('win1', () => h('win1', { fen: '42464444111111', bestMove: 3 }))
  test('win2', () => h('win2', { fen: '4147', bestMove: 4 }))
  test('win3', () => h('win3', { fen: '15143411344433545', bestMove: 5 }))
  test('win4', () => h('win4', { fen: '443521344445336', bestMove: 5 }))
  test('win5', () => h('win5', { fen: '414144', bestMove: 5 }))
  test('win6', () => h('win6', { fen: '4443424433', bestMove: 3 }))
  // test('win7', () => h('win7', { fen: '4156', bestMove: 4, maxThinkingTime: 30600 })) // ~5000ms
})
