import { Board, findBestMove } from './js/cf-engine.js'

const board = new Board('')
board.print()
const si = findBestMove(board, { minDepth: 42, maxThinkingTime: Infinity })

console.log('Result:', si)
