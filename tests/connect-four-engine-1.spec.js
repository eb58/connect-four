const cf = require('../js/cf-engine.js');

const range = (n) => [...Array(n).keys()]
const p = m => m.score <= -MAXVAL + 50

const {Player, winningRows, winningRowsForFields, MAXVAL, CACHE} = {...cf}

beforeEach(() => cf.init());

test('initialized correctly', () => {
    expect(winningRows.length).toBe(69)
    expect(winningRowsForFields.length).toBe(42)
    expect(winningRowsForFields[0]).toEqual([0, 1, 2])
    expect(winningRowsForFields[1]).toEqual([0, 3, 4, 5])
    expect(winningRowsForFields[10]).toEqual([7, 11, 15, 18, 21, 24, 25, 26, 48, 54])
    expect(cf.side()).toBe(Player.blue);
    range(7).forEach(c => expect(cf.getHeightOfCol(c)).toEqual(0));
    expect(cf.isMill()).toBeFalsy();
});

test('isMill', () => {
    cf.initGame('')
    expect(cf.isMill()).toBeFalsy();
    cf.initGame('1414141')
    expect(cf.isMill()).toBeTruthy();
});


test('whoseTurn works', () => {
    expect(cf.side()).toBe(Player.blue);
    cf.doMove(0)
    expect(cf.side()).toBe(Player.red);
    cf.doMove(3)
    expect(cf.side()).toBe(cf.Player.blue);
    expect(cf.isMill()).toBe(false);
});

test('draw - full board', () => {
    cf.initGame('434447474773233337766665661111112225552525')
    expect(cf.searchBestMove().bestMoves.length).toBe(0)
    expect(cf.isDraw()).toBe(true)
});

test('draw - board almost full', () => {
    cf.initGame('434447474773233337766665661111112225552')
    const sc = cf.searchBestMove()
    expect(sc.bestMoves.length).toBe(2)
    expect(sc.bestMoves[0].move === 2 || sc.bestMoves[0].move === 5).toBeTruthy()
    expect(sc.bestMoves[0].score === 0).toBeTruthy() // -0!!
    expect(sc.bestMoves[1].score === 0).toBeTruthy() // -0!!
})

const h = (t) => {
    cf.initGame(t.fen)
    const sc = cf.searchBestMove({maxDepth: t.maxDepth || t.depth || 42, maxThinkingTime: t.maxThinkingTime || 1000})

    console.log(`FEN:${t.fen} DEPTH:${sc.depth} BestMove:${sc.bestMoves[0].move}:${sc.bestMoves[0].score} NODES:${sc.nodes} ${Date.now() - sc.startAt}ms ${CACHE.info()}`, sc.bestMoves)
    if (t.depth) expect(sc.depth).toBe(t.depth)
    if (t.bestMove) {
        const expectedMoves = typeof t.bestMove === "number" ? [t.bestMove] : t.bestMove
        expect(expectedMoves.includes(sc.bestMoves[0].move)).toBeTruthy();
    }
    if (t.cond) expect(t.cond(sc.bestMoves)).toBeTruthy()
}

test('eval1', () => h({fen: '14141', depth: 2, bestMove: 1, cond: bm => bm.slice(1).every(p)}))
test('eval2', () => h({fen: '41414', depth: 2, bestMove: 4, cond: bm => bm.slice(1).every(p)}))
test('eval3', () => h({fen: '415', depth: 4, bestMove: [3, 6], cond: bm => bm.slice(2).every(p)}))
test('eval4', () => h({fen: '41415', depth: 4, bestMove: [1, 3, 6], cond: bm => bm.slice(3).every(p)}))
test('eval5', () => h({fen: '375', depth: 4, bestMove: [2, 4, 6], cond: bm => bm.slice(3).every(p)}))
test('eval6', () => h({fen: '553', depth: 4, bestMove: [2, 4, 6], cond: bm => bm.slice(3).every(p)}))
test('eval7', () => h({fen: '445', depth: 4, bestMove: [3, 6], cond: bm => bm.slice(2).every(p)}))
test('eval8', () => h({fen: '', depth: 8}))

test('loose1', () => h({fen: '141526', cond: bm => bm.every(p)}))
test('loose2', () => h({fen: '44516', cond: bm => bm.every(p)}))
test('loose3', () => h({fen: '1514341123', cond: bm => bm.every(p)}))
test('loose4', () => h({fen: '15143411235443', cond: bm => bm.every(p)}))

// winning
// ??? test('win1r', () => h({fen: '0606061', depth: 1, bestMove: 6,}))
test('win01', () => h({fen: '14154', depth: 2, bestMove: [3, 6]}))
test('win02', () => h({fen: '15141134453', depth: 6, bestMove: 7}))
test('win03', () => h({fen: '151434112', depth: 6, bestMove: [3, 5, 6]}))
test('win04', () => h({fen: '152434344334337472777', depth: 10, bestMove: 6}))
test('win05', () => h({fen: '44444646323336621223356625555', depth: 8, bestMove: 5}))
test('win06', () => h({fen: '4744352114132443221132377', depth: 12, bestMove: 7}))
test('win07', () => h({fen: '4451', depth: 8, bestMoves: [3, 5]}))
test('win08', () => h({fen: '3353', depth: 2, bestMove: 4}))
test('win09', () => h({fen: '6554532355664644443333', depth: 10, bestMove: 5}))
test('win10', () => h({fen: '5443441333443322', depth: 14, bestMove: 5}))
test('win11', () => h({fen: '444342442122152211', depth: 16, bestMove: 5}))
test('win12', () => h({fen: '434232', depth: 12, bestMove: 4}))
test('win13', () => h({fen: '434233445215445633', depth: 18, bestMove: 2}))

// test('win14', () => h({fen: '4246', depth: 12, bestMove: 4}))
// test('win15', () => h({fen: '15143411344433545', depth: 22, bestMove: 5, maxThinkingTime: 1500,})) // ~550ms
// test('win16', () => h({fen: '443521344445336', depth: 20, bestMove: 5, maxThinkingTime: 2000})) // ~700ms
// test('win17', () => h({fen: '4147', depth: 18, bestMove: 4, maxThinkingTime: 15000}))  //  ~700ms
// test('win18', () => h({fen: '4156', depth: 18, bestMove: 4, maxThinkingTime: 15000})) // ~6000ms
// test('win19', () => h({fen: '6165173152', bestMoves: 3, maxThinkingTime: 15000}))
