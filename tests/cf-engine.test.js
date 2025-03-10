const cf = require('../js/cf-engine.js');

test('test cache2', () => {
    // _  _  H  H  _  _  _
    // _  _  H  H  _  _  C
    // H  _  C  C  C  _  C
    // H  _  C  H  H  C  C
    cf.initGame('red|320342042636362')
    const sc = cf.searchBestMove()
    console.log('test cache', sc)
    expect(sc.bestMoves[0].move).toBe(6);
})
