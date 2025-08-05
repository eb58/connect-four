const ROWS = 6
const COLS = 7
const CELL = 100
const MAX_DEPTH = 5
const range = (n) => [...Array(n).keys()]

export default class Game {
  constructor(canvas, statusText) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.statusText = statusText
    this.board = range(ROWS).map(() => range(COLS).fill(0))
    this.currentPlayer = -1
  }

  draw = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.ctx.beginPath()
        this.ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 40, 0, Math.PI * 2)
        this.ctx.fillStyle = this.board[r][c] === 1 ? 'red' : this.board[r][c] === -1 ? 'yellow' : 'white'
        this.ctx.fill()
        this.ctx.stroke()
      }
    }
  }

  handleClick = (e) => {
    if (this.currentPlayer !== -1) return
    const col = Math.floor(e.offsetX / CELL)
    if (!this.generateMoves(this.board).includes(col)) return

    this.board = this.makeMove(this.board, col, this.currentPlayer)
    this.draw()

    const winner = this.checkWinner(this.board)
    if (winner || this.isTerminal(this.board)) {
      this.statusText.innerText = winner ? (winner === 1 ? 'AI Wins!' : 'You Win!') : 'Draw!'
      return
    }

    this.currentPlayer = 1
    this.statusText.innerText = 'AI thinking...'
    setTimeout(() => {
      const aiMove = this.bestMove(this.board, MAX_DEPTH, this.currentPlayer)
      this.board = this.makeMove(this.board, aiMove, this.currentPlayer)
      this.draw()

      const winner = this.checkWinner(this.board)
      if (winner || this.isTerminal(this.board)) {
        this.statusText.innerText = winner ? (winner === 1 ? 'AI Wins!' : 'You Win!') : 'Draw!'
        return
      }

      this.currentPlayer = -1
      this.statusText.innerText = 'Your turn (click a column)'
    }, 500)
  }

  makeMove = (board, col, player) => {
    const newBoard = board.map((row) => [...row])
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === 0) {
        newBoard[r][col] = player
        return newBoard
      }
    }
    return null
  }

  generateMoves = (board) => range(COLS).filter((c) => board[0][c] === 0)

  isTerminal = (board) => this.checkWinner(board) !== 0 || this.generateMoves(board).length === 0

  checkWinner = (board) => {
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ]
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const player = board[r][c]
        if (player === 0) continue
        for (const [dr, dc] of dirs) {
          let win = true
          for (let i = 1; i < 4; i++) {
            const nr = r + dr * i,
              nc = c + dc * i
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) {
              win = false
              break
            }
          }
          if (win) return player
        }
      }
    }
    return 0
  }

  evaluate = (board) => {
    const winner = this.checkWinner(board)
    if (winner === 1) return 100000
    if (winner === -1) return -100000
    return this.scorePosition(board, 1) - this.scorePosition(board, -1)
  }

  scorePosition = (board, player) => {
    let score = 0
    const center = board.map((row) => row[3])
    score += center.filter((c) => c === player).length * 3

    const countLine = (cells) => {
      const count = cells.filter((c) => c === player).length
      const empty = cells.filter((c) => c === 0).length
      if (count === 4) return 100
      if (count === 3 && empty === 1) return 5
      if (count === 2 && empty === 2) return 2
      return 0
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        score += countLine(board[r].slice(c, c + 4))
      }
    }

    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        score += countLine([0, 1, 2, 3].map((i) => board[r + i][c]))
      }
    }

    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        score += countLine([0, 1, 2, 3].map((i) => board[r + i][c + i]))
        score += countLine([0, 1, 2, 3].map((i) => board[r + i][c + 3 - i]))
      }
    }

    return score
  }

  negascout = (board, depth, alpha, beta, player) => {
    if (depth === 0 || this.isTerminal(board)) return this.evaluate(board) * player
    let b = beta
    let best = -Infinity
    let first = true

    for (const move of this.generateMoves(board)) {
      const newBoard = this.makeMove(board, move, player)
      let score
      if (first) {
        score = -this.negascout(newBoard, depth - 1, -b, -alpha, -player)
      } else {
        score = -this.negascout(newBoard, depth - 1, -alpha - 1, -alpha, -player)
        if (alpha < score && score < beta) {
          score = -this.negascout(newBoard, depth - 1, -b, -alpha, -player)
        }
      }
      best = Math.max(best, score)
      alpha = Math.max(alpha, score)
      if (alpha >= beta) break
      b = alpha + 1
      first = false
    }

    return best
  }

  negamax = (board, depth, alpha, beta, player) => {
    if (depth === 0 || this.isTerminal(board)) return this.evaluate(board) * player

    for (const move of this.generateMoves(board)) {
      const newBoard = this.makeMove(board, move, player)
      const score = -this.negamax(newBoard, depth - 1, -beta, -alpha, -player)
      if (score > alpha) alpha = score
      if (alpha >= beta) return alpha
    }
    return alpha
  }

  bestMove = (board, depth, player) => {
    let bestScore = -Infinity
    let best = null
    for (const move of this.generateMoves(board)) {
      const newBoard = this.makeMove(board, move, player)
      const score = -this.negamax(newBoard, depth - 1, -Infinity, Infinity, -player)
      if (score > bestScore) {
        bestScore = score
        best = move
      }
    }
    return best
  }
}
