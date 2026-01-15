
import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

export default {
  async fetch(request, env) {
    // Durable Objects are identified by a name. We'll use the URL path
    // to derive a name for our Durable Object.
    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (path[0] === "api") {
      // This is a request for our API
      if (path[1] === "get-word") {
        return this.getRandomWord(env);
      } else if (path[1] === "get-next-word") {
        return this.getNextWord(request, env);
      } else {
        return new Response("Not Found", { status: 404 });
      }
    }

    if (path[0] === "game") {
        // This is a request for a specific game room, handled by our Durable Object.
        let gameId = path[1];
        let id = env.GAME_ROOMS.idFromName(gameId);
        let room = env.GAME_ROOMS.get(id);

        // Forward the request to the Durable Object.
        return room.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },

  async getRandomWord(env) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = "Generate a single, common, one-word noun that is safe for work and appropriate for all audiences. Examples: House, Car, River, Mountain, Book. Do not add any extra text, just the word.";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      return new Response(JSON.stringify({ word: text }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(error);
      return new Response("Error generating word", { status: 500 });
    }
  },

  async getNextWord(request, env) {
    try {
      const { wordChain, finalWord } = await request.json();
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `You are playing a word association game. The goal is to get from the first word to the last word by saying related words. The current word chain is: "${wordChain.join(", ")}". The final word is "${finalWord}". What is the next logical word in the chain? The word must be related to the previous word, "${wordChain[wordChain.length - 1]}". Respond with only the next word.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      return new Response(JSON.stringify({ word: text }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(error);
      return new Response("Error generating next word", { status: 500 });
    }
  }
};


export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.finalWord = null;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/websocket")) {
      if (request.headers.get("Upgrade") != "websocket") {
        return new Response("Expected websocket", { status: 400 });
      }

      let pair = new WebSocketPair();
      await this.handleSession(pair[1]);

      return new Response(null, { status: 101, webSocket: pair[0] });
    }

     if (url.pathname.endsWith("/setFinalWord")) {
        const { word } = await request.json();
        this.finalWord = word;
        return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname.endsWith("/getFinalWord")) {
        return new Response(JSON.stringify({ word: this.finalWord }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response("Not found", { status: 404 });
  }

  async handleSession(websocket) {
    websocket.accept();
    this.sessions.push(websocket);

    websocket.addEventListener("message", async msg => {
        try {
            const data = JSON.parse(msg.data);
            // Relay messages to other clients
            this.sessions.forEach(session => {
                if (session !== websocket) {
                    session.send(JSON.stringify(data));
                }
            });
        } catch (err) {
            console.error("Failed to parse websocket message:", err);
        }
    });

    websocket.addEventListener("close", () => {
        this.sessions = this.sessions.filter(session => session !== websocket);
    });
    websocket.addEventListener("error", (err) => {
        console.error("WebSocket error:", err);
        this.sessions = this.sessions.filter(session => session !== websocket);
    });
  }
}
