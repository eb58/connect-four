const  Board  = require('./js/cf-board')
const  findBestMove  = require('./js/cf-engine-2')
const fen = ''
const board = new Board(fen)
board.print()
const sc = findBestMove(board, { maxThinkingTime: Infinity })
console.log(`DEPTH:${sc.depth} SCORE:${sc.score} MOVE:${sc.move} NODES:${sc.nodes} ${sc.elapsedTime}ms ***`)
