const cells = document.querySelectorAll(".cell");
const playerText = document.getElementById("player");

let board = Array(9).fill("");
let currentPlayer = "X"; // Human = X
let gameOver = false;

// Winning patterns
const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// Handle human clicks
cells.forEach(cell => {
  cell.addEventListener("click", () => {
    const index = cell.dataset.index;

    // Only human turn
    if (board[index] !== "" || gameOver || currentPlayer !== "X") return;

    makeMove(index, "X");

    if (checkGameEnd("X")) return;

    // AI turn
    currentPlayer = "O";
    playerText.textContent = "AI is thinking 🤖";

    const humanDelay = 700 + Math.random() * 600; // 700–1300ms

    setTimeout(() => {
      aiMove();
      if (checkGameEnd("O")) return;

      currentPlayer = "X";
      playerText.textContent = "Current Player: X";
    }, humanDelay);

  });
});

// Make a move on board + UI
function makeMove(index, player) {
  board[index] = player;
  cells[index].textContent = player;
  cells[index].classList.add("filled");
}

// Check win or draw
function checkGameEnd(player) {
  if (checkWin(board, player)) {
    playerText.textContent =
      player === "X" ? "You Win 🎉" : "AI Wins 🤖";
    gameOver = true;
    highlightWin(player);
    return true;
  }

  if (board.every(c => c !== "")) {
    playerText.textContent = "Draw 🤝";
    gameOver = true;
    return true;
  }

  return false;
}

// Highlight winning cells
function highlightWin(player) {
  winPatterns.forEach(p => {
    if (
      board[p[0]] === player &&
      board[p[1]] === player &&
      board[p[2]] === player
    ) {
      p.forEach(i => cells[i].classList.add("win"));
    }
  });
}

// Check win for given board
function checkWin(b, player) {
  return winPatterns.some(p =>
    b[p[0]] === player &&
    b[p[1]] === player &&
    b[p[2]] === player
  );
}

// ---------- AI (MINIMAX) ----------

function aiMove() {
  let bestScore = -Infinity;
  let move;

  for (let i = 0; i < 9; i++) {
    if (board[i] === "") {
      board[i] = "O";
      let score = minimax(board, 0, false);
      board[i] = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }

  makeMove(move, "O");
}

// Minimax algorithm
function minimax(newBoard, depth, isMaximizing) {
  if (checkWin(newBoard, "O")) return 10 - depth;
  if (checkWin(newBoard, "X")) return depth - 10;
  if (newBoard.every(c => c !== "")) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "O";
        best = Math.max(best, minimax(newBoard, depth + 1, false));
        newBoard[i] = "";
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "X";
        best = Math.min(best, minimax(newBoard, depth + 1, true));
        newBoard[i] = "";
      }
    }
    return best;
  }
}

// Restart game
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
