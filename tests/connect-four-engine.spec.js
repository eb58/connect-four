const cf = require('../js/cf-engine.js');

const range = (n) => [...Array(n).keys()]

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

const handleTest = (t) => {
    // if (t.act !== true) return

    cf.initGame(t.fen)
    const sc = cf.searchBestMove({maxDepth: t.depth || 42, maxThinkingTime: t.maxThinkingTime || 1000})
    if (t.act === true) console.log(t.fen, sc)
    if (t.depth) expect(sc.depth).toBeGreaterThanOrEqual(t.depth || 1)
    if (t.bestMove) {
        const expectedMoves = typeof t.bestMove === "number" ? [t.bestMove] : t.bestMove
        expect(expectedMoves.includes(sc.bestMoves[0].move)).toBeTruthy();
    }
    if (t.cond) expect(t.cond(sc.bestMoves)).toBeTruthy()
}

const loosingTests = [
    {fen: 'blue|030415', depth: 1, cond: bm => bm.every((m) => m.score === -MAXVAL + 1)},
    {fen: 'blue|33405', depth: 1, cond: bm => bm.every((m) => m.score === -MAXVAL + 1)},
    {fen: 'blue|04032300124332', depth: 4, cond: bm => bm.every((m) => m.score <= -MAXVAL + 3)},
]

const evalTests = [
    {fen: 'red|03030', depth: 1, bestMove: 0, cond: bm => bm.slice(1).every((m) => m.score === -MAXVAL + 1)},
    {fen: 'red|30303', depth: 1, bestMove: 3, cond: bm => bm.slice(1).every((m) => m.score === -MAXVAL + 1)},
    {fen: 'red|304', depth: 6, bestMove: [2, 5], cond: bm => bm.slice(2).every((m) => m.score <= -MAXVAL + 3)},
    {fen: 'red|30304', depth: 6, bestMove: [2, 5], cond: bm => bm.slice(3).every((m) => m.score <= -MAXVAL + 3)},
    {fen: 'red|264', depth: 6, bestMove: [1, 3, 5], cond: bm => bm.slice(3).every((m) => m.score <= -MAXVAL + 3)},
    {fen: 'red|442', depth: 6, bestMove: [1, 3, 5], cond: bm => bm.slice(3).every((m) => m.score <= -MAXVAL + 3)},
    {fen: 'red|334', depth: 6, bestMove: [2, 5], ond: bm => bm.slice(2).every((m) => m.score <= -MAXVAL + 3)},
    {fen: 'blue|0403230012', depth: 4, bestMove: 4, cond: bm => bm.slice(1).every((m) => m.score <= -MAXVAL + 3)},
    {fen: 'blue|', depth: 10, maxThinkingTime: 100}
]

const winningTests = [
    {fen: 'blue|2242', depth: 2, bestMove: 3},
    {fen: 'blue|5443421244553533332222', depth: 10, bestMove: 4},
    {fen: 'blue|3135', depth: 12, bestMove: 3},
    {fen: 'blue|323121', depth: 10, bestMove: 3},
    {fen: 'blue|4332330222332211', depth: 14, bestMove: 4},
    {fen: 'blue|333231331011041100', depth: 16, bestMove: 4},
    {fen: 'blue|323122334104334522', depth: 18, bestMove: 1},
    // {fen: 'blue|3045', depth: 18, bestMove: 4, maxThinkingTime: 12000},
    {fen: 'red|0606061', depth: 1, bestMove: 6,},
    {fen: 'red|03043', depth: 2, bestMove: [2, 5]},
    {fen: 'red|04030023342', depth: 6, bestMove: 6},
    {fen: 'red|040323001', depth: 6, bestMove: [2, 4, 5]},
    {fen: 'red|041323233223226361666', depth: 10, bestMove: 5},
    {fen: 'red|33333535212225510112245514444', depth: 8, bestMove: 4},
    {fen: 'red|3633241003021332110021266', depth: 12, bestMove: 6},
    // {fen: 'red|332410233334225', depth: 20, bestMove: 4, maxThinkingTime: 5000},
    // {fen: 'red|04032300233322434', depth: 22, bestMove: 4, maxThinkingTime: 5000,},
]

test.each(evalTests)(`eval $fen`, handleTest)
test.each(loosingTests)(`loosing $fen`, handleTest)
test.each(winningTests)(`winning $fen $depth`, handleTest)
