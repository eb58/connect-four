import { Board } from '../js/cf-board'

describe('BOARD', () => {
  test('for debug ', () => {
    expect(new Board('12 12 12').checkWinForColumn(0)).toBe(true)
  })

  test('easy tests ', () => {
    expect(new Board('112233').checkWinForColumn(3)).toBe(true)
    expect(new Board('12 12 12').checkWinForColumn(0)).toBe(true)
  })
})
