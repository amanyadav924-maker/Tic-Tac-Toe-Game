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
function minimax(newBoard, isMaximizing) {
  const winner = checkWinner(newBoard);
  if (winner === "O") return 10;
  if (winner === "X") return -10;
  if (newBoard.every(c => c !== "")) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "O";
        best = Math.max(best, minimax(newBoard, false));
        newBoard[i] = "";
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "X";
        best = Math.min(best, minimax(newBoard, true));
        newBoard[i] = "";
      }
    }
    return best;
  }
}
function checkWinner(b) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let w of wins) {
    if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) {
      return b[w[0]];
    }
  }
  return null;
}
function aiMove() {
  let bestScore = -Infinity;
  let move;

  for (let i = 0; i < 9; i++) {
    if (board[i] === "") {
      board[i] = "O";
      let score = minimax(board, false);
      board[i] = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }

  board[move] = "O";
  cells[move].textContent = "O";
  cells[move].classList.add("filled");
}
// after human move
if (!gameOver) {
  aiMove();

  if (checkWin()) {
    playerText.textContent = "Winner: O 🤖";
    gameOver = true;
    return;
  }
}
