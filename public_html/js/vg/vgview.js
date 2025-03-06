const vgview = (cfEngine, divId) => {
        const gameSettings = JSON.parse(localStorage.getItem('connect-4-settings') || 'false') || {
            beginner: cfEngine.Player.red,
            maxThinkingTime: 100
        };

        let thinking = false;
        let moves = []

        const myAlert = msg => $('<div></div').dialog({title: 'Meldung'}).text(msg).dialog("open");
        const confirm = function (title, question, callbackYes, callbackNo) {
            question = question || '';
            if (!callbackYes) throw new Error('confirm: please provide callback!');
            $("<div id='dlgConfirm'></div>").dialog({
                open: () => $('#dlgConfirm').parent().css('font-size', '12px'),
                close: function () {
                    $(this).dialog("destroy");
                },
                buttons: {
                    "Ja": function () {
                        callbackYes && callbackYes();
                        $(this).dialog("close");
                    },
                    "Nein": function () {
                        callbackNo && callbackNo();
                        $(this).dialog("close");
                    }
                },
                title,
                modal: true,
                closeText: 'Schließen'
            }).html('<br>' + question.replace(/\n/g, '<br>'));
        }

        const doMove = (c) => {
            moves.push(c)
            const row = cfEngine.DIM.NROW - cfEngine.getHeightOfCol(c) - 1;
            const cls = cfEngine.side() === cfEngine.Player.red ? 'red' : 'blue';
            $($("#vg tr > td:nth-child(" + (c + 1) + ")")[row]).addClass(cls);
            $("#info").html("Mein letzter Zug:" + (c + 1));
            cfEngine.doMove(c)
        }

        const actAsAI = () => {
            if (cfEngine.isMill() || cfEngine.isDraw()) return
            thinking = true
            setTimeout(() => {
                const sc = cfEngine.searchBestMove(gameSettings)
                thinking = false
                doMove(sc.bestMoves[0].move);
                if (cfEngine.isMill()) myAlert("Bedaure, du hast verloren!");
                else if (cfEngine.isDraw()) myAlert("Gratuliere, du hast ein Remis geschafft!");
            }, 10)
        }

        const onClickHandler = c => {
            return () => {
                if (!cfEngine.isAllowedMove(c)) return;
                doMove(c);
                if (cfEngine.isMill()) myAlert("Gratuliere, du hast gewonnen!");
                else if (cfEngine.isDraw()) myAlert("Gratuliere, du hast ein Remis geschafft!");
                actAsAI()
            };
        }

        const render = () => {
            const table = $('<table id="vg"></table>');
            for (let r = 0; r < cfEngine.DIM.NROW; r++) {
                const row = $('<tr></tr>');
                for (let c = 0; c < cfEngine.DIM.NCOL; c++) row.append($('<td></td>').on('click', onClickHandler(c)));
                table.append(row);
            }
            $(divId).empty().append(table);
            if (gameSettings.beginner === cfEngine.Player.blue) actAsAI()
        }

        const undoMove = () => {
            cfEngine.init(gameSettings.beginner)
            moves = moves.slice(0, -2)
            moves.forEach(m => cfEngine.doMove(m));
            render()
        }

        const newGameDlg = () => confirm('Frage', 'Neues Spiel', 0, () => {
            cfEngine.init(gameSettings.beginner)
            vgView.render(divId)
        });

        return { // Interface
            gameSettings,
            setBeginner: beginner => {
                gameSettings.beginner = beginner;
                localStorage.setItem('connect-4-settings', JSON.stringify({...gameSettings, beginner}))
            },
            setMaxThinkingTime: n => {
                gameSettings.maxThinkingTime = n;
                localStorage.setItem('connect-4-settings', JSON.stringify(gameSettings))
            },
            undoMove,
            render,
            newGameDlg,
        };
    }
;