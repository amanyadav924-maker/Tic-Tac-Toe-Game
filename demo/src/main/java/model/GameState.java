package com.example.demo.model;

public class GameState {

    private char[][] board;
    private char currentPlayer;

    // ✅ Game status
    private char winner = '\u0000';
    private boolean draw = false;

    public GameState() {
        board = new char[3][3];
        currentPlayer = 'X';
    }

    public char[][] getBoard() {
        return board;
    }

    public char getCurrentPlayer() {
        return currentPlayer;
    }

    public char getWinner() {
        return winner;
    }

    public boolean isDraw() {
        return draw;
    }

    public void switchPlayer() {
        currentPlayer = (currentPlayer == 'X') ? 'O' : 'X';
    }

    public void makeMove(int row, int col) {
        if (board[row][col] == '\u0000' && winner == '\u0000' && !draw) {
            board[row][col] = currentPlayer;
            checkGameStatus();
            if (winner == '\u0000') {
                switchPlayer();
            }
        }
    }

    // ✅ Check winner & draw
    public void checkGameStatus() {
        char[][] b = board;

        // Rows & Columns
        for (int i = 0; i < 3; i++) {
            if (b[i][0] != '\u0000' &&
                    b[i][0] == b[i][1] &&
                    b[i][1] == b[i][2]) {
                winner = b[i][0];
                return;
            }
            if (b[0][i] != '\u0000' &&
                    b[0][i] == b[1][i] &&
                    b[1][i] == b[2][i]) {
                winner = b[0][i];
                return;
            }
        }

        // Diagonals
        if (b[0][0] != '\u0000' &&
                b[0][0] == b[1][1] &&
                b[1][1] == b[2][2]) {
            winner = b[0][0];
            return;
        }
        if (b[0][2] != '\u0000' &&
                b[0][2] == b[1][1] &&
                b[1][1] == b[2][0]) {
            winner = b[0][2];
            return;
        }

        // Draw check
        boolean full = true;
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (b[i][j] == '\u0000') {
                    full = false;
                    break;
                }
            }
        }

        if (full) {
            draw = true;
        }
    }
}
