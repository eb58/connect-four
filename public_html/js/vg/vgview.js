const vgview = (cfEngine) => {
        let thinking = false;
        let maxThinkingTime = 1000;
        let moves = []
        const myAlert = msg => $('<div></div').dialog({
            title: 'Meldung',
            buttons: {
                OK: function () {
                    $(this).dialog("close");
                }
            },
        }).text(msg).dialog("open");

        const doMove = (c) => {
            moves.push(c)
            cfEngine.doMove(c)
            const row = cfEngine.DIM.NROW - cfEngine.getHeightOfCol(c);
            const cls = cfEngine.side() === 1 ? 'red' : 'blue';
            $($("#vg tr > td:nth-child(" + (c + 1) + ")")[row]).addClass(cls);
            $("#info").html("Mein letzter Zug:" + (c + 1));
        }

        const actAsAI = () => {
            if (cfEngine.isMill() || cfEngine.isDraw()) return
            thinking = true
            setTimeout(() => {
                const sc = cfEngine.searchBestMove({maxThinkingTime})
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

        const render = divId => {
            const table = $('<table id="vg"></table>');
            for (let r = 0; r < cfEngine.DIM.NROW; r++) {
                const row = $('<tr></tr>');
                for (let c = 0; c < cfEngine.DIM.NCOL; c++) row.append($('<td></td>').on('click', onClickHandler(c)));
                table.append(row);
            }
            $(divId).empty().append(table);
            if (cfEngine.side() === cfEngine.Player.blue) actAsAI()
        }

        const undoMove = (beginner) => {
            cfEngine.init(beginner)
            moves = moves.slice(0, -2)
            moves.forEach(m => cfEngine.doMove(m));
        }

        return { // Interface
            setMaxThinkingTime: n => maxThinkingTime = n,
            undoMove,
            render
        };
    }
;