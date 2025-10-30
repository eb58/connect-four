const BitSet64 = require('./bitset64')

const range = (n) => [...Array(n).keys()]
const [COLS, ROWS] = [7, 6]


/* layout
   0  1  2  3  4  5  6
   7  8  9 10 11 12 13
  14 15 16 17 18 19 20
  21 22 23 24 25 26 27
  28 29 30 31 32 33 34
  35 36 37 38 39 40 41
 */

const computeWinningRows = (p, dr, dc) => {
  let { r, c } = p
  const row = []
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && row.length < 4) {
    row.push(c + COLS * r)
    c += dc
    r += dr
  }
  return row.length < 4 ? [] : [row]
}

// winning rows - length should be 69 for DIM (7x6)
const cfWinningRows = range(ROWS)
  .reduce((acc, r) => [...acc, ...range(COLS).map((c) => ({ r, c }))], [])
  .reduce((acc, p) => [...acc, ...computeWinningRows(p, 0, 1), ...computeWinningRows(p, 1, 1), ...computeWinningRows(p, 1, 0), ...computeWinningRows(p, -1, 1)], [])

const winningRowsBS = cfWinningRows.map((x) => new BitSet64(x))
const winningRowsForFields = range(COLS * ROWS).map((i) => cfWinningRows.reduce((acc, wr, j) => (wr.includes(i) ? [...acc, j] : acc), []))
// console.log(winningRowsForFields)
if (typeof module !== 'undefined') module.exports = { cfWinningRows, winningRowsBS, winningRowsForFields }
