export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/websocket')) {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      await this.handleSession(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleSession(webSocket) {
    this.sessions.push(webSocket);

    webSocket.addEventListener('message', async (message) => {
      this.broadcast(message.data, webSocket);
    });

    webSocket.addEventListener('close', () => {
      this.sessions = this.sessions.filter((session) => session !== webSocket);
    });

    webSocket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  broadcast(message, sender) {
    this.sessions.forEach((session) => {
      if (session !== sender) {
        try {
          session.send(message);
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    });
  }
}

async function handleGenerateWord(request, env) {
  const GEMINI_API_KEY = env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = "Generate a single, random, family-friendly, one-word noun. Do not include any explanation, just the word itself.";

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Gemini API error: ${errorText}`, { status: response.status });
    }

    const data = await response.json();
    const word = data.candidates[0].content.parts[0].text.trim();

    return new Response(JSON.stringify({ word }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(`Error generating word: ${error.message}`, { status: 500 });
  }
}

async function handleAiTurn(request, env) {
  const { history, finalWord } = await request.json();
  const GEMINI_API_KEY = env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `You are playing a word association game called 'Apple'. The goal is to connect a starting word to a final word by saying words that are related to the previous word. The game must always start with 'apple'.

Here is the current game state:
- The word history is: ${history.join(', ')}
- The final word is: ${finalWord}

Your task is to generate the next single word in the chain. The word must be logically connected to the last word in the history. Do not repeat words. The word should be a step towards the final word. Respond with only the next word, and nothing else.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Gemini API error: ${errorText}`, { status: response.status });
    }

    const data = await response.json();
    const word = data.candidates[0].content.parts[0].text.trim();

    return new Response(JSON.stringify({ word }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(`Error getting AI turn: ${error.message}`, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/generate-word') {
      return await handleGenerateWord(request, env);
    } else if (url.pathname === '/api/ai-turn') {
      return await handleAiTurn(request, env);
    } else if (url.pathname.startsWith('/api/game/')) {
      const roomName = url.pathname.split('/')[3];
      const id = env.GAME_ROOMS.idFromName(roomName);
      const stub = env.GAME_ROOMS.get(id);
      return await stub.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
