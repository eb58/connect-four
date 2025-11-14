import { BitSet64 } from '../js/bitset64.js'

const a = new BitSet64([5, 10])
const b = new BitSet64([5, 10, 15, 20])
const c = new BitSet64([0, 1, 2])

describe('bitset64', () => {
  test('has ', () => {
    expect(c.has(0)).toBeTruthy()
    expect(c.has(1)).toBeTruthy()
    expect(c.has(2)).toBeTruthy()
    expect(c.has(3)).toBeFalsy()
  })
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
    expect(c.count()).toBe(3)
    expect(new BitSet64([0, 1, 2]).count()).toBe(3)
  })

  test('toArray ...', () => {
    expect(c.toBigInt()).toEqual(7n)
    expect(c.toArray()).toEqual([0, 1, 2])
    expect(c.toString()).toEqual('[0, 1, 2]')
  })

  test('clear', () => {
    expect(new BitSet64([0, 1, 2]).toArray()).toEqual([0, 1, 2])
    const bs = new BitSet64([0, 5, 10, 15, 20])
    bs.clear(0)
    expect(bs).toEqual(bs)
    bs.clear(0)
    expect(bs.count()).toBe(4)
  })
})
