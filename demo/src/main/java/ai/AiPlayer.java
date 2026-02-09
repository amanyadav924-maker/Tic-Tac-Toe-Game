package com.example.demo.ai;

import com.example.demo.model.GameState;

public class AiPlayer {

    public void makeMove(GameState gameState) {
        char[][] board = gameState.getBoard();

        int bestScore = Integer.MIN_VALUE;
        int bestRow = -1, bestCol = -1;

        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (board[i][j] == '\u0000') {

                    // Try move
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

        gameState.makeMove(bestRow, bestCol);
    }

    //  MINIMAX 

    private int minimax(char[][] board, boolean isMaximizing) {
        char winner = checkWinner(board);

        if (winner == 'O') return 10;
        if (winner == 'X') return -10;
        if (isFull(board)) return 0;

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

    //  HELPERS

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
                if (board[i][j] == '\u0000') return false;
        return true;
    }
}
