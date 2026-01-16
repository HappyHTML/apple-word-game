// Reusable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (path[0] === "api") {
      if (path[1] === "get-word") {
        return this.getRandomWord(env);
      } else if (path[1] === "get-next-word") {
        return this.getNextWord(request, env);
      } else {
        return new Response("Not Found", { status: 404, headers: corsHeaders });
      }
    }

    if (path[0] === "game") {
        let gameId = path[1];
        if (!gameId) {
            return new Response("Not Found", { status: 404, headers: corsHeaders });
        }
        let id = env.GAME_ROOMS.idFromName(gameId);
        let room = env.GAME_ROOMS.get(id);
        return room.fetch(request);
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },

  async callGroqAPI(prompt, apiKey) {
    try {
      const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 1,
          max_tokens: 50
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Groq API Response:', data);
        throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(data)}`);
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid response structure from Groq API');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Groq API call failed:', error);
      throw error;
    }
  },

  async getRandomWord(env) {
    try {
      if (!env.GROQ_API_KEY) {
        console.error("GROQ_API_KEY is not set");
        return new Response(JSON.stringify({ error: "API key not configured" }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // Generate random elements to force variety
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000);
      const categories = ['animal', 'food', 'vehicle', 'tool', 'weather', 'sport', 'plant', 'building', 'furniture', 'hobby', 'profession', 'country', 'instrument', 'appliance', 'color', 'material'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      const prompt = `You are generating a word for a word game. Generate ONE completely random, unpredictable common noun from the category: ${randomCategory}.

CRITICAL: Be EXTREMELY varied - avoid repeating patterns. Don't favor any particular letters or sounds.

Requirements:
- Single word only
- Must be family-friendly and appropriate for children
- NO profanity, slurs, or inappropriate content
- Should be a recognizable everyday object, creature, or thing
- Mix up the starting letters - use ALL letters of the alphabet randomly

Avoid: tree, house, kite, kazoo, kiln (these are overused)

Random factors: ${timestamp}-${randomNum}

Respond with ONLY the word, nothing else:`;

      const text = await this.callGroqAPI(prompt, env.GROQ_API_KEY);
      
      // Clean the response
      const cleanWord = text.toLowerCase()
        .replace(/[.,!?'"]/g, '')
        .trim()
        .split(/\s+/)[0];

      return new Response(JSON.stringify({ word: cleanWord }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Groq API Error:", error);
      return new Response(JSON.stringify({ 
        error: "Error generating word from AI.", 
        details: error.message
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  },

  async getNextWord(request, env) {
    try {
      const { wordChain, finalWord } = await request.json();
      const currentWord = wordChain[wordChain.length - 1];
      
      // Calculate how far we are in the game
      const chainLength = wordChain.length;
      
      let prompt;
      
      // If we're getting close to having tried many words, make the AI aim for the final word
      if (chainLength > 8) {
        prompt = `You are playing a word association game. You need to get from "${currentWord}" to "${finalWord}". 
Think of ONE word that connects these two words - it should be related to "${currentWord}" but also get you closer to "${finalWord}".
Words already used: ${wordChain.join(", ")}
DO NOT repeat any of these words.
If "${currentWord}" is very close to "${finalWord}" conceptually, you can say "${finalWord}" directly.
Respond with ONLY ONE WORD, nothing else.`;
      } else {
        prompt = `You are playing a word association game. The goal is to eventually reach the word "${finalWord}".
Current word: "${currentWord}"
Words already used: ${wordChain.join(", ")}

Think of ONE word that is:
1. Related to "${currentWord}"
2. Moves toward the concept of "${finalWord}"
3. NOT already in the list above

Respond with ONLY ONE WORD, nothing else. No punctuation, no explanation.`;
      }

      const text = await this.callGroqAPI(prompt, env.GROQ_API_KEY);
      
      // Clean the response - remove any extra text, quotes, or punctuation
      const cleanWord = text.toLowerCase()
        .replace(/[.,!?'"]/g, '')
        .trim()
        .split(/\s+/)[0]; // Take only the first word if multiple

      return new Response(JSON.stringify({ word: cleanWord }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Groq API Error:", error.message);
      return new Response(JSON.stringify({ error: "Error generating next word from AI." }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
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
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

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
        try {
            const { word } = await request.json();
            this.finalWord = word;
            return new Response(JSON.stringify({ status: 'ok' }), { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        } catch (error) {
             return new Response(JSON.stringify({ error: 'Invalid JSON' }), { 
               status: 400, 
               headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
             });
        }
    }

    if (url.pathname.endsWith("/getFinalWord")) {
        return new Response(JSON.stringify({ word: this.finalWord }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
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
