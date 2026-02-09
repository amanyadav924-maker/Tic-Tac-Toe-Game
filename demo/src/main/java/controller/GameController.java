package com.example.demo.controller;

import com.example.demo.ai.AiPlayer;
import com.example.demo.model.GameState;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GameController {

    private GameState gameState = new GameState();
    private AiPlayer aiPlayer = new AiPlayer();

    @GetMapping("/start")
    public GameState startGame() {
        gameState = new GameState(); // reset game
        return gameState;
    }

    @GetMapping("/move")
    public GameState makeMove(
            @RequestParam int row,
            @RequestParam int col
    ) {
        // Stop if game over
        if (gameState.getWinner() != '\u0000' || gameState.isDraw()) {
            return gameState;
        }

        // Human move (X)
        gameState.makeMove(row, col);

        // AI move (O)
        if (gameState.getWinner() == '\u0000' && !gameState.isDraw()) {
            aiPlayer.makeMove(gameState);
        }

        return gameState;
    }


    @GetMapping("/reset")
    public GameState resetGame() {
        gameState = new GameState(); // new fresh game
        return gameState;
    }

}
