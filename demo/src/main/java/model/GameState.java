package com.example.demo.model;
public class GameState {

    private char[][] board;
    private char currentPlayer;

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

    public void switchPlayer() {
        currentPlayer = (currentPlayer == 'X') ? 'O' : 'X';


    }
}
