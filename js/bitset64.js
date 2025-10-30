const range = (n) => [...Array(n).keys()]

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

  has = (pos) => !!(pos <= 31 ? this.lo & (1 << (pos - 1)) : this.hi & (1 << (pos - 32)))
  set = (pos) => (pos <= 31 ? (this.lo |= 1 << (pos - 1)) : (this.hi |= 1 << (pos - 32)))
  clear = (pos) => (pos <= 31 ? (this.lo &= ~(1 << (pos - 1))) : (this.hi &= ~(1 << (pos - 32))))
  toggle = (pos) => (pos <= 31 ? (this.lo ^= 1 << (pos - 1)) : (this.hi ^= 1 << (pos - 32)))
  intersect = (bs) => new BitSet64(this.lo & bs.lo, this.hi & bs.hi)
  union = (bs) => new BitSet64(this.lo | bs.lo, this.hi | bs.hi)
  equals = (bs) => this.lo === bs.lo && this.hi === bs.hi
  isSubsetOf = (bs) => (this.lo & bs.lo) === this.lo && (this.hi & bs.hi) === this.hi

  count = () => range(64).reduce((acc, n) => acc + this.has(n), 0)
  toBigInt = () => (BigInt(this.hi) << 31n) | BigInt(this.lo)
  toNumber = () => (this.hi << 31) | this.lo
  toArray = () => range(64).reduce((acc, n) => (this.has(n) ? [...acc, n] : acc), [])
  toString = () => `[${this.toArray().join(', ')}]`
}

class BitArray42 {
  // Differenz (in this aber nicht in other)
  difference(other) {
    const result = new BitArray42()
    result.lo = this.lo & ~other.lo
    result.hi = this.hi & ~other.hi
    return result
  }

  // Symmetrische Differenz (XOR)
  symmetricDifference(other) {
    const result = new BitArray42()
    result.lo = this.lo ^ other.lo
    result.hi = this.hi ^ other.hi
    return result
  }

  // Anzahl gesetzter Bits
}

if (typeof module !== 'undefined') module.exports = BitSet64
