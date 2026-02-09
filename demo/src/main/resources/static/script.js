const cells = document.querySelectorAll(".cell");
const playerText = document.getElementById("player");
const restartBtn = document.querySelector(".restart-btn");

let currentPlayer = "X";
let board = Array(9).fill("");
let gameOver = false;

const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

cells.forEach(cell => {
  cell.addEventListener("click", () => {
    const index = cell.dataset.index;

    if (board[index] !== "" || gameOver) return;

    board[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add("filled");

    if (checkWin()) {
      playerText.textContent = `Winner: ${currentPlayer} 🎉`;
      gameOver = true;
      return;
    }

    if (board.every(c => c !== "")) {
      playerText.textContent = "Draw 🤝";
      gameOver = true;
      return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    playerText.textContent = `Current Player: ${currentPlayer}`;
  });
});

function checkWin() {
  for (let pattern of winPatterns) {
    if (
      board[pattern[0]] &&
      board[pattern[0]] === board[pattern[1]] &&
      board[pattern[0]] === board[pattern[2]]
    ) {
      pattern.forEach(i => cells[i].classList.add("win"));
      return true;
    }
  }
  return false;
}

function resetGame() {
  board.fill("");
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("filled", "win");
  });
  currentPlayer = "X";
  gameOver = false;
  playerText.textContent = "Current Player: X";
}
