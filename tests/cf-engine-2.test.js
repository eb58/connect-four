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
        initGame(input)
        const si = findBestMove({ maxThinkingTime: 10000 })
        // console.log('FEN:', input, JSON.stringify(si))
        console.log(`Test ${index + 1}: ${input} ->  ${expected}`, si.bestScore)
        expect(Math.sign(si.bestScore) === Math.sign(expected)).toBeTruthy()
        // expect(Math.sign(si.bestScore) === Math.sign(expected) || (score === 0 && si.bestMoves.slice(1).every((m) => m.score < 0))).toBeTruthy()
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
