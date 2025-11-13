const  Board  = require('./js/cf-board')
const  findBestMove  = require('./js/cf-engine')
const fen = ''
const board = new Board(fen)
board.print()
findBestMove(board, { maxThinkingTime: Infinity })
