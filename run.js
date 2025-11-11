const cf = require('./js/cf-engine-2.js')

cf.initGame('')
const sc = cf.findBestMove({ maxThinkingTime: Infinity })
console.log(`DEPTH:${sc.depth} { ${sc.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${sc.nodes} ${sc.elapsedTime}ms ***`)
