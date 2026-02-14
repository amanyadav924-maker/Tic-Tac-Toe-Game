package com.example.demo.ai;

import com.example.demo.model.GameState;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class AiPlayer {

    private final Random random = new Random();

    /**
     * Makes a move based on the specified difficulty level.
     * 
     * @param gameState  current game state
     * @param difficulty "easy", "medium", or "hard"
     */
    public void makeMove(GameState gameState, String difficulty) {
        switch (difficulty) {
            case "easy":
                makeMoveEasy(gameState);
                break;
            case "medium":
                makeMoveMedium(gameState);
                break;
            case "hard":
            default:
                makeMoveHard(gameState);
                break;
        }
    }

    // Overload for backward compatibility (defaults to hard)
    public void makeMove(GameState gameState) {
        makeMoveHard(gameState);
    }

    // ─── Easy: Random Move ─────────────────────────────────
    private void makeMoveEasy(GameState gameState) {
        List<int[]> emptyCells = getEmptyCells(gameState.getBoard());
        if (!emptyCells.isEmpty()) {
            int[] cell = emptyCells.get(random.nextInt(emptyCells.size()));
            gameState.makeMove(cell[0], cell[1]);
        }
    }

    // ─── Medium: Block/Win or Random ───────────────────────
    private void makeMoveMedium(GameState gameState) {
        char[][] board = gameState.getBoard();

        // Try to win
        int[] winMove = findWinningMove(board, 'O');
        if (winMove != null) {
            gameState.makeMove(winMove[0], winMove[1]);
            return;
        }

        // Try to block
        int[] blockMove = findWinningMove(board, 'X');
        if (blockMove != null) {
            gameState.makeMove(blockMove[0], blockMove[1]);
            return;
        }

        // 50% chance random, 50% chance minimax
        if (random.nextDouble() < 0.5) {
            makeMoveEasy(gameState);
        } else {
            makeMoveHard(gameState);
        }
    }

    // ─── Hard: Full Minimax (Unbeatable) ───────────────────
    private void makeMoveHard(GameState gameState) {
        char[][] board = gameState.getBoard();

        int bestScore = Integer.MIN_VALUE;
        int bestRow = -1, bestCol = -1;

        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (board[i][j] == '\u0000') {
                    board[i][j] = 'O';
                    int score = minimax(board, false);
                    board[i][j] = '\u0000';

                    if (score > bestScore) {
                        bestScore = score;
                        bestRow = i;
                        bestCol = j;
                    }
                }
            }
        }

        if (bestRow != -1) {
            gameState.makeMove(bestRow, bestCol);
        }
    }

    // ─── Minimax Algorithm ─────────────────────────────────
    private int minimax(char[][] board, boolean isMaximizing) {
        char winner = checkWinner(board);

        if (winner == 'O')
            return 10;
        if (winner == 'X')
            return -10;
        if (isFull(board))
            return 0;

        if (isMaximizing) {
            int bestScore = Integer.MIN_VALUE;
            for (int i = 0; i < 3; i++) {
                for (int j = 0; j < 3; j++) {
                    if (board[i][j] == '\u0000') {
                        board[i][j] = 'O';
                        bestScore = Math.max(bestScore, minimax(board, false));
                        board[i][j] = '\u0000';
                    }
                }
            }
            return bestScore;
        } else {
            int bestScore = Integer.MAX_VALUE;
            for (int i = 0; i < 3; i++) {
                for (int j = 0; j < 3; j++) {
                    if (board[i][j] == '\u0000') {
                        board[i][j] = 'X';
                        bestScore = Math.min(bestScore, minimax(board, true));
                        board[i][j] = '\u0000';
                    }
                }
            }
            return bestScore;
        }
    }

    // ─── Helpers ───────────────────────────────────────────
    private char checkWinner(char[][] b) {
        for (int i = 0; i < 3; i++) {
            if (b[i][0] != '\u0000' && b[i][0] == b[i][1] && b[i][1] == b[i][2])
                return b[i][0];
            if (b[0][i] != '\u0000' && b[0][i] == b[1][i] && b[1][i] == b[2][i])
                return b[0][i];
        }

        if (b[0][0] != '\u0000' && b[0][0] == b[1][1] && b[1][1] == b[2][2])
            return b[0][0];
        if (b[0][2] != '\u0000' && b[0][2] == b[1][1] && b[1][1] == b[2][0])
            return b[0][2];

        return '\u0000';
    }

    private boolean isFull(char[][] board) {
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                if (board[i][j] == '\u0000')
                    return false;
        return true;
    }

    private List<int[]> getEmptyCells(char[][] board) {
        List<int[]> empty = new ArrayList<>();
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                if (board[i][j] == '\u0000')
                    empty.add(new int[] { i, j });
        return empty;
    }

    private int[] findWinningMove(char[][] board, char player) {
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (board[i][j] == '\u0000') {
                    board[i][j] = player;
                    if (checkWinner(board) == player) {
                        board[i][j] = '\u0000';
                        return new int[] { i, j };
                    }
                    board[i][j] = '\u0000';
                }
            }
        }
        return null;
    }
}
