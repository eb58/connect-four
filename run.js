import { Board, findBestMove } from './js/cf-engine.js'

const board = new Board('')
board.print()
const si = findBestMove(board, { xminDepth: 42, maxThinkingTime: 40000 })

console.log('Result:', si)
