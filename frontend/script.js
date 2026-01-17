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

    // Backend URL
    const backendUrl = 'https://apple-word-game.a-human-being.workers.dev';

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
    let iceCandidateQueue = [];

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
        menuDiv.classList.add('hidden');
        multiplayerMenuDiv.classList.remove('hidden');
        multiplayerMenuDiv.style.display = 'flex'; // Force display
    }

    async function startSinglePlayerGame() {
        gameMode = 'single';
        menuDiv.classList.add('hidden');
        multiplayerMenuDiv.classList.add('hidden');
        gameContainerDiv.classList.remove('hidden');
        gameContainerDiv.style.display = 'flex'; // Force display
        gameModeTitle.textContent = 'Single Player';
        await fetchFinalWord();
        updateHistory();
        setTurn(true);
    }

    // --- Core Game Logic ---
    async function fetchFinalWord() {
        try {
            const response = await fetch(`${backendUrl}/api/get-word`);
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

            if (gameMode === 'multi' && dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(JSON.stringify({ type: 'word', word: newWord }));
            }

            if (newWord === finalWord.toLowerCase()) {
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
            const response = await fetch(`${backendUrl}/api/get-next-word`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wordChain: history, finalWord }),
            });
            if (!response.ok) throw new Error('AI failed to respond');
            const data = await response.json();
            const aiWord = data.word.toLowerCase();

            history.push(aiWord);
            updateHistory();

            if (aiWord === finalWord.toLowerCase()) {
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
        gameContainerDiv.style.display = 'flex';
        gameModeTitle.textContent = 'Multiplayer';
        gameMode = 'multi';

        await fetchFinalWord(); // Fetch the word

        // Setup WebSocket and wait for it to open
        await setupWebSocket();

        // Setup peer connection and CREATE data channel (creator only)
        setupPeerConnection(true); // true = creator

        // Set the final word on the backend for the other player to fetch
        await fetch(`${backendUrl}/game/${gameCode}/setFinalWord`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: finalWord }),
        });

        updateHistory();
        // Don't enable turn yet - wait for data channel to open
        isMyTurn = true;
        wordInput.disabled = true; // Will be enabled when data channel opens
        submitButton.disabled = true;
        turnIndicatorDiv.textContent = "Waiting for opponent to join... (Share code: " + gameCode + ")";

        // Wait for player-joined message before creating offer
        // This ensures both players are connected before WebRTC negotiation
    }

    async function joinMultiplayerGame() {
        gameCode = gameCodeInput.value.trim().toUpperCase();
        if (!gameCode) return alert('Please enter a game code.');

        multiplayerMenuDiv.classList.add('hidden');
        gameContainerDiv.classList.remove('hidden');
        gameContainerDiv.style.display = 'flex';
        gameModeTitle.textContent = 'Multiplayer';
        gameMode = 'multi';

        // Fetch the final word from the backend
        const response = await fetch(`${backendUrl}/game/${gameCode}/getFinalWord`);
        const data = await response.json();
        finalWord = data.word;
        finalWordSpan.textContent = finalWord;

        // Setup WebSocket and wait for connection
        await setupWebSocket();
        
        // Setup peer connection but DON'T create data channel (joiner receives it)
        setupPeerConnection(false); // false = joiner
        
        updateHistory();
        isMyTurn = false;
        wordInput.disabled = true;
        submitButton.disabled = true;
        turnIndicatorDiv.textContent = "Waiting for connection...";
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
                    // If we're the creator and a second player joined, send the offer now
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
                    
                    // Process any queued ICE candidates
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
                    
                    // Process any queued ICE candidates
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
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
                console.log('Sent ICE candidate');
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.iceConnectionState);
        };

        // For the joiner - receive the data channel
        peerConnection.ondatachannel = (event) => {
            console.log('Received data channel from creator');
            dataChannel = event.channel;
            setupDataChannel();
        };

        // For the creator only - create the data channel
        if (isCreator) {
            dataChannel = peerConnection.createDataChannel('game');
            setupDataChannel();
            console.log('Created data channel as creator');
        } else {
            console.log('Waiting to receive data channel as joiner');
        }
    }

    function setupDataChannel() {
        dataChannel.onopen = () => {
            console.log('Data channel is open!');
            // Enable input once data channel is ready
            if (isMyTurn) {
                wordInput.disabled = false;
                submitButton.disabled = false;
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
                updateHistory();
                if (message.word === finalWord.toLowerCase()) {
                    endGame('Your opponent reached the final word!');
                } else {
                    setTurn(true);
                }
            }
        };
    }
});
