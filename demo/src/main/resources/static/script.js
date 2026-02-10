/* ═══════════════════════════════════════════════════════════
   TIC TAC TOE — GAME ENGINE
   Multi-screen setup + Simple & Loop modes + AI difficulties
   ═══════════════════════════════════════════════════════════ */

// ─── State Variables ───────────────────────────────────────
let gameMode       = null;   // 'simple' | 'loop'
let opponentType   = null;   // 'ai' | 'human'
let aiDifficulty   = null;   // 'easy' | 'medium' | 'hard'

let board          = Array(9).fill('');
let currentPlayer  = 'X';
let gameOver       = false;
let moveHistory    = [];     // For Loop Mode: tracks order of moves
const MAX_MARKS    = 6;      // Loop Mode: max marks on board (3 per player)

// Winning patterns
const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diags
];

// ─── DOM References ────────────────────────────────────────
const screens = {
    mode:       document.getElementById('screen-mode'),
    opponent:   document.getElementById('screen-opponent'),
    difficulty: document.getElementById('screen-difficulty'),
    game:       document.getElementById('screen-game'),
};

const cells       = document.querySelectorAll('.cell');
const statusEl    = document.getElementById('game-status');
const badgeMode   = document.getElementById('badge-mode');
const badgeOpp    = document.getElementById('badge-opponent');
const badgeDiff   = document.getElementById('badge-difficulty');

// ─── Ambient Particles ────────────────────────────────────
(function initParticles() {
    const container = document.getElementById('particles');
    const count = 18;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        const size = 2 + Math.random() * 4;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (12 + Math.random() * 18) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        const hue = [245, 330, 160][Math.floor(Math.random() * 3)];
        p.style.background = `hsl(${hue}, 70%, 70%)`;
        container.appendChild(p);
    }
})();

// ═══════════════════════════════════════════════════════════
//  SETUP FLOW
// ═══════════════════════════════════════════════════════════

function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    const target = screens[screenId] || document.getElementById(screenId);
    if (target) {
        target.classList.remove('active');
        // Force reflow to restart animation
        void target.offsetWidth;
        target.classList.add('active');
    }
}

function highlightCard(containerId, value) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('.option-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.value === value);
    });
}

// Screen 1: Mode Selection
function selectMode(mode) {
    gameMode = mode;
    highlightCard('mode-options', mode);

    // Small delay for visual feedback before transitioning
    setTimeout(() => showScreen('opponent'), 250);
}

// Screen 2: Opponent Selection
function selectOpponent(opponent) {
    opponentType = opponent;
    highlightCard('opponent-options', opponent);

    setTimeout(() => {
        if (opponent === 'ai') {
            showScreen('difficulty');
        } else {
            aiDifficulty = null;
            startGame();
        }
    }, 250);
}

// Screen 3: AI Difficulty
function selectDifficulty(difficulty) {
    aiDifficulty = difficulty;
    highlightCard('difficulty-options', difficulty);

    setTimeout(() => startGame(), 250);
}

// Navigate back
function goBack(screenKey) {
    // Map screen element id → screens key
    const keyMap = {
        'screen-mode': 'mode',
        'screen-opponent': 'opponent',
        'screen-difficulty': 'difficulty',
    };
    showScreen(keyMap[screenKey] || screenKey);
}

// ═══════════════════════════════════════════════════════════
//  GAME INITIALIZATION
// ═══════════════════════════════════════════════════════════

function startGame() {
    // Reset board state
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameOver = false;
    moveHistory = [];

    // Update UI
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell'; // reset all classes
    });

    // Set badges
    const modeLabels  = { simple: '⚡ Simple', loop: '♾️ Loop' };
    const oppLabels   = { ai: '🤖 vs AI', human: '👥 vs Human' };
    const diffLabels  = { easy: '🌱 Easy', medium: '⚖️ Medium', hard: '🔥 Hard' };

    setBadge(badgeMode, modeLabels[gameMode]);
    setBadge(badgeOpp, oppLabels[opponentType]);
    if (opponentType === 'ai' && aiDifficulty) {
        setBadge(badgeDiff, diffLabels[aiDifficulty]);
    } else {
        badgeDiff.classList.remove('visible');
        badgeDiff.textContent = '';
    }

    updateStatus(`Player X's turn`);
    statusEl.className = 'game-status';

    // Remove any existing overlay
    removeResultOverlay();

    // Show game screen
    showScreen('game');

    // Attach click listeners
    cells.forEach(cell => {
        cell.onclick = () => handleCellClick(parseInt(cell.dataset.index));
    });
}

function setBadge(el, text) {
    el.textContent = text;
    el.classList.add('visible');
}

function updateStatus(text) {
    statusEl.textContent = text;
}

// ═══════════════════════════════════════════════════════════
//  CELL CLICK HANDLER
// ═══════════════════════════════════════════════════════════

function handleCellClick(index) {
    if (gameOver) return;
    if (board[index] !== '') return;

    // If vs AI, only allow clicks on human's turn (X)
    if (opponentType === 'ai' && currentPlayer !== 'X') return;

    makeMove(index, currentPlayer);

    if (checkGameEnd()) return;

    // Switch player
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

    if (opponentType === 'ai') {
        // AI's turn
        updateStatus('AI is thinking 🤖');
        statusEl.classList.add('thinking');
        disableCells(true);

        const delay = 500 + Math.random() * 500;
        setTimeout(() => {
            statusEl.classList.remove('thinking');
            aiMove();
            if (checkGameEnd()) return;
            currentPlayer = 'X';
            updateStatus(`Player X's turn`);
            disableCells(false);
        }, delay);
    } else {
        updateStatus(`Player ${currentPlayer}'s turn`);
    }
}

function disableCells(disable) {
    cells.forEach(cell => {
        cell.classList.toggle('disabled', disable);
    });
}

// ═══════════════════════════════════════════════════════════
//  MAKE MOVE (with Loop Mode logic)
// ═══════════════════════════════════════════════════════════

function makeMove(index, player) {
    board[index] = player;
    moveHistory.push({ index, player });

    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add('filled', player === 'X' ? 'x-mark' : 'o-mark');

    // Loop Mode: remove oldest move if board has more than MAX_MARKS
    if (gameMode === 'loop' && moveHistory.length > MAX_MARKS) {
        const oldest = moveHistory.shift();
        board[oldest.index] = '';
        const oldCell = cells[oldest.index];
        oldCell.textContent = '';
        oldCell.className = 'cell'; // reset
    }

    // Loop Mode: mark the *next* move to be removed (visual hint)
    updateFadingHints();
}

function updateFadingHints() {
    // Clear all fading hints first
    cells.forEach(c => c.classList.remove('fading'));

    if (gameMode === 'loop' && moveHistory.length >= MAX_MARKS) {
        // The oldest move will be removed next
        const nextToFade = moveHistory[0];
        cells[nextToFade.index].classList.add('fading');
    }
}

// ═══════════════════════════════════════════════════════════
//  WIN / DRAW CHECKING
// ═══════════════════════════════════════════════════════════

function checkWin(b, player) {
    return WIN_PATTERNS.find(p =>
        b[p[0]] === player && b[p[1]] === player && b[p[2]] === player
    ) || null;
}

function checkGameEnd() {
    // Check win for current player
    const winPattern = checkWin(board, currentPlayer);
    if (winPattern) {
        gameOver = true;
        highlightWinCells(winPattern);

        let msg;
        if (opponentType === 'ai') {
            msg = currentPlayer === 'X' ? 'You Win! 🎉' : 'AI Wins! 🤖';
        } else {
            msg = `Player ${currentPlayer} Wins! 🎉`;
        }
        updateStatus(msg);
        statusEl.classList.add('win');
        showResultOverlay(currentPlayer === 'X' ? '🎉' : (opponentType === 'ai' ? '🤖' : '🎉'), msg);
        return true;
    }

    // Draw check — only in Simple Mode
    if (gameMode === 'simple' && board.every(c => c !== '')) {
        gameOver = true;
        updateStatus('It\'s a Draw! 🤝');
        statusEl.classList.add('draw');
        showResultOverlay('🤝', "It's a Draw!");
        return true;
    }

    // Loop Mode: draws are impossible by design (old moves are removed)
    return false;
}

function highlightWinCells(pattern) {
    pattern.forEach(i => cells[i].classList.add('win-cell'));
}

// ═══════════════════════════════════════════════════════════
//  AI ENGINE — Easy / Medium / Hard
// ═══════════════════════════════════════════════════════════

function aiMove() {
    let move;

    switch (aiDifficulty) {
        case 'easy':
            move = aiMoveEasy();
            break;
        case 'medium':
            move = aiMoveMedium();
            break;
        case 'hard':
        default:
            move = aiMoveHard();
            break;
    }

    if (move !== undefined && move !== null) {
        makeMove(move, 'O');
    }
}

// ── Easy: pure random ──
function aiMoveEasy() {
    const available = getEmptyCells();
    return available[Math.floor(Math.random() * available.length)];
}

// ── Medium: 60% smart, 40% random ──
function aiMoveMedium() {
    // Try to win
    const winMove = findWinningMove('O');
    if (winMove !== null) return winMove;

    // Try to block
    const blockMove = findWinningMove('X');
    if (blockMove !== null) return blockMove;

    // 40% chance of random, 60% chance use minimax
    if (Math.random() < 0.4) {
        return aiMoveEasy();
    }
    return aiMoveHard();
}

// ── Hard: full minimax (unbeatable) ──
function aiMoveHard() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            const score = minimax(board, 0, false);
            board[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

function minimax(b, depth, isMaximizing) {
    if (checkWin(b, 'O')) return 10 - depth;
    if (checkWin(b, 'X')) return depth - 10;
    if (b.every(c => c !== '')) return 0;

    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === '') {
                b[i] = 'O';
                best = Math.max(best, minimax(b, depth + 1, false));
                b[i] = '';
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === '') {
                b[i] = 'X';
                best = Math.min(best, minimax(b, depth + 1, true));
                b[i] = '';
            }
        }
        return best;
    }
}

// ── Helpers ──
function getEmptyCells() {
    return board.reduce((acc, val, idx) => {
        if (val === '') acc.push(idx);
        return acc;
    }, []);
}

function findWinningMove(player) {
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = player;
            if (checkWin(board, player)) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════
//  RESULT OVERLAY
// ═══════════════════════════════════════════════════════════

function showResultOverlay(emoji, message) {
    removeResultOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'result-overlay';
    overlay.id = 'result-overlay';
    overlay.innerHTML = `
        <div class="result-card">
            <span class="result-emoji">${emoji}</span>
            <div class="result-text">${message}</div>
            <div class="result-actions">
                <button class="action-btn primary" onclick="resetGame()">↻ Play Again</button>
                <button class="action-btn secondary" onclick="backToSetup()">✦ New Game</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function removeResultOverlay() {
    const existing = document.getElementById('result-overlay');
    if (existing) existing.remove();
}

// ═══════════════════════════════════════════════════════════
//  GAME CONTROLS
// ═══════════════════════════════════════════════════════════

function resetGame() {
    removeResultOverlay();
    startGame();
}

function backToSetup() {
    removeResultOverlay();
    gameMode = null;
    opponentType = null;
    aiDifficulty = null;

    // Deselect all cards
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));

    showScreen('mode');
}
