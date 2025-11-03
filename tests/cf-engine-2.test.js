const fs = require('fs')
const path = require('path')
const { findBestMove, initGame } = require('../js/cf-engine-2')

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
    .slice(0, 1000)
    .forEach(({ input, expected }, index) => {
      test(`Test ${index + 1}: ${input} ->  ${expected}`, () => {
        const board = initGame(input)
        const si = findBestMove(board)
        // console.log('FEN:', input, JSON.stringify(si))
        expect(si.score).toBe(expected)
      })
    })
}

describe('Test_L1_R1', () => testData('Test_L1_R1')) // ~4.5 sec
describe('Test_L1_R2', () => testData('Test_L1_R2'))
describe('Test_L1_R3', () => testData('Test_L1_R3'))

describe('Test_L2_R1', () => testData('Test_L2_R1')) // ~ 1 sec
describe('Test_L2_R2', () => testData('Test_L2_R2')) // ~ 6 min

describe('Test_L3_R1', () => testData('Test_L3_R1')) // ~0.5 sec

test('simple', () => {
  // cfEngine.initGame('22144426444')
  initGame('243335424257')
  //cfEngine.initGame('265756512')
  // .printBoard()
  const si = findBestMove()
  // console.log('FEN:', input, JSON.stringify(si))
  let score = si.bestMoves[0].score
  console.log( si )
  expect(score).toBe(12)
})
