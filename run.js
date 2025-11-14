import { Board } from './js/cf-board.js'
import { findBestMove } from './js/cf-engine.js'

const board = new Board('4156')
board.print()
const si = findBestMove(board, { maxThinkingTime: Infinity })

console.log('Result:', si)
