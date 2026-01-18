document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const menuDiv = document.getElementById('menu');
    const singlePlayerBtn = document.getElementById('single-player-btn');
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    const statsBtn = document.getElementById('stats-btn');
    const replaysBtn = document.getElementById('replays-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const statsModal = document.getElementById('stats-modal');
    const replaysModal = document.getElementById('replays-modal');
    const replayViewerModal = document.getElementById('replay-viewer-modal');
    const definitionModal = document.getElementById('definition-modal');
    const closeModal = document.querySelector('.close-modal');
    const closeStatsModal = document.querySelector('.close-stats-modal');
    const closeReplaysModal = document.querySelector('.close-replays-modal');
    const closeReplayViewerModal = document.querySelector('.close-replay-viewer-modal');
    const closeDefinitionModal = document.querySelector('.close-definition-modal');
    
    // Settings Elements
    const colorThemeSelect = document.getElementById('color-theme-select');
    const themeToggle = document.getElementById('theme-toggle');
    const backgroundSelect = document.getElementById('background-select');
    const customBgUpload = document.getElementById('custom-bg-upload');
    const bgImageInput = document.getElementById('bg-image-input');
    const clearBgBtn = document.getElementById('clear-bg-btn');
    const autoScrollToggle = document.getElementById('auto-scroll-toggle');
    const difficultySelect = document.getElementById('difficulty-select');
    const aiSpeedSelect = document.getElementById('ai-speed-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    const animationSpeedToggle = document.getElementById('animation-speed-toggle');
    const timerToggle = document.getElementById('timer-toggle');
    const confettiToggle = document.getElementById('confetti-toggle');
    const saveReplaysToggle = document.getElementById('save-replays-toggle');
    
    // Game Elements
    const timerDisplay = document.getElementById('timer-display');
    const timerValue = document.getElementById('timer-value');
    const backFromMpBtn = document.getElementById('back-from-mp-btn');
    const backFromGameBtn = document.getElementById('back-from-game-btn');
    const multiplayerMenuDiv = document.getElementById('multiplayer-menu');
    const createGameBtn = document.getElementById('create-game-btn');
    const joinGameBtn = document.getElementById('join-game-btn');
    const gameCodeInput = document.getElementById('game-code-input');
    const gameContainerDiv = document.getElementById('game-container');
    const gameModeTitle = document.getElementById('game-mode-title');
    const finalWordSpan = document.getElementById('final-word');
    const wordHistoryDiv = document.getElementById('word-history');
    const turnIndicatorDiv = document.getElementById('turn-indicator');
    const wordInput = document.getElementById('word-input');
    const submitButton = document.getElementById('submit-word');
    const gameCodeDisplay = document.getElementById('game-code-display');
    const newWordBtn = document.getElementById('new-word-btn');
    
    // Chat Elements
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    
    // Confetti Canvas
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');

    // Backend URL
    const backendUrl = 'https://apple-word-game.a-human-being.workers.dev';

    // Game State
    let history = ['apple'];
    let finalWord = '';
    let gameMode = null;
    let isMyTurn = true;
    let gameTimer = null;
    let gameStartTime = 0;
    let currentGameActions = []; // For replay recording

    // Multiplayer State
    let peerConnection;
    let dataChannel;
    let gameCode;
    let socket;
    let iceCandidateQueue = [];

    // Statistics
    let stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        bestTime: null,
        totalWords: 0,
        shortestChain: null,
        totalPlaytime: 0
    };

    // --- Event Listeners ---
    singlePlayerBtn.addEventListener('click', startSinglePlayerGame);
    multiplayerBtn.addEventListener('click', showMultiplayerMenu);
    statsBtn.addEventListener('click', openStatsModal);
    replaysBtn.addEventListener('click', openReplaysModal);
    createGameBtn.addEventListener('click', createMultiplayerGame);
    joinGameBtn.addEventListener('click', joinMultiplayerGame);
    submitButton.addEventListener('click', handleUserInput);
    newWordBtn.addEventListener('click', handleNewWord);
    
    // Settings
    settingsBtn.addEventListener('click', openSettings);
    closeModal.addEventListener('click', closeSettings);
    closeStatsModal.addEventListener('click', closeStatsModal_);
    closeReplaysModal.addEventListener('click', closeReplaysModal_);
    closeReplayViewerModal.addEventListener('click', closeReplayViewerModal_);
    closeDefinitionModal.addEventListener('click', closeDefinitionModal_);
    
    document.getElementById('clear-replays-btn').addEventListener('click', clearAllReplays);
                document.getElementById('replay-play-btn').addEventListener('click', playReplay);
    document.getElementById('replay-pause-btn').addEventListener('click', pauseReplay);
    document.getElementById('replay-restart-btn').addEventListener('click', restartReplay);
    document.getElementById('replay-download-btn').addEventListener('click', downloadReplayAsVideo);
    
    colorThemeSelect.addEventListener('change', changeColorTheme);
    themeToggle.addEventListener('change', toggleTheme);
    backgroundSelect.addEventListener('change', changeBackground);
    bgImageInput.addEventListener('change', uploadCustomBackground);
    clearBgBtn.addEventListener('click', clearCustomBackground);
    autoScrollToggle.addEventListener('change', saveSettings);
    difficultySelect.addEventListener('change', saveSettings);
    aiSpeedSelect.addEventListener('change', saveSettings);
    fontSizeSelect.addEventListener('change', changeFontSize);
    animationSpeedToggle.addEventListener('change', changeAnimationSpeed);
    timerToggle.addEventListener('change', toggleTimer);
    confettiToggle.addEventListener('change', saveSettings);
    saveReplaysToggle.addEventListener('change', saveSettings);
    
    document.getElementById('reset-stats-btn').addEventListener('click', resetStatistics);
    
    backFromMpBtn.addEventListener('click', backToHome);
    backFromGameBtn.addEventListener('click', backToHome);
    
    // Chat
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettings();
        if (e.target === statsModal) closeStatsModal_();
        if (e.target === replaysModal) closeReplaysModal_();
        if (e.target === replayViewerModal) closeReplayViewerModal_();
        if (e.target === definitionModal) closeDefinitionModal_();
    });
    
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserInput();
    });

    // Load saved preferences
    loadAllSettings();
    loadStatistics();

    // === SETTINGS FUNCTIONS ===
    function openSettings() {
        settingsModal.classList.remove('hidden');
        settingsModal.style.display = 'flex';
    }

    function closeSettings() {
        settingsModal.classList.add('hidden');
        settingsModal.style.display = 'none';
    }

    function openStatsModal() {
        updateStatsDisplay();
        statsModal.classList.remove('hidden');
        statsModal.style.display = 'flex';
    }

    function closeStatsModal_() {
        statsModal.classList.add('hidden');
        statsModal.style.display = 'none';
    }

    function closeDefinitionModal_() {
        definitionModal.classList.add('hidden');
        definitionModal.style.display = 'none';
    }

    function openReplaysModal() {
        displayReplaysList();
        replaysModal.classList.remove('hidden');
        replaysModal.style.display = 'flex';
    }

    function closeReplaysModal_() {
        replaysModal.classList.add('hidden');
        replaysModal.style.display = 'none';
    }

    function closeReplayViewerModal_() {
        if (window.replayInterval) {
            clearInterval(window.replayInterval);
            window.replayInterval = null;
        }
        replayViewerModal.classList.add('hidden');
        replayViewerModal.style.display = 'none';
    }

    function changeColorTheme() {
        const theme = colorThemeSelect.value;
        document.body.classList.remove('theme-ocean', 'theme-forest', 'theme-sunset', 'theme-cherry');
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        localStorage.setItem('colorTheme', theme);
    }

    function toggleTheme() {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }

    function changeBackground() {
        const bg = backgroundSelect.value;
        document.body.classList.remove('bg-gradient1', 'bg-gradient2', 'bg-gradient3', 'bg-pattern1', 'bg-pattern2', 'bg-custom');
        
        if (bg === 'custom') {
            customBgUpload.classList.remove('hidden');
            const savedBg = localStorage.getItem('customBackground');
            if (savedBg) {
                document.body.style.backgroundImage = `url(${savedBg})`;
                document.body.classList.add('bg-custom');
            }
        } else {
            customBgUpload.classList.add('hidden');
            document.body.style.backgroundImage = '';
            if (bg !== 'none') {
                document.body.classList.add(`bg-${bg}`);
            }
        }
        localStorage.setItem('background', bg);
    }

    function uploadCustomBackground(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                document.body.style.backgroundImage = `url(${dataUrl})`;
                document.body.classList.add('bg-custom');
                localStorage.setItem('customBackground', dataUrl);
            };
            reader.readAsDataURL(file);
        }
    }

    function clearCustomBackground() {
        document.body.style.backgroundImage = '';
        document.body.classList.remove('bg-custom');
        localStorage.removeItem('customBackground');
        backgroundSelect.value = 'none';
        bgImageInput.value = '';
    }

    function changeFontSize() {
        const size = fontSizeSelect.value;
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);
        localStorage.setItem('fontSize', size);
    }

    function changeAnimationSpeed() {
        if (animationSpeedToggle.checked) {
            document.body.classList.add('anim-slow');
            localStorage.setItem('animSpeed', 'slow');
        } else {
            document.body.classList.remove('anim-slow');
            localStorage.setItem('animSpeed', 'fast');
        }
    }

    function toggleTimer() {
        localStorage.setItem('timerEnabled', timerToggle.checked);
        if (gameMode && timerToggle.checked) {
            startTimer();
        } else if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
            timerDisplay.classList.add('hidden');
        }
    }

    function saveSettings() {
        localStorage.setItem('autoScroll', autoScrollToggle.checked);
        localStorage.setItem('difficulty', difficultySelect.value);
        localStorage.setItem('aiSpeed', aiSpeedSelect.value);
        localStorage.setItem('confettiEnabled', confettiToggle.checked);
        localStorage.setItem('saveReplays', saveReplaysToggle.checked);
    }

    function loadAllSettings() {
        // Theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
        
        // Color Theme
        const colorTheme = localStorage.getItem('colorTheme');
        if (colorTheme) {
            colorThemeSelect.value = colorTheme;
            if (colorTheme !== 'default') {
                document.body.classList.add(`theme-${colorTheme}`);
            }
        }
        
        // Background
        const background = localStorage.getItem('background');
        if (background) {
            backgroundSelect.value = background;
            changeBackground();
        }
        
        // Auto-scroll
        const autoScroll = localStorage.getItem('autoScroll');
        if (autoScroll !== null) {
            autoScrollToggle.checked = autoScroll === 'true';
        }
        
        // Difficulty
        const difficulty = localStorage.getItem('difficulty');
        if (difficulty) difficultySelect.value = difficulty;
        
        // AI Speed
        const aiSpeed = localStorage.getItem('aiSpeed');
        if (aiSpeed) aiSpeedSelect.value = aiSpeed;
        
        // Font size
        const fontSize = localStorage.getItem('fontSize');
        if (fontSize) {
            fontSizeSelect.value = fontSize;
            document.body.classList.add(`font-${fontSize}`);
        } else {
            document.body.classList.add('font-medium');
        }
        
        // Animation speed
        const animSpeed = localStorage.getItem('animSpeed');
        if (animSpeed === 'slow') {
            animationSpeedToggle.checked = true;
            document.body.classList.add('anim-slow');
        }
        
        // Timer
        const timerEnabled = localStorage.getItem('timerEnabled');
        if (timerEnabled === 'true') timerToggle.checked = true;
        
        // Confetti
        const confettiEnabled = localStorage.getItem('confettiEnabled');
        if (confettiEnabled !== null) {
            confettiToggle.checked = confettiEnabled === 'true';
        }
        
        // Save Replays
        const saveReplays = localStorage.getItem('saveReplays');
        if (saveReplays !== null) {
            saveReplaysToggle.checked = saveReplays === 'true';
        }
    }

    // === STATISTICS FUNCTIONS ===
    function loadStatistics() {
        const saved = localStorage.getItem('gameStats');
        if (saved) {
            stats = JSON.parse(saved);
        }
    }

    function saveStatistics() {
        localStorage.setItem('gameStats', JSON.stringify(stats));
    }

    function updateStatsDisplay() {
        document.getElementById('games-played').textContent = stats.gamesPlayed;
        document.getElementById('games-won').textContent = stats.gamesWon;
        
        const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
        document.getElementById('win-rate').textContent = winRate + '%';
        
        if (stats.bestTime) {
            const mins = Math.floor(stats.bestTime / 60);
            const secs = stats.bestTime % 60;
            document.getElementById('best-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            document.getElementById('best-time').textContent = '--:--';
        }
        
        const avgWords = stats.gamesPlayed > 0 ? Math.round(stats.totalWords / stats.gamesPlayed) : 0;
        document.getElementById('avg-words').textContent = avgWords;
        
        document.getElementById('shortest-chain').textContent = stats.shortestChain || '--';
        
        const hours = Math.floor(stats.totalPlaytime / 3600);
        const mins = Math.floor((stats.totalPlaytime % 3600) / 60);
        document.getElementById('total-playtime').textContent = `${hours}h ${mins}m`;
    }

    function recordGameEnd(won, wordsUsed, timeTaken) {
        stats.gamesPlayed++;
        if (won) stats.gamesWon++;
        
        stats.totalWords += wordsUsed;
        
        if (!stats.shortestChain || wordsUsed < stats.shortestChain) {
            stats.shortestChain = wordsUsed;
        }
        
        if (timeTaken && (!stats.bestTime || timeTaken < stats.bestTime)) {
            stats.bestTime = timeTaken;
        }
        
        if (timeTaken) {
            stats.totalPlaytime += timeTaken;
        }
        
        saveStatistics();
    }

    function resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            stats = {
                gamesPlayed: 0,
                gamesWon: 0,
                bestTime: null,
                totalWords: 0,
                shortestChain: null,
                totalPlaytime: 0
            };
            saveStatistics();
            updateStatsDisplay();
        }
    }

    // === TIMER FUNCTIONS ===
    function startTimer() {
        if (!timerToggle.checked) return;
        
        timerDisplay.classList.remove('hidden');
        gameStartTime = Date.now();
        
        if (gameTimer) clearInterval(gameTimer);
        
        gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function getElapsedTime() {
        if (!gameStartTime) return null;
        return Math.floor((Date.now() - gameStartTime) / 1000);
    }

    // === CONFETTI FUNCTIONS ===
    function triggerConfetti() {
        if (!confettiToggle.checked) return;
        
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        
        const particles = [];
        const particleCount = 150;
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * confettiCanvas.width,
                y: Math.random() * confettiCanvas.height - confettiCanvas.height,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * 3 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 5,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        function animate() {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            
            let activeParticles = 0;
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.rotation += p.rotationSpeed;
                
                if (p.y < confettiCanvas.height) {
                    activeParticles++;
                    
                    confettiCtx.save();
                    confettiCtx.translate(p.x, p.y);
                    confettiCtx.rotate((p.rotation * Math.PI) / 180);
                    confettiCtx.fillStyle = p.color;
                    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    confettiCtx.restore();
                }
            });
            
            if (activeParticles > 0) {
                requestAnimationFrame(animate);
            } else {
                confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            }
        }
        
        animate();
    }

    // === WORD DEFINITION FUNCTIONS ===
    async function showWordDefinition(word, isGameStart = false) {
        document.getElementById('definition-word').textContent = word;
        document.getElementById('definition-content').innerHTML = '<p class="definition-loading">Loading definition...</p>';
        
        definitionModal.classList.remove('hidden');
        definitionModal.style.display = 'flex';
        
        // Store if this is a game start definition
        window.isGameStartDefinition = isGameStart;
        
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (!response.ok) {
                throw new Error('Definition not found');
            }
            
            const data = await response.json();
            const entry = data[0];
            
            let html = '';
            
            if (isGameStart) {
                html += '<p style="background-color: var(--button-bg); color: var(--button-text); padding: 10px; border-radius: 5px; text-align: center; font-weight: bold;">🎯 Your Goal: Reach this word!</p>';
            }
            
            if (entry.phonetic) {
                html += `<p><strong>Pronunciation:</strong> ${entry.phonetic}</p>`;
            }
            
            entry.meanings.forEach(meaning => {
                html += `<h3>${meaning.partOfSpeech}</h3>`;
                meaning.definitions.slice(0, 2).forEach(def => {
                    html += `<p><strong>•</strong> ${def.definition}</p>`;
                    if (def.example) {
                        html += `<p style="margin-left: 20px; font-style: italic;">"${def.example}"</p>`;
                    }
                });
            });
            
            if (isGameStart) {
                html += '<p style="margin-top: 15px; text-align: center; color: #888; font-size: 0.9em;">Close this to start the game</p>';
            }
            
            document.getElementById('definition-content').innerHTML = html;
        } catch (error) {
            let html = `<p>Sorry, couldn't find a definition for "${word}".</p>`;
            if (isGameStart) {
                html += '<p style="margin-top: 15px; text-align: center; color: #888;">Close this to start the game</p>';
            }
            document.getElementById('definition-content').innerHTML = html;
        }
    }

    function closeDefinitionModal_() {
        const wasGameStart = window.isGameStartDefinition;
        window.isGameStartDefinition = false;
        
        definitionModal.classList.add('hidden');
        definitionModal.style.display = 'none';
        
        // If this was a game start definition, now handle game start
        if (wasGameStart) {
            if (gameMode === 'single') {
                setTurn(true);
                if (timerToggle.checked) {
                    startTimer();
                }
            } else if (gameMode === 'multi') {
                // For multiplayer, keep waiting for connection but start timer
                turnIndicatorDiv.textContent = isMyTurn ? "Waiting for opponent to join..." : "Waiting for connection...";
                if (timerToggle.checked) {
                    startTimer();
                }
            }
        }
    }

    // === REPLAY SYSTEM ===
    function saveReplay(gameData) {
        if (!saveReplaysToggle.checked) return;
        
        const replays = JSON.parse(localStorage.getItem('gameReplays') || '[]');
        
        const replay = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            mode: gameData.mode,
            finalWord: gameData.finalWord,
            result: gameData.result,
            duration: gameData.duration,
            actions: gameData.actions
        };
        
        replays.unshift(replay); // Add to beginning
        
        // Keep only last 20 replays
        if (replays.length > 20) {
            replays.pop();
        }
        
        localStorage.setItem('gameReplays', JSON.stringify(replays));
    }

    function displayReplaysList() {
        const replays = JSON.parse(localStorage.getItem('gameReplays') || '[]');
        const replaysListDiv = document.getElementById('replays-list');
        
        if (replays.length === 0) {
            replaysListDiv.innerHTML = '<p class="no-replays">No replays saved yet. Play some games to see them here!</p>';
            return;
        }
        
        let html = '';
        replays.forEach(replay => {
            const resultEmoji = replay.result === 'won' ? '🏆' : '❌';
            const mins = Math.floor(replay.duration / 60);
            const secs = replay.duration % 60;
            const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            html += `
                <div class="replay-item" onclick="viewReplay(${replay.id})">
                    <div class="replay-header">
                        <span class="replay-result">${resultEmoji}</span>
                        <span class="replay-word">${replay.finalWord}</span>
                        <span class="replay-mode">${replay.mode}</span>
                    </div>
                    <div class="replay-details">
                        <span>${replay.date}</span>
                        <span>${timeStr}</span>
                        <span>${replay.actions.length} moves</span>
                    </div>
                </div>
            `;
        });
        
        replaysListDiv.innerHTML = html;
    }

    function viewReplay(replayId) {
        const replays = JSON.parse(localStorage.getItem('gameReplays') || '[]');
        const replay = replays.find(r => r.id === replayId);
        
        if (!replay) return;
        
        // Set up replay viewer
        document.getElementById('replay-title').textContent = replay.finalWord;
        document.getElementById('replay-mode').textContent = replay.mode;
        document.getElementById('replay-result').textContent = replay.result === 'won' ? '🏆 Won' : '❌ Lost';
        
        const mins = Math.floor(replay.duration / 60);
        const secs = replay.duration % 60;
        document.getElementById('replay-duration').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        document.getElementById('replay-date').textContent = replay.date;
        
        // Store current replay
        window.currentReplay = replay;
        window.replayIndex = 0;
        window.replayPlaying = false;
        
        // Reset display
        document.getElementById('replay-word-history').innerHTML = '<p>apple</p>';
        
        // Show viewer
        replaysModal.classList.add('hidden');
        replayViewerModal.classList.remove('hidden');
        replayViewerModal.style.display = 'flex';
    }

    function playReplay() {
        if (!window.currentReplay) return;
        
        window.replayPlaying = true;
        document.getElementById('replay-play-btn').classList.add('hidden');
        document.getElementById('replay-pause-btn').classList.remove('hidden');
        
        const speed = parseFloat(document.getElementById('replay-speed').value);
        const baseDelay = 1000; // 1 second between moves
        const delay = baseDelay / speed;
        
        window.replayInterval = setInterval(() => {
            if (window.replayIndex >= window.currentReplay.actions.length) {
                pauseReplay();
                return;
            }
            
            const action = window.currentReplay.actions[window.replayIndex];
            const historyDiv = document.getElementById('replay-word-history');
            
            const wordP = document.createElement('p');
            wordP.textContent = action.word;
            wordP.style.opacity = '0';
            wordP.style.transition = 'opacity 0.3s';
            historyDiv.appendChild(wordP);
            
            setTimeout(() => {
                wordP.style.opacity = '1';
            }, 50);
            
            historyDiv.scrollTop = historyDiv.scrollHeight;
            
            window.replayIndex++;
        }, delay);
    }

    function pauseReplay() {
        window.replayPlaying = false;
        if (window.replayInterval) {
            clearInterval(window.replayInterval);
            window.replayInterval = null;
        }
        document.getElementById('replay-play-btn').classList.remove('hidden');
        document.getElementById('replay-pause-btn').classList.add('hidden');
    }

    function restartReplay() {
        pauseReplay();
        window.replayIndex = 0;
        document.getElementById('replay-word-history').innerHTML = '<p>apple</p>';
    }

    function clearAllReplays() {
        if (confirm('Are you sure you want to delete all replays? This cannot be undone.')) {
            localStorage.setItem('gameReplays', '[]');
            displayReplaysList();
        }
    }

    async function downloadReplayAsVideo() {
        if (!window.currentReplay) {
            alert('No replay loaded!');
            return;
        }
        
        alert('🎬 Generating video... This may take a moment. The video will download automatically when ready.');
        
        try {
            // We'll use canvas recording to create an MP4
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');
            
            const stream = canvas.captureStream(30); // 30 FPS
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000
            });
            
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `apple-game-replay-${window.currentReplay.finalWord}-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };
            
            mediaRecorder.start();
            
            // Draw frames
            const actions = window.currentReplay.actions;
            const fps = 30;
            const wordDisplayTime = 1000; // 1 second per word
            const framesPerWord = (fps * wordDisplayTime) / 1000;
            
            let currentFrame = 0;
            let currentWordIndex = 0;
            const words = ['apple', ...actions.map(a => a.word)];
            
            function drawFrame() {
                // Background
                ctx.fillStyle = '#1e3a5f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Title
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 32px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Replay: ${window.currentReplay.finalWord}`, canvas.width / 2, 60);
                
                // Word history
                ctx.font = '24px sans-serif';
                const startY = 120;
                const visibleWords = words.slice(0, currentWordIndex + 1);
                
                visibleWords.forEach((word, i) => {
                    const y = startY + (i * 40);
                    if (y < canvas.height - 100) {
                        ctx.fillStyle = i === currentWordIndex ? '#00b4d8' : '#e0e0e0';
                        ctx.fillText(word, canvas.width / 2, y);
                    }
                });
                
                // Progress
                const progress = ((currentWordIndex + 1) / words.length * 100).toFixed(0);
                ctx.fillStyle = '#888';
                ctx.font = '18px sans-serif';
                ctx.fillText(`Progress: ${progress}%`, canvas.width / 2, canvas.height - 40);
                
                currentFrame++;
                
                if (currentFrame >= framesPerWord) {
                    currentFrame = 0;
                    currentWordIndex++;
                }
                
                if (currentWordIndex < words.length) {
                    requestAnimationFrame(drawFrame);
                } else {
                    // Stop recording after a short delay
                    setTimeout(() => {
                        mediaRecorder.stop();
                    }, 1000);
                }
            }
            
            drawFrame();
            
        } catch (error) {
            console.error('Error creating video:', error);
            alert('Sorry, video download failed. Your browser might not support this feature.');
        }
    }

    // Make these functions globally accessible
    window.viewReplay = viewReplay;

    // === CHAT FUNCTIONS ===
    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (!message || !dataChannel || dataChannel.readyState !== 'open') return;
        
        dataChannel.send(JSON.stringify({ type: 'chat', message }));
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message own';
        msgDiv.textContent = `You: ${message}`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        chatInput.value = '';
    }

    function receiveChatMessage(message) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.textContent = `Opponent: ${message}`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // === GAME MODE FUNCTIONS ===
    function showMultiplayerMenu() {
        menuDiv.classList.add('hidden');
        multiplayerMenuDiv.classList.remove('hidden');
        multiplayerMenuDiv.style.display = 'flex';
    }

    function backToHome() {
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
        
        if (socket) {
            socket.close();
            socket = null;
        }
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        if (dataChannel) {
            dataChannel.close();
            dataChannel = null;
        }
        
        history = ['apple'];
        finalWord = '';
        gameMode = null;
        isMyTurn = true;
        gameCode = null;
        iceCandidateQueue = [];
        
        multiplayerMenuDiv.classList.add('hidden');
        gameContainerDiv.classList.add('hidden');
        chatContainer.classList.add('hidden');
        menuDiv.classList.remove('hidden');
        timerDisplay.classList.add('hidden');
        
        wordInput.value = '';
        gameCodeInput.value = '';
        chatMessages.innerHTML = '';
    }

    async function startSinglePlayerGame() {
        gameMode = 'single';
        currentGameActions = [];
        menuDiv.classList.add('hidden');
        multiplayerMenuDiv.classList.add('hidden');
        gameContainerDiv.classList.remove('hidden');
        gameContainerDiv.style.display = 'flex';
        gameModeTitle.textContent = 'Single Player';
        await fetchFinalWord();
        updateHistory();
        
        // Disable input until definition is closed
        wordInput.disabled = true;
        submitButton.disabled = true;
        turnIndicatorDiv.textContent = "Read the definition to start...";
        
        // Show definition automatically
        await showWordDefinition(finalWord, true); // true = game start mode
    }

    // === CORE GAME LOGIC ===
    async function fetchFinalWord() {
        try {
            const difficulty = difficultySelect.value;
            const response = await fetch(`${backendUrl}/api/get-word?difficulty=${difficulty}`);
            if (!response.ok) throw new Error('Failed to fetch final word');
            const data = await response.json();
            finalWord = data.word;
            finalWordSpan.textContent = finalWord;
        } catch (error) {
            console.error('Error fetching final word:', error);
            wordHistoryDiv.innerHTML = '<p>Error starting game.</p>';
        }
    }

    function updateHistory() {
        wordHistoryDiv.innerHTML = history.map(word => 
            `<p onclick="showWordDefinition('${word}')" title="Click for definition">${word}</p>`
        ).join('');
        
        if (autoScrollToggle.checked) {
            wordHistoryDiv.scrollTop = wordHistoryDiv.scrollHeight;
        }
    }

    function handleUserInput() {
        if (!isMyTurn) return;
        const newWord = wordInput.value.trim().toLowerCase();
        
        // Word validation
        if (!newWord) return;
        
        if (history.includes(newWord)) {
            alert('⚠️ Word already used! Try a different word.');
            return;
        }
        
        // Check if trying to skip to final word
        if (newWord === finalWord.toLowerCase() && history.length <= 2) {
            alert('❌ You can\'t skip directly to the final word! Build a word chain first.');
            return;
        }
        
        history.push(newWord);
        currentGameActions.push({ word: newWord, player: 'user', timestamp: Date.now() });
        updateHistory();
        wordInput.value = '';

        if (gameMode === 'multi' && dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ type: 'word', word: newWord }));
        }

        if (newWord === finalWord.toLowerCase()) {
            const elapsed = getElapsedTime();
            recordGameEnd(true, history.length - 1, elapsed);
            saveReplay({
                mode: gameMode === 'single' ? 'Single Player' : 'Multiplayer',
                finalWord: finalWord,
                result: 'won',
                duration: elapsed || 0,
                actions: currentGameActions
            });
            endGame('You reached the final word! 🎉');
            triggerConfetti();
        } else {
            setTurn(false);
            if (gameMode === 'single') {
                getAiTurn();
            }
        }
    }

    function setTurn(myTurn) {
        isMyTurn = myTurn;
        wordInput.disabled = !myTurn;
        submitButton.disabled = !myTurn;
        turnIndicatorDiv.textContent = myTurn ? "Your turn" : "Opponent's turn";
    }

    function endGame(message) {
        wordHistoryDiv.innerHTML += `<p><strong>${message}</strong></p>`;
        setTurn(false);
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
    }

    async function getAiTurn() {
        try {
            const aiDelay = parseInt(aiSpeedSelect.value);
            await new Promise(resolve => setTimeout(resolve, aiDelay));
            
            const response = await fetch(`${backendUrl}/api/get-next-word`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wordChain: history, finalWord }),
            });
            if (!response.ok) throw new Error('AI failed to respond');
            const data = await response.json();
            const aiWord = data.word.toLowerCase();

            history.push(aiWord);
            currentGameActions.push({ word: aiWord, player: 'ai', timestamp: Date.now() });
            updateHistory();

            if (aiWord === finalWord.toLowerCase()) {
                const elapsed = getElapsedTime();
                recordGameEnd(false, history.length - 1, elapsed);
                saveReplay({
                    mode: 'Single Player',
                    finalWord: finalWord,
                    result: 'lost',
                    duration: elapsed || 0,
                    actions: currentGameActions
                });
                endGame('The AI reached the final word!');
            } else {
                setTurn(true);
            }
        } catch (error) {
            console.error('Error getting AI turn:', error);
        }
    }

    async function handleNewWord() {
        history = ['apple'];
        currentGameActions = [];
        await fetchFinalWord();
        updateHistory();
        wordInput.value = '';
        
        if (timerToggle.checked) {
            startTimer();
        }
        
        if (gameMode === 'multi' && dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ type: 'new-word', word: finalWord }));
            
            await fetch(`${backendUrl}/game/${gameCode}/setFinalWord`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: finalWord }),
            });
        }
        
        if (gameMode === 'single') {
            setTurn(true);
        } else if (gameMode === 'multi') {
            if (isMyTurn) {
                setTurn(true);
            } else {
                setTurn(false);
            }
        }
        
        const endMessages = wordHistoryDiv.querySelectorAll('p strong');
        endMessages.forEach(msg => msg.parentElement.remove());
    }

    // === MULTIPLAYER & WEBRTC LOGIC ===
    function generateGameCode() {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    async function createMultiplayerGame() {
        gameCode = generateGameCode();
        currentGameActions = [];
        gameCodeDisplay.textContent = `Game Code: ${gameCode}`;

        multiplayerMenuDiv.classList.add('hidden');
        gameContainerDiv.classList.remove('hidden');
        gameContainerDiv.style.display = 'flex';
        chatContainer.classList.remove('hidden');
        gameModeTitle.textContent = 'Multiplayer';
        gameMode = 'multi';

        await fetchFinalWord();
        await setupWebSocket();
        setupPeerConnection(true);

        await fetch(`${backendUrl}/game/${gameCode}/setFinalWord`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: finalWord }),
        });

        updateHistory();
        isMyTurn = true;
        wordInput.disabled = true;
        submitButton.disabled = true;
        turnIndicatorDiv.textContent = "Read the definition, then wait for opponent...";
        
        // Show definition automatically for multiplayer too
        await showWordDefinition(finalWord, true);
    }

    async function joinMultiplayerGame() {
        gameCode = gameCodeInput.value.trim().toUpperCase();
        currentGameActions = [];
        if (!gameCode) return alert('Please enter a game code.');

        multiplayerMenuDiv.classList.add('hidden');
        gameContainerDiv.classList.remove('hidden');
        gameContainerDiv.style.display = 'flex';
        chatContainer.classList.remove('hidden');
        gameModeTitle.textContent = 'Multiplayer';
        gameMode = 'multi';

        const response = await fetch(`${backendUrl}/game/${gameCode}/getFinalWord`);
        const data = await response.json();
        finalWord = data.word;
        finalWordSpan.textContent = finalWord;

        await setupWebSocket();
        setupPeerConnection(false);
        
        updateHistory();
        isMyTurn = false;
        wordInput.disabled = true;
        submitButton.disabled = true;
        turnIndicatorDiv.textContent = "Read the definition, then wait for connection...";
        
        // Show definition automatically for joiner too
        await showWordDefinition(finalWord, true);
    }

    function setupWebSocket() {
        return new Promise((resolve, reject) => {
            const wsUrl = `${backendUrl.replace(/^http/, 'ws')}/game/${gameCode}/websocket`;
            socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('WebSocket connected!');
                resolve();
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            socket.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                console.log('Received message:', message.type);

                if (message.type === 'player-joined') {
                    console.log('Player joined! Count:', message.count);
                    if (gameMode === 'multi' && peerConnection && !peerConnection.remoteDescription) {
                        console.log('Second player joined, creating and sending offer...');
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        socket.send(JSON.stringify({ type: 'offer', sdp: peerConnection.localDescription }));
                    }
                    return;
                }

                if (message.type === 'offer') {
                    console.log('Setting remote description (offer)');
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
                    
                    while (iceCandidateQueue.length > 0) {
                        const candidate = iceCandidateQueue.shift();
                        try {
                            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                            console.log('Added queued ICE candidate');
                        } catch (e) {
                            console.error('Error adding queued ICE candidate:', e);
                        }
                    }
                    
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    console.log('Sending answer');
                    socket.send(JSON.stringify({ type: 'answer', sdp: peerConnection.localDescription }));
                } else if (message.type === 'answer') {
                    console.log('Setting remote description (answer)');
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
                    
                    while (iceCandidateQueue.length > 0) {
                        const candidate = iceCandidateQueue.shift();
                        try {
                            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                            console.log('Added queued ICE candidate');
                        } catch (e) {
                            console.error('Error adding queued ICE candidate:', e);
                        }
                    }
                } else if (message.type === 'candidate') {
                    console.log('Received ICE candidate');
                    try {
                        if (peerConnection.remoteDescription) {
                            await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
                            console.log('Added ICE candidate');
                        } else {
                            console.log('Queuing ICE candidate (no remote description yet)');
                            iceCandidateQueue.push(message.candidate);
                        }
                    } catch (e) {
                        console.error('Error adding ICE candidate:', e);
                    }
                }
            };
        });
    }

    function setupPeerConnection(isCreator) {
        peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
                console.log('Sent ICE candidate');
            } else if (!event.candidate) {
                console.log('All ICE candidates sent');
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
                console.log('✅ Peer connection established successfully!');
            } else if (peerConnection.connectionState === 'failed') {
                console.error('❌ Peer connection failed');
                alert('Connection failed. Please try creating a new game.');
            } else if (peerConnection.connectionState === 'disconnected') {
                console.warn('⚠️ Peer connection disconnected');
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.iceConnectionState);
            if (peerConnection.iceConnectionState === 'failed') {
                console.error('ICE connection failed, attempting restart...');
                peerConnection.restartIce();
            }
        };

        peerConnection.ondatachannel = (event) => {
            console.log('Received data channel from creator');
            dataChannel = event.channel;
            setupDataChannel();
        };

        if (isCreator) {
            dataChannel = peerConnection.createDataChannel('game', {
                ordered: true,
                maxRetransmits: 3
            });
            setupDataChannel();
            console.log('Created data channel as creator');
        } else {
            console.log('Waiting to receive data channel as joiner');
        }
    }

    function setupDataChannel() {
        dataChannel.onopen = () => {
            console.log('Data channel is open!');
            if (isMyTurn) {
                wordInput.disabled = false;
                submitButton.disabled = false;
                turnIndicatorDiv.textContent = "Your turn";
            } else {
                turnIndicatorDiv.textContent = "Opponent's turn";
            }
        };

        dataChannel.onclose = () => {
            console.log('Data channel closed');
        };

        dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };

        dataChannel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'word') {
                history.push(message.word);
                currentGameActions.push({ word: message.word, player: 'opponent', timestamp: Date.now() });
                updateHistory();
                if (message.word === finalWord.toLowerCase()) {
                    const elapsed = getElapsedTime();
                    recordGameEnd(false, history.length - 1, elapsed);
                    saveReplay({
                        mode: 'Multiplayer',
                        finalWord: finalWord,
                        result: 'lost',
                        duration: elapsed || 0,
                        actions: currentGameActions
                    });
                    endGame('Your opponent reached the final word!');
                } else {
                    setTurn(true);
                }
            } else if (message.type === 'new-word') {
                finalWord = message.word;
                finalWordSpan.textContent = finalWord;
                history = ['apple'];
                updateHistory();
                wordInput.value = '';
                
                const endMessages = wordHistoryDiv.querySelectorAll('p strong');
                endMessages.forEach(msg => msg.parentElement.remove());
                
                setTurn(false);
            } else if (message.type === 'chat') {
                receiveChatMessage(message.message);
            }
        };
    }

    // Make showWordDefinition globally accessible
    window.showWordDefinition = showWordDefinition;
});