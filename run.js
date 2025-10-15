const cf = require('./js/cf-engine.js')

const fen = '4'
const moves = fen.split('').map((x) => +x)

cf.init(cf.Player.hp)
moves.forEach((v) => cf.doMove(v))
const sc = cf.searchBestMove({ maxThinkingTime: 311000 })
console.log(`DEPTH:${sc.depth} { ${sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${sc.nodes} ${sc.elapsedTime}ms ***`)
