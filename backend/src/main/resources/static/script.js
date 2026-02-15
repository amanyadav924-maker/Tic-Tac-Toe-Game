/* ═══════════════════════════════════════════════════════════
   CINEMATIC STARFIELD — Background Animation Engine
   Canvas 2D · 60fps · Delta-time · Randomized per refresh
   ═══════════════════════════════════════════════════════════ */

(function initCinematicStarfield() {
    'use strict';

    // ── Accessibility: skip entirely if reduced motion preferred ──
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const app = document.getElementById('app-container');
        if (app) {
            app.classList.remove('intro-dimmed');
            app.style.opacity = '1';
        }
        return;
    }

    // ── DOM refs ──
    const canvas = document.getElementById('star-canvas');
    const ctx = canvas.getContext('2d');
    const dimOverlay = document.getElementById('collision-dim');
    const glowPulse = document.getElementById('glow-pulse');
    const appContainer = document.getElementById('app-container');
    const logoIcon = document.querySelector('.logo-icon');

    if (!canvas || !ctx) return;

    // ── Canvas sizing ──
    let W, H, dpr;
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Easing ──
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    // ── Logo center helper ──
    function getLogoCenter() {
        if (!logoIcon) return { x: W / 2, y: H / 2 };
        const rect = logoIcon.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  STARFIELD — 200 small twinkling stars
    // ═══════════════════════════════════════════════════════════

    const STAR_COUNT = 200;
    const stars = [];

    function createStar(i) {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            radius: 0.4 + Math.random() * 1.6,
            baseAlpha: 0.3 + Math.random() * 0.7,
            alpha: 0,
            twinkleSpeed: 0.5 + Math.random() * 2.0,
            twinkleOffset: Math.random() * Math.PI * 2,
            // Slight warm/cool color variation for realism
            hue: 200 + Math.random() * 40,        // 200–240 (blue–lavender range)
            saturation: 10 + Math.random() * 30,   // subtle
            lightness: 85 + Math.random() * 15,     // near-white
            active: true  // will be set false for the chosen breakaway star
        };
    }

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(createStar(i));
    }

    // ═══════════════════════════════════════════════════════════
    //  BREAKAWAY STAR — randomly selected
    // ═══════════════════════════════════════════════════════════

    // Pick a random star from outer region (at least 25% away from center)
    const candidateStars = stars.filter(s => {
        const dx = s.x - W / 2;
        const dy = s.y - H / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > Math.min(W, H) * 0.25;
    });
    const chosenIndex = Math.floor(Math.random() * candidateStars.length);
    const chosenStar = candidateStars[chosenIndex] || stars[0];

    // ═══════════════════════════════════════════════════════════
    //  SHOOTING STAR STATE
    // ═══════════════════════════════════════════════════════════

    const shootingStar = {
        active: false,
        x: chosenStar.x,
        y: chosenStar.y,
        startX: chosenStar.x,
        startY: chosenStar.y,
        targetX: 0,
        targetY: 0,
        progress: 0,       // 0→1 normalized
        radius: 2.5,
        trail: [],          // particle trail positions
        maxTrailLen: 35,
    };

    // ═══════════════════════════════════════════════════════════
    //  COLLISION PARTICLES
    // ═══════════════════════════════════════════════════════════

    const burstParticles = [];
    function spawnBurstParticles(cx, cy, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 180;
            const life = 0.4 + Math.random() * 0.6;
            burstParticles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1 + Math.random() * 2.5,
                alpha: 1,
                life: life,
                maxLife: life,
                hue: 220 + Math.random() * 40,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  ANIMATION PHASES & TIMING
    // ═══════════════════════════════════════════════════════════

    const PHASE = {
        TWINKLE: 0,       // 0–1.2s: Stars appear + twinkle
        DETACH: 1,         // 1.2s: Chosen star pulses & detaches
        SHOOT: 2,          // 1.5–3.5s: Shooting star flies to logo
        COLLISION: 3,      // 3.5s: Impact effects
        REVEAL: 4,         // 3.5–5.5s: UI reveals
        IDLE: 5,           // 5.5s+: Stars remain, loop continues
    };

    let currentPhase = PHASE.TWINKLE;
    const T_DETACH = 1200;       // ms after start
    const T_SHOOT_START = 1500;
    const T_SHOOT_DURATION = 2000;
    const T_COLLISION = T_SHOOT_START + T_SHOOT_DURATION;
    const T_REVEAL_DURATION = 1500;

    let animFrameId = null;
    let startTime = performance.now();
    let lastTime = startTime;
    let destroyed = false;

    // ═══════════════════════════════════════════════════════════
    //  RENDER FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function drawStar(s) {
        if (s.alpha <= 0.01) return;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        const color = `hsla(${s.hue}, ${s.saturation}%, ${s.lightness}%, ${s.alpha})`;
        ctx.fillStyle = color;
        // Glow for brighter stars
        if (s.radius > 1.0 && s.alpha > 0.5) {
            ctx.shadowColor = `hsla(${s.hue}, 60%, 80%, ${s.alpha * 0.4})`;
            ctx.shadowBlur = s.radius * 3;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawShootingStar() {
        if (!shootingStar.active) return;

        const ss = shootingStar;

        // ── Trail ──
        for (let i = 0; i < ss.trail.length; i++) {
            const t = ss.trail[i];
            const fade = i / ss.trail.length;
            const r = ss.radius * fade * 0.8;
            if (r < 0.2) continue;
            ctx.beginPath();
            ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(165, 180, 252, ${fade * 0.5})`;
            ctx.fill();
        }

        // ── Core glow ──
        const gradient = ctx.createRadialGradient(
            ss.x, ss.y, 0,
            ss.x, ss.y, ss.radius * 4
        );
        gradient.addColorStop(0, 'rgba(224, 231, 255, 0.95)');
        gradient.addColorStop(0.3, 'rgba(165, 180, 252, 0.6)');
        gradient.addColorStop(0.6, 'rgba(129, 140, 248, 0.2)');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(ss.x, ss.y, ss.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // ── Bright center ──
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, ss.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240, 244, 255, 0.95)';
        ctx.shadowColor = 'rgba(165, 180, 252, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawBurstParticles() {
        for (const p of burstParticles) {
            if (p.alpha <= 0.01) continue;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 80%, ${p.alpha})`;
            ctx.shadowColor = `hsla(${p.hue}, 90%, 85%, ${p.alpha * 0.5})`;
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  MAIN ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════

    function frame(now) {
        if (destroyed) return;

        const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
        const elapsed = now - startTime;
        lastTime = now;

        ctx.clearRect(0, 0, W, H);

        // ── Update & draw stars ──
        for (const s of stars) {
            if (!s.active) continue;
            // Twinkle
            const twinkle = Math.sin(now * 0.001 * s.twinkleSpeed + s.twinkleOffset);
            const twinkleAlpha = s.baseAlpha * (0.6 + 0.4 * twinkle);

            // Fade in during first 1.2s
            if (elapsed < T_DETACH) {
                const fadeIn = Math.min(elapsed / T_DETACH, 1);
                s.alpha = twinkleAlpha * easeOutQuart(fadeIn);
            } else {
                s.alpha = twinkleAlpha;
            }

            drawStar(s);
        }

        // ── Phase: DETACH — Pulse the chosen star before it breaks away ──
        if (currentPhase === PHASE.TWINKLE && elapsed >= T_DETACH) {
            currentPhase = PHASE.DETACH;
            // Pulse the chosen star (make it brighter briefly)
            chosenStar.baseAlpha = 1.0;
            chosenStar.radius = 3.0;
        }

        if (currentPhase === PHASE.DETACH && elapsed >= T_SHOOT_START) {
            currentPhase = PHASE.SHOOT;
            // Start the shooting star
            chosenStar.active = false; // hide original star
            shootingStar.active = true;

            // Calculate target (logo center)
            const target = getLogoCenter();
            shootingStar.targetX = target.x;
            shootingStar.targetY = target.y;
            shootingStar.startX = chosenStar.x;
            shootingStar.startY = chosenStar.y;
            shootingStar.progress = 0;
        }

        // ── Phase: SHOOT — Animate shooting star toward logo ──
        if (currentPhase === PHASE.SHOOT) {
            const shootElapsed = elapsed - T_SHOOT_START;
            const rawProgress = Math.min(shootElapsed / T_SHOOT_DURATION, 1);
            shootingStar.progress = easeInOutCubic(rawProgress);

            const ss = shootingStar;
            ss.x = ss.startX + (ss.targetX - ss.startX) * ss.progress;
            ss.y = ss.startY + (ss.targetY - ss.startY) * ss.progress;

            // Grow radius as it approaches
            ss.radius = 2.5 + rawProgress * 2.5;

            // Add trail point
            ss.trail.push({ x: ss.x, y: ss.y });
            if (ss.trail.length > ss.maxTrailLen) {
                ss.trail.shift();
            }

            drawShootingStar();

            // Collision!
            if (rawProgress >= 1.0) {
                currentPhase = PHASE.COLLISION;
                onCollision();
            }
        }

        // ── Phase: COLLISION — Burst particles still rendering ──
        if (currentPhase >= PHASE.COLLISION) {
            // Update burst particles
            for (let i = burstParticles.length - 1; i >= 0; i--) {
                const p = burstParticles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.life -= dt;
                p.alpha = Math.max(0, p.life / p.maxLife);
                if (p.life <= 0) burstParticles.splice(i, 1);
            }
            drawBurstParticles();
        }

        animFrameId = requestAnimationFrame(frame);
    }

    // ═══════════════════════════════════════════════════════════
    //  COLLISION EVENT
    // ═══════════════════════════════════════════════════════════

    function onCollision() {
        const target = getLogoCenter();

        // Hide shooting star
        shootingStar.active = false;
        shootingStar.trail = [];

        // Spawn burst particles at impact point
        spawnBurstParticles(target.x, target.y, 40);

        // ── Dim overlay ──
        if (dimOverlay) dimOverlay.classList.add('active');

        // ── UI collision dim ──
        if (appContainer) {
            appContainer.classList.remove('intro-dimmed');
            appContainer.classList.add('intro-collision');
        }

        // ── Logo glow burst ──
        if (logoIcon) {
            logoIcon.classList.add('glow-burst');
        }

        // ── Glow pulse positioned at logo ──
        if (glowPulse) {
            glowPulse.style.left = target.x + 'px';
            glowPulse.style.top = target.y + 'px';
            glowPulse.classList.add('burst');
        }

        // ── Reveal phase after 600ms ──
        setTimeout(onReveal, 600);
    }

    // ═══════════════════════════════════════════════════════════
    //  REVEAL EVENT
    // ═══════════════════════════════════════════════════════════

    function onReveal() {
        if (destroyed) return;
        currentPhase = PHASE.REVEAL;

        // Remove dim
        if (dimOverlay) dimOverlay.classList.remove('active');

        // Logo settle to soft ambient glow
        if (logoIcon) {
            logoIcon.classList.remove('glow-burst');
            logoIcon.classList.add('glow-settle');
        }

        // UI full reveal
        if (appContainer) {
            appContainer.classList.remove('intro-collision');
            appContainer.classList.add('intro-reveal');
        }

        // Cleanup after reveal completes
        setTimeout(() => {
            if (destroyed) return;
            currentPhase = PHASE.IDLE;

            // Clean up classes so no lingering styles
            if (appContainer) {
                appContainer.classList.remove('intro-reveal');
                appContainer.style.opacity = '1';
            }
            if (logoIcon) {
                // Keep settle glow — it looks nice as ambient
            }
        }, T_REVEAL_DURATION);
    }

    // ═══════════════════════════════════════════════════════════
    //  CLEANUP
    // ═══════════════════════════════════════════════════════════

    function destroy() {
        destroyed = true;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        window.removeEventListener('resize', resize);
    }

    // Expose cleanup for potential unmount scenarios
    window.__destroyCinematicStarfield = destroy;

    // ── Kick off ──
    animFrameId = requestAnimationFrame(frame);

})();


/* ═══════════════════════════════════════════════════════════
   TIC TAC TOE — GAME ENGINE
   Multi-screen setup + Simple & Loop modes + AI difficulties
   ═══════════════════════════════════════════════════════════ */

// ─── Unified AI Icon SVG (renders identically on all devices) ──
function aiIconSVG(cls) {
    const c = cls || 'ai-icon-inline';
    return '<svg class="' + c + '" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect x="12" y="18" width="40" height="32" rx="8" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="2.5"/>' +
        '<circle cx="26" cy="32" r="5" fill="currentColor" opacity="0.9"/>' +
        '<circle cx="38" cy="32" r="5" fill="currentColor" opacity="0.9"/>' +
        '<rect x="24" y="42" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.7"/>' +
        '<line x1="32" y1="8" x2="32" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="32" cy="6" r="3" fill="currentColor" opacity="0.8"/>' +
        '<line x1="6" y1="28" x2="12" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="6" y1="38" x2="12" y2="34" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="58" y1="28" x2="52" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="58" y1="38" x2="52" y2="34" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>';
}

// ─── State Variables ───────────────────────────────────────
let gameMode = null;   // 'simple' | 'loop'
let opponentType = null;   // 'ai' | 'human'
let aiDifficulty = null;   // 'easy' | 'medium' | 'hard'

let board = Array(9).fill('');
let currentPlayer = 'X';
let gameOver = false;
let moveHistory = [];     // For Loop Mode: tracks order of moves
const MAX_MARKS = 6;      // Loop Mode: max marks on board (3 per player)

// Winning patterns
const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diags
];

// ─── DOM References ────────────────────────────────────────
const screens = {
    mode: document.getElementById('screen-mode'),
    opponent: document.getElementById('screen-opponent'),
    difficulty: document.getElementById('screen-difficulty'),
    game: document.getElementById('screen-game'),
};

const cells = document.querySelectorAll('.cell');
const statusEl = document.getElementById('game-status');
const badgeMode = document.getElementById('badge-mode');
const badgeOpp = document.getElementById('badge-opponent');
const badgeDiff = document.getElementById('badge-difficulty');

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
    const modeLabels = { simple: '⚡ Simple', loop: '♾️ Loop' };
    const oppLabels = { ai: aiIconSVG() + ' vs AI', human: '👥 vs Human' };
    const diffLabels = { easy: '🌱 Easy', medium: '⚖️ Medium', hard: '🔥 Hard' };

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

function setBadge(el, content) {
    el.innerHTML = content;
    el.classList.add('visible');
}

function updateStatus(text) {
    statusEl.textContent = text;
}

function updateStatusHTML(html) {
    statusEl.innerHTML = html;
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
        updateStatusHTML('AI is thinking ' + aiIconSVG());
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
            msg = currentPlayer === 'X' ? 'You Win! 🎉' : 'AI Wins! ' + aiIconSVG();
        } else {
            msg = `Player ${currentPlayer} Wins! 🎉`;
        }
        updateStatusHTML(msg);
        statusEl.classList.add('win');
        showResultOverlay(currentPlayer === 'X' ? '🎉' : (opponentType === 'ai' ? aiIconSVG('ai-icon ai-icon-result') : '🎉'), msg);
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
