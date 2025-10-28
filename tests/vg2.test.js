const fs = require('fs')
const path = require('path')
const { findBestMove, initGame } = require('../js/vg2-engine')

const readData = (fileName) => {
  const content = fs.readFileSync(path.join(__dirname, fileName), 'utf-8')
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

describe('Test_L1_R1', () => {
  readData('Test_L1_R1')
    .slice(0, 1000)
    .forEach(({ input, expected }, index) => {
      test(`Test ${index + 1}: ${input} ->  ${expected}`, () => {
        const si = findBestMove(initGame(input), 14)
        // console.log('FEN:', input, JSON.stringify(si))
        expect(si.score).toBe(expected)
      })
    })
})
