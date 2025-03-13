const cf = require('./js/cf-engine.js')

const fen = 'blue|31353333'
const side = fen.split('|')[0] === 'blue' ? cf.Player.blue : cf.Player.red
const moves = fen.split('|')[1].split('').map(x => +x)

cf.init(side)
moves.forEach(v => cf.doMove(v));

const sc = cf.searchBestMove({maxThinkingTime: 60 * 1000})

console.log(`DEPTH:${sc.depth} { ${sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${sc.nodes} ${Date.now() - sc.startAt + 'ms'} ${cf.CACHE.info()} ${cf.CACHE2.info()} ***`)
