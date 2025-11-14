const fs = require('fs')
const path = require('path')

import { Board } from '../js/cf-board'
import { findBestMove } from '../js/cf-engine'

const readData = (fileName) => {
  const content = fs.readFileSync(path.join(__dirname + '/../data', fileName), 'utf-8')
  return content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [input, expected] = line.split(' ')
      return {
        input,
        expected: Number(expected)
      }
    })
}

const testData = (fileName) => {
  readData(fileName)
    .slice(0, 100)
    .forEach(({ input, expected }, index) =>
      test(`Test ${index + 1}: ${input} ->  ${expected}`, () => {
        const board = new Board(input)
        board.print()
        const si = findBestMove(board, { maxThinkingTime: 3000 })
        // console.log('FEN:', input, JSON.stringify(si))
        console.log(`Test ${index + 1}: ${input} ->  ${expected}`, si.score)
        expect(Math.sign(si.score)).toBe(Math.sign(expected))
      })
    )
}

describe('Test_L1_R1 ', () => testData('Test_L1_R1')) // ~4.5 sec
describe('Test_L1_R2 ', () => testData('Test_L1_R2'))
describe('Test_L1_R3 ', () => testData('Test_L1_R3'))

describe('Test_L2_R1 ', () => testData('Test_L2_R1')) // ~ 1 sec ok
describe('Test_L2_R2 ', () => testData('Test_L2_R2')) // ~ 6 min

describe('Test_L3_R1 ', () => testData('Test_L3_R1')) // ~0.5 sec

test('simple', () => {
  const board = new Board('')
  const si = findBestMove(board, { maxDepth: 20 })
  console.log(si)
  // expect(si.score).toBeGreaterThan(0)
})
