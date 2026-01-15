document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const menuDiv = document.getElementById('menu');
    const singlePlayerBtn = document.getElementById('single-player-btn');
    const multiplayerBtn = document.getElementById('multiplayer-btn');
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

    // Game State
    let history = ['apple'];
    let finalWord = '';
    let gameMode = null; // 'single' or 'multi'
    let isMyTurn = true;

    // Multiplayer State
    let peerConnection;
    let dataChannel;
    let gameCode;
    let socket;

    // --- Event Listeners ---
    singlePlayerBtn.addEventListener('click', startSinglePlayerGame);
    multiplayerBtn.addEventListener('click', showMultiplayerMenu);
    createGameBtn.addEventListener('click', createMultiplayerGame);
    joinGameBtn.addEventListener('click', joinMultiplayerGame);
    submitButton.addEventListener('click', handleUserInput);
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });

    // --- Game Mode Selection ---
    function showMultiplayerMenu() {
        menuDiv.style.display = 'none';
        multiplayerMenuDiv.style.display = 'flex';
    }

    async function startSinglePlayerGame() {
        gameMode = 'single';
        menuDiv.style.display = 'none';
        multiplayerMenuDiv.style.display = 'none';
        gameContainerDiv.style.display = 'block';
        gameModeTitle.textContent = 'Single Player';
        await fetchFinalWord();
        updateHistory();
        setTurn(true);
    }

    // --- Core Game Logic ---
    async function fetchFinalWord() {
        try {
            // CORRECTED ENDPOINT
            const response = await fetch('/api/get-word');
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
        wordHistoryDiv.innerHTML = history.map(word => `<p>${word}</p>`).join('');
        wordHistoryDiv.scrollTop = wordHistoryDiv.scrollHeight;
    }

    function handleUserInput() {
        if (!isMyTurn) return;
        const newWord = wordInput.value.trim().toLowerCase();
        if (newWord && !history.includes(newWord)) {
            history.push(newWord);
            updateHistory();
            wordInput.value = '';

            if (gameMode === 'multi' && dataChannel) {
                dataChannel.send(JSON.stringify({ type: 'word', word: newWord }));
            }

            if (newWord === finalWord) {
                endGame('You reached the final word! 🎉');
            } else {
                setTurn(false);
                if (gameMode === 'single') {
                    setTimeout(getAiTurn, 1000);
                }
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
        setTurn(false); // Disable input
    }

    async function getAiTurn() {
        try {
            // CORRECTED ENDPOINT
            const response = await fetch('/api/get-next-word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wordChain: history, finalWord }),
            });
            if (!response.ok) throw new Error('AI failed to respond');
            const data = await response.json();
            const aiWord = data.word.toLowerCase();

            history.push(aiWord);
            updateHistory();

            if (aiWord === finalWord) {
                endGame('The AI reached the final word!');
            } else {
                setTurn(true);
            }
        } catch (error) {
            console.error('Error getting AI turn:', error);
        }
    }

    // --- Multiplayer & WebRTC Logic ---
    function generateGameCode() {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    async function createMultiplayerGame() {
        gameCode = generateGameCode();
        gameCodeDisplay.textContent = `Game Code: ${gameCode}`;

        multiplayerMenuDiv.classList.add('hidden');
        gameContainerDiv.classList.remove('hidden');
        gameModeTitle.textContent = 'Multiplayer';
        gameMode = 'multi';

        setupWebSocket();
        setupPeerConnection();

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        await fetchFinalWord(); // Fetch the word

        // Wait for websocket to be open before sending offer and setting the word on the backend
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'offer', sdp: peerConnection.localDescription }));
            // Set the final word on the backend for the other player to fetch
            fetch(`/game/${gameCode}/setFinalWord`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: finalWord }),
            });
        };

        updateHistory();
        setTurn(true); // Creator goes first
    }

    async function joinMultiplayerGame() {
        gameCode = gameCodeInput.value.trim().toUpperCase();
        if (!gameCode) return alert('Please enter a game code.');

        multiplayerMenuDiv.classList.add('hidden');
        gameContainerDiv.classList.remove('hidden');
        gameModeTitle.textContent = 'Multiplayer';
        gameMode = 'multi';

        // Fetch the final word from the backend
        const response = await fetch(`/game/${gameCode}/getFinalWord`);
        const data = await response.json();
        finalWord = data.word;
        finalWordSpan.textContent = finalWord;

        setupWebSocket();
        setupPeerConnection();
        updateHistory();
        setTurn(false); // Joiner goes second
    }

    function setupWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // CORRECTED WEBSOCKET URL
        const wsUrl = `${wsProtocol}//${window.location.host}/game/${gameCode}/websocket`;
        socket = new WebSocket(wsUrl);

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'offer') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: 'answer', sdp: peerConnection.localDescription }));
            } else if (message.type === 'answer') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
            } else if (message.type === 'candidate') {
                await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
        };
    }

    function setupPeerConnection() {
        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
            }
        };

        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel();
        };

        dataChannel = peerConnection.createDataChannel('game');
        setupDataChannel();
    }

    function setupDataChannel() {
        dataChannel.onopen = () => console.log('Data channel is open!');

        dataChannel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'word') {
                history.push(message.word);
                updateHistory();
                if (message.word === finalWord) {
                    endGame('Your opponent reached the final word!');
                } else {
                    setTurn(true);
                }
            }
        };
    }
});