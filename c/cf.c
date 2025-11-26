#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <time.h>
#include <stdbool.h>

#define MAXVAL 100
#define COLS 7
#define ROWS 6

typedef enum { TT_EXACT = 1, TT_LOWER_BOUND = 2, TT_UPPER_BOUND = 3 } TTFlag;
typedef enum { PLAYER_AI = 0, PLAYER_HP = 1} Player;

typedef struct {
    uint32_t size;
    uint32_t *keys;
    int8_t *scores;
    uint8_t *depths;
    uint8_t *flags;
} TranspositionTable;

typedef struct {
    int heightCols[COLS];
    Player currentPlayer;
    int cntMoves;
    uint64_t bitboards[2];  // [player]
    uint32_t hash;
} Board;

typedef struct {
    uint64_t nodes;
    int depth;
    int score;
    int bestMove;
    long stopAt;
} SearchInfo;

// Timer functions
typedef struct { clock_t start; } Timer;
Timer timer_create() { Timer t; t.start = clock(); return t;}
double timer_elapsed(Timer *t) { return ((double)(clock() - t->start)) / CLOCKS_PER_SEC; }

// Transposition Table functions
uint32_t tt_get_size_for_depth(int depth) {
    if (depth >= 38) return (1ULL << 32) - 1;
    if (depth >= 36) return (1ULL << 28) - 1;
    if (depth >= 18) return (1ULL << 25) - 1;
    return (1ULL << 20) - 1;
}

TranspositionTable* tt_create(int depth) {
    TranspositionTable *tt = malloc(sizeof(TranspositionTable));
    tt->size = tt_get_size_for_depth(depth);
    tt->keys = calloc(tt->size, sizeof(uint32_t));
    tt->scores = calloc(tt->size, sizeof(int8_t));
    tt->depths = calloc(tt->size, sizeof(int8_t));
    tt->flags = calloc(tt->size, sizeof(int8_t));
    return tt;
}

void tt_destroy(TranspositionTable *tt) {
    free(tt->keys);
    free(tt->scores);
    free(tt->depths);
    free(tt->flags);
    free(tt);
}

int8_t tt_store(TranspositionTable *tt, uint32_t hash, uint8_t depth, int8_t score, TTFlag flag) {
    uint32_t idx = hash & tt->size;
    tt->keys[idx] = hash;
    tt->depths[idx] = depth;
    tt->scores[idx] = score;
    tt->flags[idx] = flag;
    return score;
}

bool tt_get_score(TranspositionTable *tt, uint32_t hash, int depth, int alpha, int beta, int8_t *score) {
    uint32_t idx = hash & tt->size;
    if (tt->keys[idx] == hash && tt->depths[idx] >= depth) {
        int8_t s = tt->scores[idx];
        TTFlag flag = tt->flags[idx];
        if (flag == TT_EXACT) { *score = s; return true; }
        if (flag == TT_LOWER_BOUND && s >= beta) { *score = s; return true; }
        if (flag == TT_UPPER_BOUND && s <= alpha) { *score = s; return true; }
    }
    return false;
}

static const uint32_t pieceKeys[84] = {
  227019481, 1754434862, 629481213, 887205851, 529032562, 2067323277, 1070040335, 567190488, 468610655, 1669182959, 236891527, 1211317841, 849223426, 1031915473, 315781957,
  1594703270, 114113554, 966088184, 2114417493, 340442843, 410051610, 1895709998, 502837645, 2046296443, 1720231708, 1437032187, 80592865, 1757570123, 2063094472, 1123905671,
  901800952, 1894943568, 732390329, 401463737, 2055893758, 1688751506, 115630249, 391883254, 249795256, 1341740832, 807352454, 2122692086, 851678180, 1154773536, 64453931,
  311845715, 1173309830, 1855940732, 1662371745, 998042207, 2121332908, 1905657426, 873276463, 1048910740, 1181863470, 136324833, 881754029, 1037297764, 1385633069, 2037058967,
  398045724, 1522858950, 1892619084, 1364648567, 771375215, 983991136, 260316522, 648466817, 1502780386, 1733680598, 401803338, 2136229086, 718267066, 485772484, 1936892066,
  1051148609, 1018878751, 1721684837, 1720651398, 2073094346, 526823540, 1170625524, 465996760, 1587572180
};

// Board functions
void board_init(Board *board, Player player) {
    for( int i = 0; i < COLS; i++) board->heightCols[i] = 0;
    board->currentPlayer = player;
    board->cntMoves = 0;
    board->bitboards[PLAYER_AI] = 0;
    board->bitboards[PLAYER_HP] = 0;
    board->hash = 0;
}

bool has_piece(uint64_t bb, int idx) { return bb & (1ULL << idx);  }

void board_print(Board *board) {
    for (int r = ROWS - 1; r >= 0; r--) {
        for (int c = 0; c < COLS; c++) {
            int idx = r * COLS + c;
            if (has_piece(board->bitboards[PLAYER_AI], idx)) printf(" X ");
            else if (has_piece(board->bitboards[PLAYER_HP], idx)) printf(" O ");
            else printf(" _ ");
        }
        printf("\n");
    }
}

void board_do_move(Board *board, int c) {
    int idx = c + COLS * board->heightCols[c];
    board->hash ^= pieceKeys[board->currentPlayer ? idx : idx + 42];
    board->bitboards[board->currentPlayer] |= (1ULL << idx);

    board->cntMoves++;
    board->currentPlayer = 1 - board->currentPlayer;
    board->heightCols[c]++;
}

void board_undo_move(Board *board, int c) {
    board->cntMoves--;
    board->currentPlayer = 1 - board->currentPlayer;
    board->heightCols[c]--;

    int idx = c + COLS * board->heightCols[c];
    board->hash ^= pieceKeys[board->currentPlayer ? idx : idx + 42];
    board->bitboards[board->currentPlayer] &= ~(1ULL << idx);
}

bool board_check_winning(Board *board, int col, Player player) {
    int row = board->heightCols[col];
    if (row >= ROWS) return false;

    uint64_t bb = board->bitboards[player];

    // Vertical
    int count = 1;
    for (int r = row - 1; r >= 0 && has_piece(bb, r * COLS + col); r--) if (++count >= 4) return true;

    // Horizontal
    count = 1;
    for (int c = col - 1; c >= 0 && has_piece(bb, row * COLS + c); c--) if (++count >= 4) return true;
    for (int c = col + 1; c < COLS && has_piece(bb, row * COLS + c); c++) if (++count >= 4) return true;

    // Diagonal 1
    count = 1;
    for (int r = row - 1, c = col - 1; c >= 0 && r >= 0 && has_piece(bb, r * COLS + c); r--, c--) if (++count >= 4) return true;
    for (int r = row + 1, c = col + 1; c < COLS && r < ROWS && has_piece(bb, r * COLS + c); r++, c++) if (++count >= 4) return true;

    // Diagonal 2
    count = 1;
    for (int r = row - 1, c = col + 1; c < COLS && r >= 0 && has_piece(bb, r * COLS + c); r--, c++) if (++count >= 4) return true;
    for (int r = row + 1, c = col - 1; c >= 0 && r < ROWS && has_piece(bb, r * COLS + c); r++, c--) if (++count >= 4) return true;

    return false;
}

bool board_check_win_for_column(Board *board, int c) { return board_check_winning(board, c, board->currentPlayer); }

Board* board_create(const char *fen) {
    Board *board = malloc(sizeof(Board));
    board_init(board, PLAYER_AI);
    if (!fen || strlen(fen) == 0) return board;
    for (int i = 0; fen[i] != '\0'; i++) if (fen[i] >= '1' && fen[i] <= '7') {
        int c = fen[i] - '1';
        if (c >= 0 && c < COLS) board_do_move(board, c);
    }
    return board;
}

void board_destroy(Board *board) { free(board); }

int8_t negamax(Board *board, TranspositionTable *tt, SearchInfo *info,  int *columns, int numCols, uint8_t depth, int8_t alpha, int8_t beta) {
    info->nodes++;

    if (depth == 0 || board->cntMoves == 42) return 0;

    int8_t cachedScore;
    if (tt_get_score(tt, board->hash, depth, alpha, beta, &cachedScore)) return cachedScore;

    for (int i = 0; i < numCols; i++) if (board_check_win_for_column(board, columns[i])) {
        info->bestMove = columns[i];
        return tt_store(tt, board->hash, depth, MAXVAL, TT_EXACT);
    }

    for (int i = 0; i < numCols; i++) if (board->heightCols[columns[i]] < ROWS) {
        board_do_move(board, columns[i]);
        int8_t score = -negamax(board, tt, info, columns, numCols, depth - 1, -beta, -alpha);
        board_undo_move(board, columns[i]);
        if (score > alpha) { alpha = score; info->bestMove = columns[i]; }
        if (alpha >= beta) return tt_store(tt, board->hash, depth, alpha, TT_LOWER_BOUND);
    }
    return tt_store(tt, board->hash, depth, alpha, TT_UPPER_BOUND);
}

SearchInfo find_best_move(Board *board, int maxThinkingTime) {
    Timer timer = timer_create();
    SearchInfo info = {};
    info.stopAt = (long)(clock() + maxThinkingTime * CLOCKS_PER_SEC / 1000);

    const int COLUMNS[COLS] = {3, 2, 4, 1, 5, 0, 6};
    int columns[COLS];
    int numCols = 0;
    for (int i = 0; i < COLS; i++) if (board->heightCols[COLUMNS[i]] < ROWS) columns[numCols++] = COLUMNS[i];

    for (uint8_t depth = 42; depth <= 42 - board->cntMoves; depth++) {
        TranspositionTable *tt = tt_create(depth);
        info.depth = depth;
        info.score = negamax(board, tt, &info, columns, numCols, depth, -MAXVAL, MAXVAL);
        printf("DEPTH:%d SCORE:%d MOVE:%d NODES:%llu TIME:%.3fs\n", depth, info.score, info.bestMove, info.nodes, timer_elapsed(&timer));
        tt_destroy(tt);
        if (info.score != 0 || clock() >= info.stopAt) break;
    }
    printf("FINAL - DEPTH:%d SCORE:%d MOVE:%d NODES:%llu TIME:%.3fs\n", info.depth, info.score, info.bestMove, info.nodes, timer_elapsed(&timer));
    return info;
}

int main() {
    const char *fen = "";
    // const char *fen = "6625477334543176";
    // const char *fen = "1415251";
    Board* board = board_create(fen);
    printf("Connect Four AI %s\n", fen);

    board_print(board);
    
    SearchInfo result = find_best_move(board, 500000);
    printf("\nBest move: %d (column %d)\n", result.bestMove, result.bestMove + 1);
    
    board_destroy(board);
    return 0;
}