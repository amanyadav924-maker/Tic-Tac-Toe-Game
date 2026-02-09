let boardButtons = document.querySelectorAll("#board button");
let playerText = document.getElementById("player");

// Load game
fetch("/start")
    .then(res => res.json())
    .then(updateUI);

function makeMove(row, col) {
    fetch(`/move?row=${row}&col=${col}`)
        .then(res => res.json())
        .then(updateUI);
}

function updateUI(game) {
    let board = game.board;

    boardButtons.forEach((btn, index) => {
        let row = Math.floor(index / 3);
        let col = index % 3;
        btn.textContent = board[row][col] === "\u0000" ? "" : board[row][col];
    });

    playerText.innerText = "Current Player: " + game.currentPlayer;
}
function resetGame() {
    fetch("/reset")
        .then(res => res.json())
        .then(updateUI);
}
// Antigravity effect
function enableAntigravity() {
    boardButtons.forEach(btn => {
        btn.style.transition = "transform 1s ease";
        btn.style.transform = `
            translate(${Math.random() * 300 - 150}px,
                      ${Math.random() * 300 - 150}px)
            rotate(${Math.random() * 360}deg)
        `;
    });
}
function restartGame() {
    fetch("/start")
        .then(res => res.json())
        .then(game => {
            updateUI(game);
            enableAntigravity(); // HERE
        });
}
function updateUI(game) {
    let board = game.board;

    boardButtons.forEach((btn, index) => {
        let row = Math.floor(index / 3);
        let col = index % 3;
        btn.textContent = board[row][col] === "\u0000" ? "" : board[row][col];
    });

    if (game.winner !== "\u0000") {
        playerText.innerText = "Winner: " + game.winner + " 🎉";
        return;
    }

    if (game.draw) {
        playerText.innerText = "Draw 🤝";
        return;
    }

    playerText.innerText = "Current Player: " + game.currentPlayer;
}
function makeMove(cell, row, col) {
  if (cell.innerText !== "") return;

  fetch(`/move?row=${row}&col=${col}`)
    .then(res => res.json())
    .then(game => {
      cell.innerText = game.board[row][col];
      cell.classList.add("filled"); // animation
      renderBoard(game);
    });
}
winningCells.forEach(c => c.classList.add("win"));


