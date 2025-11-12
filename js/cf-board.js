COLS = 7
ROWS = 6
const pieceKeys = [
  227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957,
  1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671,
  901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931,
  311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967,
  398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066,
  1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180
]

class Board {
  Player = { ai: 0, hp: 1 } // AI / human player
  heightCols

  init(player = this.Player.ai) {
    this.heightCols = new Uint32Array(COLS)
    this.currentPlayer = player
    this.cntMoves = 0
    this.bitboards = [new Uint32Array(2), new Uint32Array(2)]
    this.hash = 0
  }

  constructor(FEN = '') {
    this.init()
    this.FEN = FEN
    const moves = FEN.trim().split('')
    moves.forEach((c) => this.doMove(c - 1))
  }

  doMove = (c) => {
    const idx = c + COLS * this.heightCols[c]
    this.hash ^= pieceKeys[this.currentPlayer ? idx : idx + 42]
    this.bitboards[this.currentPlayer][idx < 32 ? 0 : 1] |= 1 << (idx < 32 ? idx : idx - 32)
    this.heightCols[c]++
    this.currentPlayer = 1 - this.currentPlayer
    this.cntMoves++
  }

  undoMove = (c) => {
    this.cntMoves--
    this.currentPlayer = 1 - this.currentPlayer
    --this.heightCols[c]
    const idx = c + COLS * this.heightCols[c]
    this.bitboards[this.currentPlayer][idx < 32 ? 0 : 1] &= ~(1 << (idx < 32 ? idx : idx - 32))
    this.hash ^= pieceKeys[this.currentPlayer ? idx : idx + 42]
  }

  checkWinForColumn = (c) => this.checkWinning(c, this.heightCols[c], this.currentPlayer)

  checkWinning = (col, row, player) => {
    const bb = this.bitboards[player]
    const bbLo = bb[0]
    const bbHi = bb[1]
    const has = (idx) => (idx < 32 ? bbLo & (1 << idx) : bbHi & (1 << (idx - 32)))

    // vertical
    for (let count = 1, r = row - 1; r >= 0 && has(r * COLS + col); r--) if (++count >= 4) return true

    // horizontal
    let count = 1
    for (let c = col - 1; c >= 0 && has(row * COLS + c); c--) if (++count >= 4) return true
    for (let c = col + 1; c < COLS && has(row * COLS + c); c++) if (++count >= 4) return true

    // diagonal \
    count = 1
    for (let r = row - 1, c = col - 1; c >= 0 && r >= 0 && has(r * COLS + c); r--, c--) if (++count >= 4) return true
    for (let r = row + 1, c = col + 1; c < COLS && r < ROWS && has(r * COLS + c); r++, c++) if (++count >= 4) return true

    // diagonal /
    count = 1
    for (let r = row - 1, c = col + 1; c < COLS && r >= 0 && has(r * COLS + c); r--, c++) if (++count >= 4) return true
    for (let r = row + 1, c = col - 1; c >= 0 && r < ROWS && has(r * COLS + c); r++, c--) if (++count >= 4) return true

    return false
  }

  print = () => {
    const has = (bb, idx) => (idx < 32 ? bb[0] & (1 << idx) : bb[1] & (1 << (idx - 32)))

    let res = ''
    for (let r = ROWS - 1; r >= 0; r--) {
      let row = ''
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c
        if (has(this.bitboards[0], idx)) row += ' X '
        else if (has(this.bitboards[1], idx)) row += ' O '
        else row += ' _ '
      }
      res += row + '\n'
    }
    console.log('FEN:', this.FEN, '\n', res.trim())
  }
}

if (typeof module !== 'undefined') module.exports = Board
