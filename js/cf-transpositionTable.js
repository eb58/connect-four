export const TT_FLAGS = { exact: 1, lower_bound: 2, upper_bound: 3 }
const getTTSizeForDepth = (depth) => (1 << (depth >= 38 ? 28 : depth >= 36 ? 26 : depth >= 18 ? 23 : 16)) - 1

export class TranspositionTable {
  constructor(depth) {
    this.size = getTTSizeForDepth(depth)
    this.keys = new Uint32Array(this.size)
    this.scores = new Int8Array(this.size)
    this.depths = new Int8Array(this.size)
    this.flags = new Int8Array(this.size)
  }
  store(hash, depth, score, flag) {
    score = score === -0 ? 0 : score
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
