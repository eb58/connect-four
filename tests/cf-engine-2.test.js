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

const testData = (fileName, depth = 30) => {
  readData(fileName).slice(0,200).forEach(({ input, expected }, index) => {
    test(`Test ${index + 1}: ${input} ->  ${expected}`, () => {
      const si = findBestMove(initGame(input), depth)
      // console.log('FEN:', input, JSON.stringify(si))
      const score = si.score === -0 ? 0 : si.score
      expect(score).toBe(expected)
    })
  })
}

describe('Test_L1_R1', () => testData('Test_L1_R1')) // ~4.5 sec
xdescribe('Test_L1_R2', () => testData('Test_L1_R2'))
xdescribe('Test_L1_R3', () => testData('Test_L1_R3'))

describe('Test_L2_R1', () => testData('Test_L2_R1')) // ~ 1 sec
xdescribe('Test_L2_R2', () => testData('Test_L2_R2')) // ~ 6 min

describe('Test_L3_R1', () => testData('Test_L3_R1')) // ~0.5 sec

test('simple', ()=> {
  // const si = findBestMove(initGame('22144426444'), 3)
  const b = initGame('22144426444775')
  b.printBoard()
  console.log(b.checkWin())
  // expect(si.move).toBe(5)
  //console.log( si)
})