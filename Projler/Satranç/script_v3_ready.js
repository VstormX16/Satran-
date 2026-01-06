// DOM Elements - Screens
const screenIntro = document.getElementById('screen-intro');
const screenMode = document.getElementById('screen-mode');
const screenGame = document.getElementById('screen-game');
const screenSettings = document.getElementById('screen-settings');
const screenGameOver = document.getElementById('screen-gameover');

// DOM Elements - Buttons & Inputs
const btnEnter = document.getElementById('btn-enter');
// const btnSettingsOpen = document.getElementById('btn-settings-open'); // Removed old btn
const fixedSettingsBtn = document.getElementById('fixed-settings-btn'); // New fixed btn
const btnSettingsClose = document.getElementById('btn-settings-close');
const btnBackMode = document.getElementById('btn-back-mode');

const btnModeAI = document.getElementById('btn-mode-ai');
const btnModePvP = document.getElementById('btn-mode-pvp');
const difficultyArea = document.getElementById('difficulty-area');
const btnStartGame = document.getElementById('btn-start-game');
const btnUndo = document.getElementById('undoBtn');
const btnReset = document.getElementById('resetBtn');
const btnHome = document.getElementById('homeBtn');

const btnPlayAgain = document.getElementById('btn-play-again');
const btnGameOverHome = document.getElementById('btn-gameover-home');

// Game Elements
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const turnText = document.getElementById('turn-text');
const turnIcon = document.getElementById('turn-icon');
const historyList = document.getElementById('historyList');
const winnerNameElement = document.getElementById('winner-name');

// Settings Elements
const themeBtns = document.querySelectorAll('.theme-btn');
const pieceBtns = document.querySelectorAll('.piece-btn');
const soundToggle = document.getElementById('sound-toggle');
const soundStatusText = document.getElementById('sound-status-text');
const view3dToggle = document.getElementById('view-3d-toggle');
const view3dStatusText = document.getElementById('view-3d-status-text');

// Game State
let game = null;
let pvpBoard = [];
let gameMode = 'ai'; // 'ai' or 'pvp'
let aiDifficulty = 'easy';
let playerColor = 'w';
let gameActive = false;
let selectedSquare = null;
let currentTurn = 'w';
let pvpHistory = [];
let soundEnabled = true;

// Sounds
let moveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.m4a');
let captureSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2074/2074-preview.m4a');

// Piece Icons with FontAwesome
const pieceIcons = {
    'w': {
        'p': '<i class="fa-solid fa-chess-pawn piece white"></i>',
        'n': '<i class="fa-solid fa-chess-knight piece white"></i>',
        'b': '<i class="fa-solid fa-chess-bishop piece white"></i>',
        'r': '<i class="fa-solid fa-chess-rook piece white"></i>',
        'q': '<i class="fa-solid fa-chess-queen piece white"></i>',
        'k': '<i class="fa-solid fa-chess-king piece white"></i>'
    },
    'b': {
        'p': '<i class="fa-solid fa-chess-pawn piece black"></i>',
        'n': '<i class="fa-solid fa-chess-knight piece black"></i>',
        'b': '<i class="fa-solid fa-chess-bishop piece black"></i>',
        'r': '<i class="fa-solid fa-chess-rook piece black"></i>',
        'q': '<i class="fa-solid fa-chess-queen piece black"></i>',
        'k': '<i class="fa-solid fa-chess-king piece black"></i>'
    }
};

// --- NAVIGATION FUNCTIONS ---

function showScreen(screenId) {
    if (screenId === 'screen-settings') {
        document.getElementById('screen-settings').classList.remove('hidden');
        document.getElementById('screen-settings').classList.add('active-screen');
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen', 'hidden'));
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('active-screen');
}

let lastScreen = 'screen-intro';

function openSettings() {
    document.querySelectorAll('.screen').forEach(s => {
        if (!s.classList.contains('hidden') && s.id !== 'screen-settings') {
            lastScreen = s.id;
        }
    });
    showScreen('screen-settings');
}

function closeSettings() {
    showScreen(lastScreen);
}

btnEnter.addEventListener('click', () => showScreen('screen-mode'));
btnBackMode.addEventListener('click', () => showScreen('screen-intro'));

// Settings Navigation
fixedSettingsBtn.addEventListener('click', openSettings);
btnSettingsClose.addEventListener('click', closeSettings);

// Theme Selection
themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active-theme'));
        btn.classList.add('active-theme');
        const theme = btn.dataset.theme;
        document.body.classList.remove('theme-classic', 'theme-ocean', 'theme-emerald', 'theme-purple');
        document.body.classList.add(`theme-${theme}`);
    });
});

// Piece Selection
pieceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        pieceBtns.forEach(b => b.classList.remove('active-piece'));
        btn.classList.add('active-piece');
        const pieceTheme = btn.dataset.piece;
        document.body.classList.remove('piece-default', 'piece-gold', 'piece-neon', 'piece-nature');
        document.body.classList.add(`piece-${pieceTheme}`);
    });
});

// Sound Toggle
soundToggle.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
    soundStatusText.innerText = soundEnabled ? "Açık" : "Kapalı";
});

// 3D View Toggle
view3dToggle.addEventListener('change', (e) => {
    const is3d = e.target.checked;
    view3dStatusText.innerText = is3d ? "3D" : "2D";

    if (is3d) {
        boardElement.classList.add('view-3d');
    } else {
        boardElement.classList.remove('view-3d');
    }
});


btnModeAI.addEventListener('click', () => {
    gameMode = 'ai';
    btnModeAI.classList.add('selected');
    btnModePvP.classList.remove('selected');
    difficultyArea.classList.remove('hidden');
});

btnModePvP.addEventListener('click', () => {
    gameMode = 'pvp';
    btnModePvP.classList.add('selected');
    btnModeAI.classList.remove('selected');
    difficultyArea.classList.add('hidden');
    // PvP modunda direkt başlamıyoruz artık, kullanıcı "Başlat" butonuna basmalı (süre seçimi için)
    // startGame(); <- KALDIRILDI
});

btnStartGame.addEventListener('click', () => {
    const diffInputs = document.getElementsByName('difficulty');
    for (const input of diffInputs) {
        if (input.checked) aiDifficulty = input.value;
    }
    startGame();
});

btnHome.addEventListener('click', () => {
    gameActive = false;
    if (game) game.reset();
    showScreen('screen-intro');
});

// Game Over Buttons
btnPlayAgain.addEventListener('click', () => {
    startGame();
});

btnGameOverHome.addEventListener('click', () => {
    showScreen('screen-intro');
});

const timerWhiteEl = document.getElementById('timer-white');
const timerBlackEl = document.getElementById('timer-black');
const timeDisplayW = document.getElementById('time-w');
const timeDisplayB = document.getElementById('time-b');
const timersContainer = document.getElementById('timers-container');

// Time Settings Elements
const timeControlRadios = document.getElementsByName('timeControl');
const timeInputContainer = document.getElementById('time-input-container');
const timeInput = document.getElementById('time-minutes');

// Timer State
let timeControl = 'unlimited'; // 'unlimited' or 'limited'
let initialTime = 600; // seconds (10 mins default)
let whiteTime = 0;
let blackTime = 0;
let timerInterval = null;

// --- TIME SETTINGS LISTENERS ---
timeControlRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'limited') {
            timeInputContainer.classList.remove('hidden');
        } else {
            timeInputContainer.classList.add('hidden');
        }
    });
});


// --- GAME INITIALIZATION ---

function startGame() {
    // Read Time Settings
    for (const radio of timeControlRadios) {
        if (radio.checked) timeControl = radio.value;
    }

    if (timeControl === 'limited') {
        const mins = parseInt(timeInput.value);
        initialTime = mins * 60;
        whiteTime = initialTime;
        blackTime = initialTime;
        timersContainer.classList.remove('hidden');
        updateTimerDisplay();
    } else {
        timersContainer.classList.add('hidden');
    }

    gameActive = true;
    historyList.innerHTML = '';
    selectedSquare = null;
    showScreen('screen-game');

    if (gameMode === 'ai') {
        game = new Chess();
        currentTurn = 'w';
        renderBoard();
        updateGameInfo();
        if (timeControl === 'limited') startTimer();
    } else {
        initPvPBoard();
        currentTurn = 'w';
        pvpHistory = [];
        renderBoard();
        updateGameInfo();
        if (timeControl === 'limited') startTimer();
    }
}

// --- TIMER LOGIC ---

function startTimer() {
    stopTimer();
    updateTimerVisuals();

    timerInterval = setInterval(() => {
        if (!gameActive) {
            stopTimer();
            return;
        }

        let turn;
        if (gameMode === 'ai') turn = game.turn();
        else turn = currentTurn;

        if (turn === 'w') {
            whiteTime--;
            if (whiteTime <= 0) {
                whiteTime = 0;
                handleGameOver("SİYAH (Süre)");
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                blackTime = 0;
                handleGameOver("BEYAZ (Süre)");
            }
        }
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    timeDisplayW.innerText = formatTime(whiteTime);
    timeDisplayB.innerText = formatTime(blackTime);
    updateTimerVisuals();
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateTimerVisuals() {
    let turn;
    if (gameMode === 'ai' && game) turn = game.turn();
    else turn = currentTurn;

    if (turn === 'w') {
        timerWhiteEl.classList.add('active-timer');
        timerBlackEl.classList.remove('active-timer');
    } else {
        timerBlackEl.classList.add('active-timer');
        timerWhiteEl.classList.remove('active-timer');
    }

    // Low time warning (< 30s)
    if (whiteTime < 30) timerWhiteEl.classList.add('low-time');
    else timerWhiteEl.classList.remove('low-time');

    if (blackTime < 30) timerBlackEl.classList.add('low-time');
    else timerBlackEl.classList.remove('low-time');
}


// --- RENDER & CLICK ---

function renderBoard() {
    boardElement.innerHTML = '';
    let boardData;

    if (gameMode === 'ai') {
        boardData = game.board();
    } else {
        boardData = pvpBoard;
    }

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const squareDiv = document.createElement('div');
            const isLight = (i + j) % 2 === 0;
            squareDiv.className = `square ${isLight ? 'light' : 'dark'}`;

            const squareId = String.fromCharCode(97 + j) + (8 - i);
            squareDiv.id = squareId;

            const piece = boardData[i][j];
            if (piece) {
                squareDiv.innerHTML = pieceIcons[piece.color][piece.type];
            }

            // Highlight Logic
            if (gameMode === 'ai') {
                const history = game.history({ verbose: true });
                if (history.length > 0) {
                    const lastMove = history[history.length - 1];
                    if (lastMove.from === squareId || lastMove.to === squareId) {
                        squareDiv.classList.add('selected');
                    }
                }
            } else {
                if (pvpHistory.length > 0) {
                    const lastMove = pvpHistory[pvpHistory.length - 1];
                    if (lastMove.from === squareId || lastMove.to === squareId) {
                        squareDiv.classList.add('selected');
                    }
                }
            }

            squareDiv.addEventListener('click', () => onSquareClick(squareId, i, j));
            boardElement.appendChild(squareDiv);
        }
    }
}

function onSquareClick(squareId, r, c) {
    if (!gameActive) return;

    if (gameMode === 'ai') {
        if (game.turn() !== playerColor) return;
        handleSquareClickAI(squareId);
    } else {
        handleSquareClickPvP(squareId, r, c);
    }
}

// --- AI MODE LOGIC ---

function handleSquareClickAI(squareId) {
    if (selectedSquare === null) {
        const piece = game.get(squareId);
        if (piece && piece.color === game.turn()) {
            selectedSquare = squareId;
            highlightSquare(squareId);
            showPossibleMovesAI(squareId);
        }
    } else {
        const piece = game.get(squareId);
        if (piece && piece.color === game.turn()) {
            clearHighlights();
            selectedSquare = squareId;
            highlightSquare(squareId);
            showPossibleMovesAI(squareId);
        } else {
            tryMakeMoveAI(selectedSquare, squareId);
        }
    }
}

function tryMakeMoveAI(from, to) {
    const moveAttempt = game.move({ from: from, to: to, promotion: 'q' });
    if (moveAttempt) {
        playSound(moveAttempt);
        completeMoveAI(moveAttempt);
    } else {
        clearHighlights();
        selectedSquare = null;
    }
}

function completeMoveAI(move) {
    clearHighlights();
    selectedSquare = null;
    renderBoard();
    updateGameInfo();
    addToHistory(move.san, game.history().length % 2 !== 0);

    // Timer Update Check
    if (timeControl === 'limited') updateTimerVisuals();

    if (game.game_over()) {
        stopTimer();
        let winner = "Berabere";
        if (game.in_checkmate()) {
            winner = game.turn() === 'w' ? 'SİYAH' : 'BEYAZ';
        }
        handleGameOver(winner);
        return;
    }

    if (game.turn() === 'b') {
        setTimeout(makeAIMove, 500);
    }
}

function showPossibleMovesAI(squareId) {
    const moves = game.moves({ square: squareId, verbose: true });
    moves.forEach(move => {
        const el = document.getElementById(move.to);
        if (el) {
            // Check if it's a capture
            if (move.captured) {
                el.classList.add('capture-move');
            } else {
                el.classList.add('possible-move');
            }
        }
    });
}

// --- PVP MODE LOGIC ---

function initPvPBoard() {
    pvpBoard = Array(8).fill(null).map(() => Array(8).fill(null));

    const setupRow = (row, color, pieces) => {
        pieces.forEach((p, col) => {
            pvpBoard[row][col] = { type: p, color: color };
        });
    };

    const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    const pawnRow = Array(8).fill('p');

    setupRow(0, 'b', backRow);
    setupRow(1, 'b', pawnRow);
    setupRow(6, 'w', pawnRow);
    setupRow(7, 'w', backRow);
}

function handleSquareClickPvP(squareId, r, c) {
    if (selectedSquare === null) {
        const piece = getPvPPiece(r, c);
        if (piece && piece.color === currentTurn) {
            selectedSquare = { id: squareId, r: r, c: c };
            highlightSquare(squareId);
            showPossibleMovesPvP(r, c, piece);
        }
    } else {
        const targetPiece = getPvPPiece(r, c);
        if (targetPiece && targetPiece.color === currentTurn) {
            clearHighlights();
            selectedSquare = { id: squareId, r: r, c: c };
            highlightSquare(squareId);
            showPossibleMovesPvP(r, c, targetPiece);
        } else {
            tryMakeMovePvP(selectedSquare, { id: squareId, r: r, c: c });
        }
    }
}

function tryMakeMovePvP(from, to) {
    const piece = getPvPPiece(from.r, from.c);

    if (isValidMovePvP(piece, from, to)) {
        const targetPiece = getPvPPiece(to.r, to.c);

        pvpBoard[to.r][to.c] = piece;
        pvpBoard[from.r][from.c] = null;

        if (piece.type === 'p' && (to.r === 0 || to.r === 7)) {
            piece.type = 'q';
        }

        const moveData = {
            from: from.id,
            to: to.id,
            piece: piece,
            captured: targetPiece
        };
        pvpHistory.push(moveData);

        if (targetPiece) {
            if (soundEnabled) {
                captureSound.currentTime = 0;
                captureSound.play().catch(() => { });
            }
        } else {
            if (soundEnabled) {
                moveSound.currentTime = 0;
                moveSound.play().catch(() => { });
            }
        }

        clearHighlights();
        selectedSquare = null;

        // Timer Update Check
        if (timeControl === 'limited') updateTimerVisuals();

        if (targetPiece && targetPiece.type === 'k') {
            renderBoard();
            stopTimer();
            handleGameOver(currentTurn === 'w' ? 'BEYAZ' : 'SİYAH');
            return;
        }

        currentTurn = currentTurn === 'w' ? 'b' : 'w';
        renderBoard();
        addToHistory(`${piece.type.toUpperCase()} ${to.id}`, currentTurn === 'b');
        updateGameInfo();
    } else {
        clearHighlights();
        selectedSquare = null;
    }
}

function isValidMovePvP(piece, from, to) {
    const dr = to.r - from.r;
    const dc = to.c - from.c;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    const target = getPvPPiece(to.r, to.c);
    if (target && target.color === piece.color) return false;

    switch (piece.type) {
        case 'p':
            const direction = piece.color === 'w' ? -1 : 1;
            const startRow = piece.color === 'w' ? 6 : 1;

            if (dc === 0) {
                if (dr === direction && !target) return true;
                if (dr === direction * 2 && from.r === startRow && !target && !getPvPPiece(from.r + direction, from.c)) return true;
            }
            if (absDc === 1 && dr === direction && target) return true;
            return false;

        case 'r':
            if (dr !== 0 && dc !== 0) return false;
            return isPathClear(from, to);

        case 'b':
            if (absDr !== absDc) return false;
            return isPathClear(from, to);

        case 'q':
            if (dr !== 0 && dc !== 0 && absDr !== absDc) return false;
            return isPathClear(from, to);

        case 'n':
            return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);

        case 'k':
            return absDr <= 1 && absDc <= 1;

        default: return false;
    }
}

function isPathClear(from, to) {
    const dr = Math.sign(to.r - from.r);
    const dc = Math.sign(to.c - from.c);
    let r = from.r + dr;
    let c = from.c + dc;

    while (r !== to.r || c !== to.c) {
        if (getPvPPiece(r, c)) return false;
        r += dr;
        c += dc;
    }
    return true;
}

function getPvPPiece(r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return null;
    return pvpBoard[r][c];
}

function showPossibleMovesPvP(r, c, piece) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const from = { r: r, c: c };
            const to = { r: i, c: j };
            if (isValidMovePvP(piece, from, to)) {
                const squareId = String.fromCharCode(97 + j) + (8 - i);
                const el = document.getElementById(squareId);
                if (el) {
                    const targetPiece = getPvPPiece(i, j);
                    if (targetPiece) {
                        el.classList.add('capture-move');
                    } else {
                        el.classList.add('possible-move');
                    }
                }
            }
        }
    }
}

// --- SHARED HELPERS ---

function highlightSquare(squareId) {
    const el = document.getElementById(squareId);
    if (el) el.classList.add('selected');
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(el => {
        el.classList.remove('selected', 'possible-move', 'capture-move');
    });
}

function playSound(moveOrAttempt) {
    if (!soundEnabled) return;

    if (moveOrAttempt.captured || moveOrAttempt === true) {
        captureSound.currentTime = 0;
        captureSound.play().catch(() => { });
    } else {
        moveSound.currentTime = 0;
        moveSound.play().catch(() => { });
    }
}

function updateGameInfo() {
    let turn;
    if (gameMode === 'ai') turn = game.turn();
    else turn = currentTurn;

    turnIcon.innerHTML = turn === 'w'
        ? '<i class="fa-solid fa-chess-pawn"></i>'
        : '<i class="fa-solid fa-chess-pawn" style="color: black;"></i>';

    let text = turn === 'w' ? "Sıra: Beyaz" : "Sıra: Siyah";
    if (gameMode === 'ai') {
        text += (turn === playerColor ? " (Siz)" : " (Yapay Zeka)");
    }
    turnText.innerText = text;

    statusElement.innerText = "Hamle bekleniyor...";
    statusElement.style.color = "#94a3b8";
}

function addToHistory(san, isWhiteMove) {
    let li = document.createElement('li');
    li.innerHTML = `<strong>${isWhiteMove ? '•' : ''}</strong> ${san}`;
    historyList.prepend(li);
}

function handleGameOver(winnerName) {
    stopTimer(); // Ensure timer stops
    gameActive = false;
    winnerNameElement.innerText = winnerName;

    // Gecikmeli ekran gösterimi
    setTimeout(() => {
        showScreen('screen-gameover');
    }, 500);
}

// --- BUTTONS ---
btnUndo.addEventListener('click', () => {
    if (!gameActive && !game) return;

    if (gameMode === 'pvp') {
        if (pvpHistory.length > 0) {
            alert("PvP modunda Geri Al henüz aktif değil.");
        }
    } else {
        if (game) {
            game.undo();
            game.undo();
            renderBoard();
            updateGameInfo();
        }
    }
});

btnReset.addEventListener('click', () => {
    if (confirm("Oyunu sıfırlamak istiyor musunuz?")) {
        stopTimer();
        startGame();
    }
});

// --- AI LOGIC ---
function makeAIMove() {
    if (!gameActive) return;

    let baseDepth = 1;
    // Zorluk seviyesine göre hedef derinlik
    if (aiDifficulty === 'medium') baseDepth = 2;
    if (aiDifficulty === 'hard') baseDepth = 3;

    // --- YAPAY ZEKA SÜRE YÖNETİMİ ---
    // Eğer oyun süreliyse ve AI'nın süresi (Siyah) azaldıysa derinliği düşür
    if (timeControl === 'limited') {
        // Çok kritik: Son 20 saniye -> Derinlik 1 (En hızlı)
        if (blackTime < 20) {
            baseDepth = 1;
        }
        // Kritik: Son 60 saniye ve Derinlik 3 ise -> Derinlik 2'ye düşür
        else if (blackTime < 60 && baseDepth > 2) {
            baseDepth = 2;
        }
    }

    let move;
    // Easy modunda süre sorunu yoksa biraz rastgelelik iyidir
    if (aiDifficulty === 'easy' && (timeControl !== 'limited' || blackTime > 20)) {
        move = getRandomMove();
        if (!move) move = getBestMove(1);
    } else {
        // Diğer durumlarda (Medium, Hard veya Süre Az) hesaplı oyna
        move = getBestMove(baseDepth);
    }

    if (move) {
        game.move(move);
        playSound(move); // AI move sound
        completeMoveAI(move);
    }
}

function getRandomMove() {
    const moves = game.moves();
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
}

function getBestMove(depth) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    moves.sort(() => Math.random() - 0.5);

    let bestMove = null;
    let bestValue = -Infinity;

    for (const move of moves) {
        game.move(move);
        const evaluation = minimax(depth - 1, -Infinity, Infinity, false);
        game.undo();
        if (evaluation > bestValue) {
            bestValue = evaluation;
            bestMove = move;
        }
    }
    return bestMove;
}

const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

function minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0 || game.game_over()) return evaluateBoard(game.board());

    const moves = game.moves();
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evaluation = minimax(depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evaluation = minimax(depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(board) {
    let total = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece) {
                const val = pieceValues[piece.type];
                total += piece.color === 'b' ? val : -val;
            }
        }
    }
    return total;
}
