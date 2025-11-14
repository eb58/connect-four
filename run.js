import { Board } from './js/cf-board.js'
import { findBestMove } from './js/cf-engine.js'

const board = new Board('')
board.print()
const si = findBestMove(board, { maxThinkingTime: 30000 })

console.log('Result:', si)
