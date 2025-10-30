const { winningRowsBS, winningRowsForFields } = require('../js/cf-winning-rows.js')
describe('winning rows ', () => {
  test('winningRowsBS', () => {
    expect(winningRowsBS.length).toBe(69)
  })
  test('winningRowsForFields', () => {
    expect(winningRowsForFields.length).toBe(42)
    expect(winningRowsForFields[0]).toEqual([0,1,2])
    expect(winningRowsBS[0].toArray()).toEqual([0,1,2,3])
    expect(winningRowsBS[1].toArray()).toEqual([0,8,16,24])
  })

})
