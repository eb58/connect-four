const Board = require('./js/cf-board')
const findBestMove = require('./js/cf-engine')

process.argv.slice(2).forEach((fen) => {
  fen = fen || ''
  const board = new Board(fen)
  board.print()
  findBestMove(board, { maxThinkingTime: Infinity })
})
