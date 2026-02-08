package com.example.demo.controller;

import com.example.demo.model.GameState;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GameController {

    private GameState gameState = new GameState();

    // START GAME
    @GetMapping("/start")
    public GameState startGame() {
        return gameState;
    }

    // MAKE MOVE
    @GetMapping("/move")
    public GameState makeMove(
            @RequestParam int row,
            @RequestParam int col
    ) {
        gameState.getBoard()[row][col] = gameState.getCurrentPlayer();
        gameState.switchPlayer();
        return gameState;
    }
}
