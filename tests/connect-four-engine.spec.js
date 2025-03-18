const cf = require('../js/cf-engine.js');

const range = (n) => [...Array(n).keys()]
const p = m => m.score <= -MAXVAL + 50

const {Player, winningRows, winningRowsForFields, MAXVAL} = {...cf}

beforeEach(() => cf.init());

test('initialized correctly', () => {
    expect(winningRows.length).toBe(69)
    expect(winningRowsForFields.length).toBe(42)
    expect(winningRowsForFields[0]).toEqual([0, 1, 2])
    expect(winningRowsForFields[1]).toEqual([0, 3, 4, 5])
    expect(winningRowsForFields[10]).toEqual([7, 11, 15, 18, 21, 24, 25, 26, 48, 54])
    expect(cf.side()).toBe(Player.blue);
    range(7).forEach(c => expect(cf.getHeightOfCol(c)).toEqual(0));
    expect(cf.isMill()).toBe(false);
});

test('whoseTurn works', () => {
    expect(cf.side()).toBe(Player.blue);
    cf.doMove(0)
    expect(cf.side()).toBe(Player.red);
    cf.doMove(3)
    expect(cf.side()).toBe(cf.Player.blue);
});

test('draw - full board', () => {
    cf.initGame('blue|323336363662122226655554550000001114441414')
    expect(cf.searchBestMove().bestMoves.length).toBe(0)
    expect(cf.isDraw()).toBe(true)
});

test('draw - board almost full', () => {
    cf.initGame('red|323336363662122226655554550000001114441')
    const sc = cf.searchBestMove()
    expect(sc.bestMoves.length).toBe(2)
    expect(sc.bestMoves[0].move === 1 || sc.bestMoves[0].move === 4).toBeTruthy()
    expect(sc.bestMoves[0].score === 0).toBeTruthy() // -0!!
    expect(sc.bestMoves[1].score === 0).toBeTruthy() // -0!!
})

const h = (t) => {
    // if (t.act !== true) return

    cf.initGame(t.fen)
    const sc = cf.searchBestMove({maxDepth: t.maxDepth || t.depth || 42, maxThinkingTime: t.maxThinkingTime || 1000})

    // if (t.act) console.log(t.fen, sc)
    if (t.depth) expect(sc.depth).toBe(t.depth)
    if (t.bestMove) {
        const expectedMoves = typeof t.bestMove === "number" ? [t.bestMove] : t.bestMove
        expect(expectedMoves.includes(sc.bestMoves[0].move)).toBeTruthy();
    }
    if (t.cond) expect(t.cond(sc.bestMoves)).toBeTruthy()
}

test('eval1', () => h({fen: 'red|03030', maxDepth: 8, depth: 1, bestMove: 0, cond: bm => bm.slice(1).every(p)}))
test('eval2', () => h({fen: 'red|30303', maxDepth: 8, depth: 1, bestMove: 3, cond: bm => bm.slice(1).every(p)}))
test('eval3', () => h({fen: 'red|304', depth: 6, bestMove: [2, 5], cond: bm => bm.slice(2).every(p)}))
test('eval4', () => h({fen: 'red|30304', depth: 6, bestMove: [0, 2, 5], cond: bm => bm.slice(3).every(p)}))
test('eval5', () => h({fen: 'red|264', depth: 6, bestMove: [1, 3, 5], cond: bm => bm.slice(3).every(p)}))
test('eval6', () => h({fen: 'red|442', depth: 6, bestMove: [1, 3, 5], cond: bm => bm.slice(3).every(p)}))
test('eval7', () => h({fen: 'red|334', depth: 6, bestMove: [2, 5], cond: bm => bm.slice(2).every(p)}))
test('eval8', () => h({fen: 'blue|', depth: 8}))

test('loose1', () => h({fen: 'blue|030415', maxDepth: 8, depth: 1, cond: bm => bm.every(p)}))
test('loose2', () => h({fen: 'blue|33405', maxDepth: 8, depth: 1, cond: bm => bm.every(p)}))
test('loose3', () => h({fen: 'blue|0403230012', maxDepth: 8, depth: 4, cond: bm => bm.slice(1).every(p)}))
test('loose4', () => h({fen: 'blue|04032300124332', maxDepth: 8, depth: 4, cond: bm => bm.every(p)}))

// winning
test('win1r', () => h({fen: 'red|0606061', depth: 1, bestMove: 6,}))
test('win2r', () => h({fen: 'red|03043', depth: 2, bestMove: [2, 5]}))
test('win3r', () => h({fen: 'red|04030023342', depth: 6, bestMove: 6}))
test('win4r', () => h({fen: 'red|040323001', depth: 6, bestMove: [2, 4, 5]}))
test('win5r', () => h({fen: 'red|041323233223226361666', depth: 10, bestMove: 5}))
test('win6r', () => h({fen: 'red|33333535212225510112245514444', depth: 8, bestMove: 4}))
test('win7r', () => h({fen: 'red|3633241003021332110021266', depth: 12, bestMove: 6}))
// test('win8r', () => h({fen: 'red|332410233334225', depth: 20, bestMove: 4, maxThinkingTime: 5000}))
// test('win9r', () => h({fen: 'red|04032300233322434', depth: 22, bestMove: 4, maxThinkingTime: 5000,}))

test('win1b', () => h({fen: 'blue|2242', depth: 2, bestMove: 3}))
test('win2b', () => h({fen: 'blue|5443421244553533332222', depth: 10, bestMove: 4}))
test('win2b', () => h({fen: 'blue|3135', depth: 12, bestMove: 3}))
test('win3b', () => h({fen: 'blue|323121', depth: 10, bestMove: 3}))
test('win4b', () => h({fen: 'blue|4332330222332211', depth: 14, bestMove: 4}))
test('win5b', () => h({fen: 'blue|333231331011041100', depth: 16, bestMove: 4}))
test('win6b', () => h({fen: 'blue|323122334104334522', depth: 18, bestMove: 1}))
// test('win7b', () => h({fen: 'blue|3036', depth: 12, bestMove: 3}))  //  ~600ms
// test('win8b', () => h({fen: 'blue|3045', depth: 18, bestMove: 3, maxThinkingTime: 15000})) // ~6000ms
