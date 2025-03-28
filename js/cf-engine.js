const cfEngine = (() => {
    const range = n => [...Array(n).keys()]

    const NCOL = 7, NROW = 6;
    const MAXVAL = 1000000
    const Player = {blue: 1, red: 2} // AI / human player

    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    const cache = (insertCondition = _ => true, c = {}, cnt = 0) => ({
        add: (key, val, ...args) => {
            if (insertCondition(val, ...args)) {
                cnt++ > 10000000 && (c = {}, cnt = 0)
                c[key] = val;
            }
            return val
        },
        get: key => c[key],
        clear: () => (cnt = 0, c = {}),
        info: (s = "") => `${s}CACHE:${cnt}`
    })
    const CACHE = cache(score => score >= MAXVAL - 50);
    const memoize = (f, hash, c = CACHE) => (...args) => {
        const h = hash(...args);
        const val = c.get(h);
        return val !== undefined ? val : c.add(h, f(...args), ...args);
    }
    const decorator = (f, preCondition) => (...args) => preCondition() ? f(...args) : 0;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    const computeWinningRows = (r, c, dr, dc) => { // dr = delta row,  dc = delta col
        const row = [];
        const startRow = NROW - r;
        while (r >= 0 && r < NROW && c >= 0 && c < NCOL && row.length < 4) {
            row.push(c + NCOL * r);
            c += dc;
            r += dr;
        }
        return row.length < 4 ? [] : [{row, val: (dc === 0) ? 1 : (dr !== 0 ? 4 : 8) * startRow}];
    }

    // winning rows - length should be 69 for DIM (7x6)
    const winningRows = range(NROW).reduce((acc, r) => range(NCOL).reduce((acc, c) => [...acc, ...computeWinningRows(r, c, 0, 1), ...computeWinningRows(r, c, 1, 1), ...computeWinningRows(r, c, 1, 0), ...computeWinningRows(r, c, -1, 1)], acc), [])

    // list of indices on allWinningRows for each field of board
    const winningRowsForFields = range(NCOL * NROW).map(i => winningRows.reduce((acc, wr, j) => wr.row.includes(i) ? [...acc, j] : acc, []))

    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    /*
    const rand8 = () => Math.floor((Math.random() * 255) + 1)
    const rand32 = () => rand8() << 23 | rand8() << 16 | rand8() << 8 | rand8();
    const sideKeys = [rand32(), rand32()]
    const pieceKeys = range(84).map(() => rand32())
    */
    const sideKeys = [127938607, 1048855538]
    const pieceKeys = [227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957, 1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671, 901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931, 311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967, 398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066, 1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180]
    // const depthKeys = [1758967917, 718139762, 599926627, 650865728, 1586396712, 1782662420, 947332973, 1537310969, 2091968569, 520821438, 1091636741, 480534841, 1638898615, 1191015330, 592667051, 1457963343, 599725227, 148869387, 160880863, 1198590643, 1799390986, 949983034, 1317634541, 2147246616, 867581533, 1022483365, 313338055, 59287621, 242904474, 617414302, 1958932874, 533475771, 935252991, 1602497453, 802356063, 1165613603, 109338219, 997620137, 1003434881, 1718908081, 1589823369, 1072886307]

////////////////////////////////////////////////////////////////////////////////////////////////////////

    const state = {}  // state that is used for evaluating

    const init = (player = Player.blue) => {
        state.heightCols = range(NCOL).map(() => 0)
        state.wrCounterRed = winningRows.map(() => 0)
        state.wrCounterBlue = winningRows.map(() => 0)
        state.side = player
        state.isMill = false
        state.cntMoves = 0
        state.hash = 0
    }

    const doMove = (c) => {
        const idxBoard = c + NCOL * state.heightCols[c]
        state.heightCols[c]++;
        state.side = state.side === Player.red ? Player.blue : Player.red;
        const counters = state.side === Player.blue ? state.wrCounterBlue : state.wrCounterRed;
        winningRowsForFields[idxBoard].forEach(i => {
            ++counters[i]
            state.isMill |= counters[i] >= 4
        })
        // state.isMill = winningRowsForFields[idxBoard].some(i => counters[i] >= 4)
        state.hash ^= pieceKeys[idxBoard * state.side] ^ sideKeys[state.side];
        state.cntMoves++
    }

    const undoMove = (c) => {
        --state.heightCols[c];
        state.cntMoves--
        const idxBoard = c + NCOL * state.heightCols[c]
        state.hash ^= pieceKeys[idxBoard * state.side] ^ sideKeys[state.side];
        const counters = state.side === Player.blue ? state.wrCounterBlue : state.wrCounterRed;
        winningRowsForFields[idxBoard].forEach((i) => counters[i]--)
        state.side = state.side === Player.red ? Player.blue : Player.red;
        state.isMill = false
    }

    const isWinningMove = (m, side) => {
        const counters = side === Player.red ? state.wrCounterBlue : state.wrCounterRed;
        return winningRowsForFields[m + NCOL * state.heightCols[m]].some(i => counters[i] === 3)
    }

    const _computeScore = () => {
        const x = winningRows.reduce((res, wr, i) => res + (state.wrCounterRed[i] !== 0 && state.wrCounterBlue[i] !== 0 ? 0 : (state.wrCounterBlue[i] - state.wrCounterRed[i])) * wr.val, 0)
        return state.side === Player.blue ? -x : x
    }
    let computeScore = _computeScore

    let negamax = (depth, maxDepth, alpha, beta, moves) => {
        if (state.isMill) return -MAXVAL + depth
        if (depth === maxDepth) return computeScore();
        if (state.cntMoves === 42) return 0
        for (const m of moves) if (state.heightCols[m] < NROW && (isWinningMove(m, state.side))) return MAXVAL - depth - 1
        for (const m of moves) if (state.heightCols[m] < NROW) {
            doMove(m)
            const score = -negamax(depth + 1, maxDepth, -beta, -alpha, moves)
            undoMove(m)
            if (score > alpha) alpha = score;
            if (alpha >= beta) return alpha;
        }
        return alpha;
    }
    negamax = decorator(negamax, () => ++searchInfo.nodes & 65535 || !timeOut())
    negamax = memoize(negamax, () => state.hash);
    // negamax = memoize(negamax, (s, depth, maxDepth) => s.hash ^ depthKeys[maxDepth], CACHE2);

    const searchInfo = {nodes: 0, stopAt: 0, depth: 0, bestMoves: []}
    const timeOut = () => Date.now() >= searchInfo.stopAt

    const _searchBestMove = (maxThinkingTime, maxDepth, compScore) => {
        computeScore = compScore
        CACHE.clear()
        searchInfo.nodes = 0
        searchInfo.startAt = Date.now()
        searchInfo.stopAt = searchInfo.startAt + maxThinkingTime;
        const moves = [3, 4, 2, 5, 1, 6, 0].filter(c => state.heightCols[c] < NROW);
        for (const depth of [1, ...range(Math.floor((maxDepth + 1) / 2)).map(x => 2 * (x + 1))]) {
            searchInfo.depth = depth
            searchInfo.bestMoves = []
            for (const m of moves) {
                doMove(m)
                const score = -negamax(0, depth, -MAXVAL, +MAXVAL, moves)
                searchInfo.bestMoves.push({move: m, score});
                undoMove(m)
                if (score > MAXVAL - 50 || timeOut()) break
            }
            if (timeOut()) break;
            if (searchInfo.bestMoves.every((m) => m.score < -MAXVAL + 50) ||           // all moves lead to disaster
                searchInfo.bestMoves.filter((m) => m.score > -MAXVAL + 50).length === 1 // all moves but one lead to disaster
            ) break;
        }
        searchInfo.bestMoves.sort((a, b) => b.score - a.score)
        // console.log(`DEPTH:${searchInfo.depth} { ${searchInfo.bestMoves.reduce((acc, m) => acc + `${m.move}:${m.score} `, '')}} NODES:${searchInfo.nodes} ${Date.now() - searchInfo.startAt + 'ms'} ${CACHE.info()}`)
        return searchInfo;
    }

    const searchBestMove = (opts) => {
        opts = {maxThinkingTime: 1000, maxDepth: 42, ...opts}
        // 1: look as far possible if we can find a winning move
        const sc = _searchBestMove(opts.maxThinkingTime / 2, opts.maxDepth, () => 0)
        if (sc.bestMoves.length === 0 || sc.bestMoves[0].score > MAXVAL - 50) return sc;
        // 2:  look for best move with better evaluating function
        return _searchBestMove(opts.maxThinkingTime / 2, opts.maxDepth, _computeScore)
    }

    const initGame = (fen) => {
        init(fen.trim().split('|')[0] === 'blue' ? Player.blue : Player.red)
        fen.trim().split('|')[1].split('').map(x => +x).forEach(v => doMove(v));
    }

    init();
    return {
        CACHE, winningRows, winningRowsForFields, NCOL, NROW, MAXVAL, Player,
        init, initGame, doMove, searchBestMove,
        isAllowedMove: c => state.heightCols[c] < NROW && !state.isMill && state.cntMoves !== NROW * NCOL,
        getHeightOfCol: c => state.heightCols[c],
        side: () => state.side,
        isMill: () => state.isMill,
        isDraw: () => state.cntMoves === NROW * NCOL && !state.isMill,
    }
})()

if (typeof module !== 'undefined') module.exports = cfEngine;