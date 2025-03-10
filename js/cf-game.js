const cfGame = (cfEngine, divId) => {
    const gameSettings = JSON.parse(localStorage.getItem('connect-4-settings') || 'false') || {
        beginner: cfEngine.Player.blue, maxThinkingTime: 1000
    };

    let thinking = false;
    let moveHistory = []

    const myAlert = msg => $('<div id="alert"></div').dialog({
        open: () => $('#alert').parent().css('font-size', '24px'),
        title: 'Meldung', buttons: {
            'OK': function () {
                $(this).dialog("close");
            }
        },
        close: function () {
            $(this).dialog("destroy");
        },
    }).text(msg).dialog("open");

    const confirm = (title, question, callbackYes, callbackNo) => {
        question = question || '';
        if (!callbackYes) throw new Error('confirm: please provide callback!');
        $("<div id='dlgConfirm'></div>").dialog({
            open: () => $('#dlgConfirm').parent().css('font-size', '24px'),
            close: function () {
                $(this).dialog("destroy");
            },
            buttons: {
                "Ja": function () {
                    callbackYes && callbackYes();
                    $(this).dialog("close");
                }, "Nein": function () {
                    callbackNo && callbackNo();
                    $(this).dialog("close");
                }
            }, title, modal: true, closeText: 'Schließen'
        }).html('<br>' + question.replace(/\n/g, '<br>'));
    }

    const newGameDlg = () => confirm('Frage', 'Neues Spiel', () => {
        moveHistory = []
        cfEngine.init(gameSettings.beginner)
        renderBoard(divId)
        if (cfEngine.side() === cfEngine.Player.blue) actAsAI()
    });

    const onClickHandler = c => {
        return () => {
            if (thinking || !cfEngine.isAllowedMove(c)) return;
            doMove(c);
            if (cfEngine.isMill()) myAlert("Gratuliere, du hast gewonnen!");
            if (cfEngine.isDraw()) myAlert("Gratuliere, du hast ein Remis geschafft!");
            actAsAI()
        };
    }

    const renderBoard = () => {
        const table = $('<table id="cf"></table>');
        for (let r = 0; r < cfEngine.DIM.NROW; r++) {
            const row = $('<tr></tr>');
            for (let c = 0; c < cfEngine.DIM.NCOL; c++) row.append($('<td></td>').on('click', onClickHandler(c)));
            table.append(row);
        }
        $(divId).empty().append(table);
    }

    const doMove = (c) => {
        if (!cfEngine.isAllowedMove(c)) return;
        moveHistory.push({move: c, side: cfEngine.side()})
        const row = cfEngine.DIM.NROW - cfEngine.getHeightOfCol(c) - 1;
        const cls = cfEngine.side() === cfEngine.Player.red ? 'red' : 'blue';
        $($("#cf tr > td:nth-child(" + (c + 1) + ")")[row]).addClass(cls);
        $("#info").html("Mein letzter Zug:" + (c + 1));
        cfEngine.doMove(c)
    }

    const undoMove = () => {
        if (thinking || moveHistory.length < 2) return
        const moves = moveHistory.slice(0, -2).map(m => m.move)
        restart(moveHistory[0].side, moves)
    }

    const actAsAI = () => {
        if (cfEngine.isMill() || cfEngine.isDraw()) return
        thinking = true
        $("body").css("cursor", "progress");
        setTimeout(() => {
            const sc = cfEngine.searchBestMove(gameSettings)
            thinking = false
            $("body").css("cursor", "default");
            doMove(sc.bestMoves[0].move);
            if (cfEngine.isMill()) myAlert("Bedaure, du hast verloren!");
            if (cfEngine.isDraw()) myAlert("Gratuliere, du hast ein Remis geschafft!");
        }, 10)
    }

    const restart = (side, moves) => {
        moveHistory = [];
        renderBoard();
        console.log("restart", side === cfEngine.Player.red ? 'red' : 'blue');
        cfEngine.init(side)
        moves.forEach(v => doMove(v));
        if (cfEngine.side() === cfEngine.Player.blue) actAsAI()
    }

    const restartFromFEN = (fen) => {
        const x = fen.replace(':', '|').split('|')
        const side = x[0] === 'red' ? cfEngine.Player.red : cfEngine.Player.blue
        game.restart(side, x[1].split('').map(x => +x));
    }

    return { // Interface
        undoMove, renderBoard, newGameDlg, actAsAI, restart, restartFromFEN,
        gameSettings,
        setBeginner: beginner => {
            gameSettings.beginner = beginner;
            localStorage.setItem('connect-4-settings', JSON.stringify({...gameSettings, beginner}))
        }, setMaxThinkingTime: n => {
            gameSettings.maxThinkingTime = n;
            localStorage.setItem('connect-4-settings', JSON.stringify(gameSettings))
        }
    };
}