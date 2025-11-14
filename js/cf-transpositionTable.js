export const TT_FLAGS = { exact: 1, lower_bound: 2, upper_bound: 3 }

const getTTSizeForDepth = (depth) => (1 << (depth >= 38 ? 28 : depth >= 36 ? 26 : depth >= 18 ? 23 : 16)) - 1

const XXgetTTSizeForDepth = (depth) => {
  if (depth >= 38) return (1 << 28) - 1
  if (depth >= 36) return (1 << 26) - 1
  if (depth >= 32) return (1 << 25) - 1
  if (depth >= 28) return (1 << 24) - 1
  if (depth >= 24) return (1 << 23) - 1
  if (depth >= 18) return (1 << 22) - 1
  return (1 << 16) - 1
}

export class TranspositionTable {
  constructor(depth) {
    const size = getTTSizeForDepth(depth)
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
    return score
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

if (typeof module !== 'undefined') module.exports = { TT_FLAGS, TranspositionTable }