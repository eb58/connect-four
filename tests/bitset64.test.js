const BitSet64 = require('../js/bitset64.js')

const a = new BitSet64([5, 10])
const b = new BitSet64([5, 10, 15, 20])
const c = new BitSet64([1, 2])

describe('bitset64', () => {
  test('isSubsetOf', () => {
    expect(a.isSubsetOf(a)).toBeTruthy()
    expect(a.isSubsetOf(b)).toBeTruthy()
    expect(b.isSubsetOf(a)).toBeFalsy()
    expect(c.isSubsetOf(b)).toBeFalsy()
  })

  test('count', () => {
    expect(new BitSet64().count(b)).toBe(0)
    expect(a.count()).toBe(2)
    expect(b.count()).toBe(4)
    expect(c.count()).toBe(2)
  })

  test('toArray ...', () => {
    expect(c.toBigInt()).toEqual(3n)
    expect(c.toArray()).toEqual([1, 2])
    expect(c.toString()).toEqual('[1, 2]')
  })

  test('clear', () => {
    const bs = new BitSet64([5, 10, 15, 20])
    bs.clear(1)
    expect(bs).toEqual(bs)
    bs.clear(5)
    expect(bs.count()).toBe(3)
  })

})
