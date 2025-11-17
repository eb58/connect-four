import { Board } from './js/cf-board.js'
import { findBestMove } from './js/cf-engine.js'

const board = new Board('')
board.print()
const si = findBestMove(board, { minDepth: 1, maxThinkingTime: Infinity })

console.log('Result:', si)
