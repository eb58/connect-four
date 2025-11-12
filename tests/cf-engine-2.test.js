const fs = require('fs')
const path = require('path')
const  Board  = require('../js/cf-board')
const  findBestMove  = require('../js/cf-engine')

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
    .slice(0, 10)
    .forEach(({ input, expected }, index) => {
      test(`Test ${index + 1}: ${input} ->  ${expected}`, () => {
        const board = new Board(input)
        const si = findBestMove(board, { maxThinkingTime: 10000 })
        // console.log('FEN:', input, JSON.stringify(si))
        console.log(`Test ${index + 1}: ${input} ->  ${expected}`, si.score)
        expect(Math.sign(si.score) === Math.sign(expected) || (si.score === 0 && si.bestMoves.slice(1).every((m) => m.score < 0))).toBeTruthy()
      })
    })
}

describe('Test_L1_R1', () => testData('Test_L1_R1')) // ~4.5 sec
describe('Test_L1_R2', () => testData('Test_L1_R2'))
describe('Test_L1_R3', () => testData('Test_L1_R3'))

describe('Test_L2_R1', () => testData('Test_L2_R1')) // ~ 1 sec ok
describe('Test_L2_R2', () => testData('Test_L2_R2')) // ~ 6 min

describe('Test_L3_R1', () => testData('Test_L3_R1')) // ~0.5 sec

test('simple', () => {
  initGame('22144426444')
  //initGame('243335424257')
  // .printBoard()
  const si = findBestMove()
  // console.log('FEN:', input, JSON.stringify(si))
  console.log(si)
  expect(si.bestScore).toBeGreaterThan(0)
})
