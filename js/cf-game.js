const cfGame = (cfEngine, divId) => {
  const gameSettings = JSON.parse(localStorage.getItem('connect-4-settings') || 'false') || {
    startingPlayer: '' + cfEngine.Player.ai,
    maxThinkingTime: 1000
  }

  let thinking = false
  let moveHistory = []

  const newGameDlg = () => {
    $('#info').text('')
    moveHistory = []
    cfEngine.init(Number(gameSettings.startingPlayer))
    renderBoard(divId)
    if (cfEngine.currentPlayer() === cfEngine.Player.ai) actAsAI()
  }

  const onClickHandler = (m) => {
    return () => {
      if (thinking || !isAllowedMove(m)) return
      doMoveGUI(m)
      $('#info').text('Dein letzter Zug:' + m)
      if (isMill()) alert('Gratuliere, du hast gewonnen!')
      if (isDraw()) alert('Gratuliere, du hast ein Remis geschafft!')
      actAsAI()
    }
  }

  const renderBoard = () => {
    const table = $('<table id="cf"></table>')
    for (let r = 0; r < cfEngine.ROWS; r++) {
      const row = $('<tr></tr>')
      for (let c = 0; c < cfEngine.COLS; c++) row.append($('<td></td>').on('click', onClickHandler(c)))
      table.append(row)
    }
    $(divId).empty().append(table)
  }

  const doMoveGUI = (move) => {
    if (!isAllowedMove(move)) return
    moveHistory.push({ move, currentPlayer: cfEngine.currentPlayer() })
    const row = cfEngine.ROWS - cfEngine.getHeightOfCol(move) - 1
    const cls = cfEngine.currentPlayer() === cfEngine.Player.ai ? 'blue' : 'red'
    $($('#cf tr > td:nth-child(' + (move + 1) + ')')[row]).addClass(cls)
    cfEngine.doMove(move)
  }

  const undoMoveGUI = () => {
    if (thinking || moveHistory.length < 2) return
    const moves = moveHistory.slice(0, -2).map((m) => m.move + 1)
    restart(moveHistory[0].currentPlayer, moves)
  }

  const actAsAI = () => {
    if (isMill() || isDraw()) return
    thinking = true
    $('body').css('cursor', 'progress')
    setTimeout(() => {
      const sc = cfEngine.findBestMove(gameSettings)
      thinking = false
      $('body').css('cursor', 'default')
      // $.ajax(`https://ludolab.net/solve/connect4?position=${moveHistory.map(m => m.move).join('')}&level=10`).done(res => console.log(res))
      console.log(cfEngine.infoStr(sc))
      doMoveGUI(sc.bestMoves[0].move)
      $('#info').text('Mein letzter Zug:' + (sc.bestMoves[0].move + 1))
      if (isMill()) alert('Bedaure, du hast verloren!')
      if (isDraw()) alert('Gratuliere, du hast ein Remis geschafft!')
    }, 10)
  }

  const restart = (currentPlayer, moves) => {
    moveHistory = []
    renderBoard()
    cfEngine.init(currentPlayer)
    moves.forEach((m) => doMoveGUI(m - 1))
    if (cfEngine.currentPlayer() === cfEngine.Player.ai) actAsAI()
    else $('#info').text(moves.length === 0 ? '' : 'Mein letzter Zug:' + moves[moves.length - 1])
  }

  const restartFromFEN = (fen) =>
    game.restart(
      Number(gameSettings.startingPlayer),
      fen.split('').map((x) => +x)
    )

  const isMill = () => moveHistory.length > 5 &&  cfEngine.checkWinningBoard(moveHistory[moveHistory.length - 1].move)
  const isAllowedMove = (c) => cfEngine.getHeightOfCol(c) < cfEngine.ROWS && !isMill()
  const isDraw = () => cfEngine.isDraw() && !isMill()

  return {
    undoMoveGUI,
    renderBoard,
    newGameDlg,
    actAsAI,
    restart,
    restartFromFEN,
    gameSettings,
    setStartingPlayer: (startingPlayer) => {
      gameSettings.startingPlayer = startingPlayer
      localStorage.setItem('connect-4-settings', JSON.stringify(gameSettings))
    },
    setMaxThinkingTime: (n) => {
      gameSettings.maxThinkingTime = n
      localStorage.setItem('connect-4-settings', JSON.stringify(gameSettings))
    }
  }
}
