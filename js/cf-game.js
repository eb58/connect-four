const cfGame = (cfEngine, divId) => {
  const gameSettings = JSON.parse(localStorage.getItem('connect-4-settings') || 'false') || {
    startingPlayer: '' + cfEngine.Player.ai,
    maxThinkingTime: 1000
  }

  let thinking = false
  let moveHistory = []

  const infoStr = (sc) => {
    const scores = cfEngine.movesStr(sc.bestMoves)
    const side = moveHistory[0]?.side === cfEngine.Player.ai ? 'ai' : 'hp'
    const fen = `${side}|${moveHistory
      .map((x) => x.move)
      .join('')
      .trim()}`
    return `DEPTH:${sc.depth} { ${scores} } NODES:${sc.nodes} ${sc.elapsedTime}ms FEN:${fen} ${sc.CACHE.info()}`
  }

  const myAlert = (msg) =>
    $('<div id="alert"></div')
      .dialog({
        open: () => $('#alert').parent().css('font-size', '24px'),
        title: 'Meldung',
        buttons: {
          OK: function () {
            $(this).dialog('close')
          }
        },
        close: function () {
          $(this).dialog('destroy')
        }
      })
      .text(msg)
      .dialog('open')

  const confirm = (title, question, callbackYes, callbackNo) => {
    question = question || ''
    if (!callbackYes) throw new Error('confirm: please provide callback!')
    $("<div id='dlgConfirm'></div>")
      .dialog({
        open: () => $('#dlgConfirm').parent().css('font-size', '24px'),
        close: function () {
          $(this).dialog('destroy')
        },
        buttons: {
          Ja: function () {
            callbackYes && callbackYes()
            $(this).dialog('close')
          },
          Nein: function () {
            callbackNo && callbackNo()
            $(this).dialog('close')
          }
        },
        title,
        modal: true,
        closeText: 'Schließen'
      })
      .html('<br>' + question.replace(/\n/g, '<br>'))
  }

  const newGameDlg = () =>
    confirm('Frage', 'Neues Spiel', () => {
      $('#info').text('')
      moveHistory = []
      cfEngine.init(Number(gameSettings.startingPlayer))
      renderBoard(divId)
      if (cfEngine.side() === cfEngine.Player.ai) actAsAI()
    })

  const onClickHandler = (m) => {
    return () => {
      if (thinking || !cfEngine.isAllowedMove(m)) return
      doMove(m)
      $('#info').text('Dein letzter Zug:' + m)
      if (cfEngine.isMill()) myAlert('Gratuliere, du hast gewonnen!')
      if (cfEngine.isDraw()) myAlert('Gratuliere, du hast ein Remis geschafft!')
      actAsAI()
    }
  }

  const renderBoard = () => {
    const table = $('<table id="cf"></table>')
    for (let r = 0; r < cfEngine.NROW; r++) {
      const row = $('<tr></tr>')
      for (let c = 0; c < cfEngine.NCOL; c++) row.append($('<td></td>').on('click', onClickHandler(c + 1)))
      table.append(row)
    }
    $(divId).empty().append(table)
  }

  const doMove = (move) => {
    if (!cfEngine.isAllowedMove(move)) return
    moveHistory.push({ move, side: cfEngine.side() })
    const row = cfEngine.NROW - cfEngine.getHeightOfCol(move - 1) - 1
    const cls = cfEngine.side() === cfEngine.Player.ai ? 'blue' : 'red'
    $($('#cf tr > td:nth-child(' + move + ')')[row]).addClass(cls)
    cfEngine.doMove(move - 1)
  }

  const undoMove = () => {
    if (thinking || moveHistory.length < 2) return
    const moves = moveHistory.slice(0, -2).map((m) => m.move)
    restart(moveHistory[0].side, moves)
  }

  const actAsAI = () => {
    if (cfEngine.isMill() || cfEngine.isDraw()) return
    thinking = true
    $('body').css('cursor', 'progress')
    setTimeout(() => {
      const sc = cfEngine.searchBestMove(gameSettings)
      thinking = false
      $('body').css('cursor', 'default')
      // $.ajax(`https://ludolab.net/solve/connect4?position=${moveHistory.map(m => m.move).join('')}&level=10`).done(res => console.log(res))
      console.log(infoStr(sc))
      doMove(sc.bestMoves[0].move)
      $('#info').text('Mein letzter Zug:' + sc.bestMoves[0].move)
      if (cfEngine.isMill()) myAlert('Bedaure, du hast verloren!')
      if (cfEngine.isDraw()) myAlert('Gratuliere, du hast ein Remis geschafft!')
    }, 10)
  }

  const restart = (side, moves) => {
    moveHistory = []
    renderBoard()
    cfEngine.init(side)
    moves.forEach((m) => doMove(m))
    if (cfEngine.side() === cfEngine.Player.ai) actAsAI()
    else $('#info').text(moves.length === 0 ? '' : 'Mein letzter Zug:' + moves[moves.length - 1])
  }

  const restartFromFEN = (fen) =>
    game.restart(
      Number(gameSettings.startingPlayer),
      fen.split('').map((x) => +x)
    )

  return {
    // Interface
    undoMove,
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
