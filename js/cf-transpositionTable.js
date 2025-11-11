const TT_FLAGS = { exact: 1, lower_bound: 2, upper_bound: 3 }

// const getTTSizeForDepth = (depth) => (1 << (depth >= 38 ? 28 : depth >= 36 ? 26 : depth >= 18 ? 23 : 16)) - 1

const getTTSizeForDepth = (depth) => {
  if (depth >= 38) return (1 << 28) - 1
  if (depth >= 36) return (1 << 26) - 1
  if (depth >= 32) return (1 << 25) - 1
  if (depth >= 28) return (1 << 24) - 1
  if (depth >= 24) return (1 << 23) - 1
  if (depth >= 18) return (1 << 22) - 1
  return (1 << 16) - 1
}

class TranspositionTable {
  constructor(size = 8388593) {
    this.size = size
    this.keys = new Uint32Array(size)
    this.scores = new Int16Array(size)
    this.depths = new Int8Array(size)
    this.flags = new Uint8Array(size)
  }
  store(hash, depth, score, flag) {
    this.keys[hash & this.size] = hash
    this.depths[hash & this.size] = depth
    this.scores[hash & this.size] = score
    this.flags[hash & this.size] = flag
  }
  getScore(hash, depth, alpha, beta) {
    if (this.keys[hash & this.size] === hash && this.depths[hash & this.size] >= depth) {
      const score = this.scores[hash & this.size]
      const flag = this.flags[hash & this.size]
      if (flag === TT_FLAGS.exact) return score
      if (flag === TT_FLAGS.lower_bound && score >= beta) return score
      if (flag === TT_FLAGS.upper_bound && score <= alpha) return score
    }
    return null
  }
}

const pieceKeys = [
  227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957,
  1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671,
  901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931,
  311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967,
  398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066,
  1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180
]


if (typeof module !== 'undefined') module.exports = { TT_FLAGS, getTTSizeForDepth, TranspositionTable, pieceKeys }
