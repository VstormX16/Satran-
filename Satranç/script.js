window.onerror = function(msg, url, line) { alert('HATA: ' + msg + ' (Satır: ' + line + ')'); };
// --- SATRANÇ PROJESİ v4.0 (STABLE) ---

// --- 1. GLOBALS & SELECTORS ---
const SCREENS = {
    intro: document.getElementById('screen-intro'),
    mode: document.getElementById('screen-mode'),
    game: document.getElementById('screen-game'),
    settings: document.getElementById('screen-settings'),
    gameover: document.getElementById('screen-gameover'),
    online: document.getElementById('screen-online')
};

const UI = {
    board: document.getElementById('board'),
    status: document.getElementById('status'),
    turnText: document.getElementById('turn-text'),
    turnIcon: document.getElementById('turn-icon'),
    historyList: document.getElementById('historyList'),
    winnerName: document.getElementById('winner-name'),
    timerWhite: document.getElementById('timer-white'),
    timerBlack: document.getElementById('timer-black'),
    capturedWhite: document.getElementById('captured-white'),
    capturedBlack: document.getElementById('captured-black'),
    notification: document.getElementById('notification-toast'),
    onlineLobbyInitial: document.getElementById('lobby-initial'),
    onlineLobbyHost: document.getElementById('lobby-host'),
    myPeerId: document.getElementById('my-peer-id'),
    remoteIdInput: document.getElementById('remote-id-input')
};

const BUTTONS = {
    enter: document.getElementById('btn-enter'),
    settings: document.getElementById('fixed-settings-btn'),
    settingsClose: document.getElementById('btn-settings-close'),
    backMode: document.getElementById('btn-back-mode'),
    modeAI: document.getElementById('btn-mode-ai'),
    modePvP: document.getElementById('btn-mode-pvp'),
    startGame: document.getElementById('btn-start-game'),
    undo: document.getElementById('undoBtn'),
    reset: document.getElementById('resetBtn'),
    home: document.getElementById('homeBtn'),
    playAgain: document.getElementById('btn-play-again'),
    gameoverHome: document.getElementById('btn-gameover-home'),
    acceptRematch: document.getElementById('btn-accept-rematch'),
    closeNotification: document.getElementById('btn-close-notification'),
    // Online Btns
    modeOnline: document.getElementById('btn-mode-online'),
    createRoom: document.getElementById('btn-create-room'),
    joinRoom: document.getElementById('btn-join-room'),
    cancelHost: document.getElementById('btn-cancel-host'),
    copyCode: document.getElementById('btn-copy-code'),
    backOnline: document.getElementById('btn-back-online')
};

// State
let game = null; // chess.js instance
let pvpBoard = []; // Custom board for PvP (if manual) - Actually let's use chess.js for everything for stability!
// PvP mode was manual array based? Let's unify EVERYTHING to chess.js for robustness.
// If user wanted manual PvP movements (physics-like), current chess.js enforces rules.
// User didn't complain about rules.

let STATE = {
    mode: 'ai', // 'ai', 'pvp', 'online_host', 'online_join'
    active: false,
    turn: 'w', // 'w' or 'b'
    playerColor: 'w', // For AI/Online
    selectedSquare: null,
    aiDifficulty: 'easy',
    timeControl: 'unlimited',
    initialTime: 600,
    whiteTime: 600,
    blackTime: 600,
    timerInterval: null,
    onlineColor: 'w',
    soundEnabled: true
};

// Sounds
const sounds = {
    move: new Audio('https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.m4a'),
    capture: new Audio('https://assets.mixkit.co/active_storage/sfx/2074/2074-preview.m4a')
};

// Elements for Timers
const timeInputs = {
    radios: document.getElementsByName('timeControl'),
    container: document.getElementById('time-input-container'),
    input: document.getElementById('time-minutes'),
    diffInputs: document.getElementsByName('difficulty')
};

// PeerJS
let peer = null;
let conn = null;
let myId = null;

// --- 2. INITIALIZATION & NAVIGATION ---

function init() {
    setupEventListeners();
    setupSettings();
}

function showScreen(screenKey) {
    Object.values(SCREENS).forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active-screen');
    });

    // Find screen by key match (e.g. 'game' -> screen-game)
    // Actually our keys allow direct access
    // screenKey might be 'screen-game' string or 'game' key.

    // Let's support ID string
    const target = document.getElementById(screenKey) || SCREENS[screenKey];
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active-screen');
    }
}

// --- 3. GAME LOGIC ---

function startGame() {
    // 1. Read Settings
    timeInputs.radios.forEach(r => { if (r.checked) STATE.timeControl = r.value; });
    if (STATE.timeControl === 'limited') {
        const mins = parseInt(timeInputs.input.value) || 10;
        STATE.initialTime = mins * 60;
        STATE.whiteTime = STATE.initialTime;
        STATE.blackTime = STATE.initialTime;
        document.getElementById('timers-container').classList.remove('hidden');
    } else {
        document.getElementById('timers-container').classList.add('hidden');
    }

    if (STATE.mode === 'ai') {
        timeInputs.diffInputs.forEach(i => { if (i.checked) STATE.aiDifficulty = i.value; });
    }

    // 2. Reset Game State
    game = new Chess();
    STATE.active = true;
    STATE.turn = 'w';
    STATE.selectedSquare = null;
    UI.historyList.innerHTML = '';

    // 3. UI Setup
    showScreen('screen-game');
    updateGameInfo();
    renderBoard();
    updateCapturedPieces();

    // 4. Timer Logic
    stopTimer();
    if (STATE.timeControl === 'limited') {
        startTimer();
    }

    // 5. Online Special
    if (STATE.mode.startsWith('online')) {
        BUTTONS.undo.classList.add('hidden');
        BUTTONS.reset.classList.add('hidden');
        STATE.playerColor = (STATE.mode === 'online_host') ? 'w' : 'b';
        // Wait for connection logic or if already connected, we align.
    } else {
        BUTTONS.undo.classList.remove('hidden');
        BUTTONS.reset.classList.remove('hidden');
        STATE.playerColor = 'w'; // Always White in AI/PvP Local for start
    }
}

function handleGameOver(reason) {
    stopTimer();
    STATE.active = false;
    UI.winnerName.innerText = reason;
    setTimeout(() => showScreen('screen-gameover'), 800);
}

// --- 4. BOARD RENDER & INTERACTION ---

const pieceIcons = {
    'w': { 'p': '<i class="fa-solid fa-chess-pawn piece white"></i>', 'n': '<i class="fa-solid fa-chess-knight piece white"></i>', 'b': '<i class="fa-solid fa-chess-bishop piece white"></i>', 'r': '<i class="fa-solid fa-chess-rook piece white"></i>', 'q': '<i class="fa-solid fa-chess-queen piece white"></i>', 'k': '<i class="fa-solid fa-chess-king piece white"></i>' },
    'b': { 'p': '<i class="fa-solid fa-chess-pawn piece black"></i>', 'n': '<i class="fa-solid fa-chess-knight piece black"></i>', 'b': '<i class="fa-solid fa-chess-bishop piece black"></i>', 'r': '<i class="fa-solid fa-chess-rook piece black"></i>', 'q': '<i class="fa-solid fa-chess-queen piece black"></i>', 'k': '<i class="fa-solid fa-chess-king piece black"></i>' }
};

function renderBoard() {
    UI.board.innerHTML = '';
    const boardData = game.board();

    // Orientation: Flip if Online Joiner
    const isFlipped = (STATE.mode === 'online_join');

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            // Visual indices
            let i = isFlipped ? 7 - r : r;
            let j = isFlipped ? 7 - c : c;

            const div = document.createElement('div');
            const isLight = (i + j) % 2 === 0;
            div.className = `square ${isLight ? 'light' : 'dark'}`;

            const squareId = String.fromCharCode(97 + j) + (8 - i); // algebraic notation
            div.id = squareId; // e.g. "e4"

            const piece = boardData[i][j];
            if (piece) {
                div.innerHTML = pieceIcons[piece.color][piece.type];
            }

            // Click Handler
            div.addEventListener('click', () => onSquareClick(squareId));

            // Highlight Last Move
            const hist = game.history({ verbose: true });
            if (hist.length > 0) {
                const last = hist[hist.length - 1];
                if (last.from === squareId || last.to === squareId) div.classList.add('selected');
            }

            UI.board.appendChild(div);
        }
    }
}

function onSquareClick(squareId) {
    if (!STATE.active) return;

    // Online Checks
    if (STATE.mode.startsWith('online')) {
        if (game.turn() !== STATE.playerColor) return; // Not our turn
        const p = game.get(squareId);
        // Can't select opponent pieces
        if (STATE.selectedSquare === null && p && p.color !== STATE.playerColor) return;
    }

    // AI Checks
    if (STATE.mode === 'ai' && game.turn() === 'b') return; // AI is thinking

    // Logic
    if (STATE.selectedSquare === null) {
        const piece = game.get(squareId);
        if (piece && piece.color === game.turn()) {
            STATE.selectedSquare = squareId;
            highlightSquare(squareId);
            showPossibleMoves(squareId);
        }
    } else {
        const piece = game.get(squareId);
        // Reselect own piece
        if (piece && piece.color === game.turn()) {
            clearHighlights();
            STATE.selectedSquare = squareId;
            highlightSquare(squareId);
            showPossibleMoves(squareId);
        } else {
            // Attempt Move
            tryMakeMove(STATE.selectedSquare, squareId);
        }
    }
}

function tryMakeMove(from, to) {
    const move = game.move({ from: from, to: to, promotion: 'q' }); // Auto promote to queen
    if (move) {
        playSound(move);
        completeMove(move);

        // Online Send
        if (STATE.mode.startsWith('online') && conn && conn.open) {
            conn.send({ type: 'move', move: move });
        }
    } else {
        clearHighlights();
        STATE.selectedSquare = null;
    }
}

function completeMove(move) {
    clearHighlights();
    STATE.selectedSquare = null;
    renderBoard();
    updateCapturedPieces();
    updateGameInfo();

    // Log
    const li = document.createElement('li');
    li.innerHTML = `<strong>${game.turn() === 'b' ? 'White' : 'Black'}:</strong> ${move.san}`;
    UI.historyList.prepend(li);

    // Timer Update
    if (STATE.timeControl === 'limited') updateTimerDisplay();

    // Game Over Check
    if (game.game_over()) {
        let reason = 'Berabere';
        if (game.in_checkmate()) reason = (game.turn() === 'w' ? 'SİYAH' : 'BEYAZ') + ' KAZANDI';
        handleGameOver(reason);
        return;
    }

    // Trigger AI
    if (STATE.mode === 'ai' && game.turn() === 'b') {
        setTimeout(makeAIMove, 400); // Async triggering
    }
}

// --- 5. AI ENGINE (Optimized) ---

function makeAIMove() {
    if (!STATE.active || game.game_over()) return;

    const startTime = Date.now(); // Track think time

    // Use setTimeout 0 to break call stack safely if we had heavy loop, 
    // but here we just run logic and deduct time after.

    let depth = 1;
    if (STATE.aiDifficulty === 'medium') depth = 2;
    if (STATE.aiDifficulty === 'hard') depth = 3;

    // Time Management
    if (STATE.timeControl === 'limited') {
        if (STATE.blackTime < 30) depth = 1; // Panic mode
    }

    const move = getBestMove(depth);

    const elapsed = (Date.now() - startTime) / 1000;
    if (STATE.timeControl === 'limited') {
        STATE.blackTime -= elapsed;
        if (STATE.blackTime < 0) STATE.blackTime = 0;
        updateTimerDisplay();
    }

    if (move) {
        game.move(move);
        playSound(move);
        completeMove(move);
    }
}

function getBestMove(depth) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Sort random to vary games
    moves.sort(() => Math.random() - 0.5);

    let bestMove = null;
    let bestValue = -Infinity;

    // Alpha-Beta Pruning
    for (const move of moves) {
        game.move(move);
        const val = minimax(depth - 1, -Infinity, Infinity, false);
        game.undo();
        if (val > bestValue) {
            bestValue = val;
            bestMove = move;
        }
    }
    return bestMove || moves[0];
}

function minimax(depth, alpha, beta, isMax) {
    if (depth === 0 || game.game_over()) return evaluateBoard(game.board());

    const moves = game.moves();
    if (isMax) {
        let maxEval = -Infinity;
        for (const m of moves) {
            game.move(m);
            const eval = minimax(depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const m of moves) {
            game.move(m);
            const eval = minimax(depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Piece-Square Evaluation (Simplified)
const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
function evaluateBoard(board) {
    let total = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p) {
                let val = pieceValues[p.type];
                // Center Control Bonus (d4, d5, e4, e5)
                if ((r === 3 || r === 4) && (c === 3 || c === 4)) val += 5;

                total += (p.color === 'b' ? val : -val); // AI is Black (Maximizing)? 
                // Wait, minimax uses standard convention: White pos, Black neg usually.
                // Or Relative. Let's assume AI (Black) maximizes Black score.
                // So if AI is Black, we want Positive for Black.
                // Currently: Black pieces add val. So higher result = Better for Black. Correct.
            }
        }
    }
    return total; // If AI is Black, it mocks max(total).
}

// --- 6. UTILITIES (Highlights, Sound, Captured) ---

function highlightSquare(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('selected');
}
function clearHighlights() {
    document.querySelectorAll('.square').forEach(s => s.classList.remove('selected', 'possible-move', 'capture-move'));
}
function showPossibleMoves(sqId) {
    const moves = game.moves({ square: sqId, verbose: true });
    moves.forEach(m => {
        const el = document.getElementById(m.to);
        if (el) {
            if (m.captured) el.classList.add('capture-move');
            else el.classList.add('possible-move');
        }
    });
}
function playSound(move) {
    if (!STATE.soundEnabled) return;
    if (move.captured || move.san.includes('x')) {
        sounds.capture.currentTime = 0;
        sounds.capture.play().catch(e => { });
    } else {
        sounds.move.currentTime = 0;
        sounds.move.play().catch(e => { });
    }
}
function updateCapturedPieces() {
    // Determine visual captured using simple material diff
    const start = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
    const currentW = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
    const currentB = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };

    // Scan board
    const board = game.board();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) (p.color === 'w' ? currentW : currentB)[p.type]++;
    }

    // Gen HTML
    // capturedWhiteEl shows what White LOST (Black captured) ? No, typically shows what White CAPTURED.
    // Near White Timer -> Show Black pieces captured by White.
    // Calculation: Black Started - Black Current = Captured by White.

    let htmlW = '', htmlB = '';

    Object.keys(start).forEach(type => {
        let countB = start[type] - currentB[type]; // Captured by White
        for (let i = 0; i < countB; i++) htmlW += `<span class='captured-piece black-piece'>${pieceIcons['b'][type]}</span>`;

        let countW = start[type] - currentW[type]; // Captured by Black
        for (let i = 0; i < countW; i++) htmlB += `<span class='captured-piece white-piece'>${pieceIcons['w'][type]}</span>`;
    });

    // UI.capturedWhite stores what White player has collected (Black pieces)
    // Wait, naming in HTML: captured-white (near white player).
    // Usually means "Pieces captured BY White".
    // Let's set it.
    if (UI.capturedWhite) UI.capturedWhite.innerHTML = htmlW; // Black pieces
    if (UI.capturedBlack) UI.capturedBlack.innerHTML = htmlB; // White pieces
}

// --- 7. TIMERS ---
function startTimer() {
    stopTimer();
    STATE.timerInterval = setInterval(() => {
        if (!STATE.active) return;
        if (game.turn() === 'w') {
            STATE.whiteTime--;
            if (STATE.whiteTime <= 0) handleGameOver("SİYAH (Süre)");
        } else {
            STATE.blackTime--;
            if (STATE.blackTime <= 0) handleGameOver("BEYAZ (Süre)");
        }
        updateTimerDisplay();
    }, 1000);
}
function stopTimer() { clearInterval(STATE.timerInterval); }
function updateTimerDisplay() {
    const fmt = t => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    UI.timerWhite.innerText = fmt(STATE.whiteTime);
    UI.timerBlack.innerText = fmt(STATE.blackTime);

    // Active Highlight
    UI.timerWhite.classList.toggle('active-timer', game.turn() === 'w');
    UI.timerBlack.classList.toggle('active-timer', game.turn() === 'b');
}

// --- 8. EVENTS & SETTINGS ---
function setupEventListeners() {
    BUTTONS.enter.onclick = () => showScreen('screen-mode');
    BUTTONS.backMode.onclick = () => showScreen('screen-intro');

    BUTTONS.modeAI.onclick = () => { STATE.mode = 'ai'; setModeBtn(BUTTONS.modeAI); };
    BUTTONS.modePvP.onclick = () => { STATE.mode = 'pvp'; setModeBtn(BUTTONS.modePvP); };

    BUTTONS.startGame.onclick = startGame;
    BUTTONS.home.onclick = () => { STATE.active = false; showScreen('screen-intro'); };
    BUTTONS.gameoverHome.onclick = () => showScreen('screen-intro');
    BUTTONS.playAgain.onclick = () => {
        if (STATE.mode.startsWith('online')) {
            if (conn && conn.open) {
                conn.send({ type: 'rematch_request' });
                UI.notification.classList.remove('hidden');
                UI.notification.innerHTML = 'İstek gönderildi...';
            }
        } else startGame();
    };

    BUTTONS.undo.onclick = () => { if (STATE.active) { game.undo(); game.undo(); renderBoard(); } };
    BUTTONS.reset.onclick = () => { if (confirm('Yeniden?')) startGame(); };

    // Settings
    BUTTONS.settings.onclick = () => showScreen('screen-settings');
    BUTTONS.settingsClose.onclick = () => showScreen(STATE.active ? 'screen-game' : 'screen-intro');

    // Online
    BUTTONS.modeOnline.onclick = () => showScreen('screen-online');
    BUTTONS.backOnline.onclick = () => showScreen('screen-mode');
    BUTTONS.createRoom.onclick = initHost;
    BUTTONS.joinRoom.onclick = initJoin;
    BUTTONS.copyCode.onclick = () => navigator.clipboard.writeText(myId || '');

    BUTTONS.acceptRematch.onclick = () => {
        UI.notification.classList.add('hidden');
        if (conn) conn.send({ type: 'game_start' });
        startGame();
    };
    BUTTONS.closeNotification.onclick = () => UI.notification.classList.add('hidden');
}

function setModeBtn(btn) {
    BUTTONS.modeAI.classList.remove('selected');
    BUTTONS.modePvP.classList.remove('selected');
    document.getElementById('difficulty-area').classList.add('hidden');
    btn.classList.add('selected');
    if (btn === BUTTONS.modeAI) document.getElementById('difficulty-area').classList.remove('hidden');
}

function setupSettings() {
    // 3D Toggle
    document.getElementById('view-3d-toggle').addEventListener('change', e => {
        if (e.target.checked) UI.board.classList.add('view-3d');
        else UI.board.classList.remove('view-3d');
    });
    // Themes (Simple class toggle on body)
    document.querySelectorAll('.theme-btn').forEach(b => {
        b.onclick = () => document.body.className = `theme-${b.dataset.theme}`;
    });
}

// --- 9. ONLINE LOGIC ---
function initHost() {
    UI.onlineLobbyInitial.classList.add('hidden');
    UI.onlineLobbyHost.classList.remove('hidden');

    const id = Math.random().toString(36).substr(2, 6).toUpperCase();
    peer = new Peer(id, { debug: 1 });
    peer.on('open', id => { myId = id; UI.myPeerId.innerText = id; });
    peer.on('connection', c => {
        conn = c;
        STATE.mode = 'online_host';
        setupConn();
    });
}

function initJoin() {
    const code = UI.remoteIdInput.value.toUpperCase();
    if (!code) return alert('Kodu girin');
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();
    peer = new Peer(id, { debug: 1 });
    peer.on('open', () => {
        conn = peer.connect(code);
        STATE.mode = 'online_join';
        setupConn();
    });
}

function setupConn() {
    conn.on('open', () => {
        console.log('Connected');
        if (STATE.mode === 'online_join') conn.send({ type: 'join_request' });
    });
    conn.on('data', data => {
        // Handle Data
        if (data.type === 'move') {
            game.move(data.move);
            playSound(data.move);
            completeMove(data.move);
        }
        else if (data.type === 'join_request') {
            alert('Rakip bağlandı! Başlıyoruz.');
            conn.send({ type: 'game_start' });
            startGame();
        }
        else if (data.type === 'game_start') {
            startGame();
            alert('Oyun başladı!');
        }
        else if (data.type === 'rematch_request') {
            UI.notification.innerHTML = 'Rakip tekrar oynamak istiyor! <button id="temp-accept" style="margin-left:10px;">Kabul</button>';
            UI.notification.classList.remove('hidden');
            document.getElementById('temp-accept').onclick = () => {
                conn.send({ type: 'game_start' });
                startGame();
                UI.notification.classList.add('hidden');
            };
        }
    });
    conn.on('close', () => { alert('Bağlantı koptu.'); showScreen('screen-intro'); });
}

function updateGameInfo() {
    let t = game.turn();
    let label = t === 'w' ? "Sıra: Beyaz" : "Sıra: Siyah";
    UI.turnText.innerText = label;
    UI.turnIcon.innerHTML = pieceIcons[t]['p'];
}


// --- RUN ---
init();

