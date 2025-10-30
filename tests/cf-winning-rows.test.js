const { winningRowsBS, winningRowsForFields } = require('../js/cf-winning-rows.js')
describe('winning rows ', () => {
  test('winningRowsBS', () => {
    expect(winningRowsBS.length).toBe(69)
  })
  test('winningRowsForFields', () => {
    expect(winningRowsForFields.length).toBe(42)
    expect(winningRowsForFields[0].length).toBe(3)
    expect(winningRowsForFields[0]).toEqual([0, 1, 2])
    expect(winningRowsForFields[0].map((i) => winningRowsBS[i].toArray())).toEqual([
      [0, 1, 2, 3],
      [0, 8, 16, 24],
      [0, 7, 14, 21]
    ])

    expect(winningRowsForFields[6].length).toBe(3)
    expect(winningRowsForFields[6].map((i) => winningRowsBS[i].toArray())).toEqual([
      [3, 4, 5, 6],
      [6, 13, 20, 27],
      [6, 12, 18, 24]
    ])
  })
})
