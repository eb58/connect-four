const BitSet64 = require('../js/bitset64.js')

const a = new BitSet64([5, 10])
const b = new BitSet64([5, 10, 15, 20])
const c = new BitSet64([1, 2])

test('bitset', () => {
  expect(a.isSubsetOf(a)).toBeTruthy()
  expect(a.isSubsetOf(b)).toBeTruthy()
  expect(b.isSubsetOf(a)).toBeFalsy()
  expect(c.isSubsetOf(b)).toBeFalsy()

  expect(new BitSet64().count(b)).toBe(0)
  expect(a.count()).toBe(2)
  expect(b.count()).toBe(4)
  expect(c.count()).toBe(2)

  expect(c.toBigInt()).toEqual(3n)
  expect(c.toArray()).toEqual([1, 2])
  expect(c.toString()).toEqual('[1, 2]')
})
