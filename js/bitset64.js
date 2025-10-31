const range = (n) => [...Array(n).keys()]

const countBits = (n) => {
  let res = 0
  for (let i = 0; i < 32 && n ; i++, n = n >> 1) if (!!(n & 1)) res++
  return res
}

class BitSet64 {
  constructor(lo, hi) {
    this.lo = 0
    this.hi = 0
    if (Array.isArray(lo)) {
      for (const pos of lo) this.set(pos)
    } else if (typeof lo === 'bigint') {
      this.lo = Number(lo & 0x7fffffffn)
      this.hi = Number((lo >> 31n) & 0x7ffn)
    } else if (typeof lo === 'number') {
      this.lo = lo
      this.hi = hi
    }
  }

  has = (pos) => !!(pos <= 31 ? this.lo & (1 << pos) : this.hi & (1 << (pos - 32)))
  set = (pos) => (pos <= 31 ? (this.lo |= 1 << pos) : (this.hi |= 1 << (pos - 32)))
  clear = (pos) => (pos <= 31 ? (this.lo &= ~(1 << pos)) : (this.hi &= ~(1 << (pos - 32))))
  toggle = (pos) => (pos <= 31 ? (this.lo ^= 1 << pos) : (this.hi ^= 1 << (pos - 32)))

  intersect = (bs) => new BitSet64(this.lo & bs.lo, this.hi & bs.hi)
  union = (bs) => new BitSet64(this.lo | bs.lo, this.hi | bs.hi)
  difference = (bs) => new BitSet64(this.lo & ~bs.lo, this.hi & ~bs.hi)
  symmetricDifference = (bs) => new BitSet64(this.lo ^ bs.lo, this.hi ^ bs.hi)

  equals = (bs) => this.lo === bs.lo && this.hi === bs.hi
  isSubsetOf = (bs) => (this.lo & bs.lo) === this.lo && (this.hi & bs.hi) === this.hi
  count = () => countBits(this.lo) + countBits(this.hi)

  toBigInt = () => (BigInt(this.hi) << 31n) | BigInt(this.lo)
  toArray = () => range(64).reduce((acc, n) => (this.has(n) ? [...acc, n] : acc), [])
  toString = () => `[${this.toArray().join(', ')}]`
}

if (typeof module !== 'undefined') module.exports = BitSet64
