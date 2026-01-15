# Deploying the Apple 🍎 Game

This guide will walk you through deploying the Apple 🍎 word game to Cloudflare for free.

## Prerequisites

1.  A [Cloudflare account](https://dash.cloudflare.com/sign-up).
2.  Node.js and npm installed on your local machine.
3.  A [Google AI Studio API key](https://aistudio.google.com/app/apikey).

---

## Initial Deployment

Follow these steps the first time you deploy the game.

### Step 1: Clone the Repository & Log In

1.  Open your terminal or command line (like Git Bash).
2.  If you have not already cloned the repository, do so now. If you have, navigate into the project folder.
    ```bash
    # If you have not cloned it yet:
    git clone <repository-url>
    cd apple-word-game
    ```
3.  Log in to your Cloudflare account using the Wrangler command-line tool. This will open a browser window for you to log in and authorize the tool.
    ```bash
    npx wrangler login
    ```

### Step 2: Deploy the Backend Worker

The backend handles the game logic, AI, and multiplayer connections.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  **Install Dependencies:** This is a crucial step to ensure the worker has all the code it needs to run.
    ```bash
    npm install
    ```
3.  **Deploy to Cloudflare:** Run the following command. Wrangler will deploy the code and automatically set up the necessary components.
    ```bash
    npx wrangler deploy
    ```
4.  **Add Your Google API Key:** Securely add your Google Gemini API key as a secret so the worker can use it.
    ```bash
    npx wrangler secret put GEMINI_API_KEY
    ```
    Paste your API key when prompted and press Enter.

### Step 3: Deploy the Frontend Application

The frontend is the user interface for the game.

1.  Navigate to the frontend directory from the `backend` folder:
    ```bash
    cd ../frontend
    ```
2.  **Deploy to Cloudflare Pages:** Run the following command. You will be prompted to select your Cloudflare account and enter a project name (e.g., `apple-word-game`).
    ```bash
    npx wrangler pages deploy .
    ```

### You're Done!

That's it! The connection between your frontend and backend is handled **automatically**. The `_routes.json` file included in the `frontend` directory tells Cloudflare Pages how to route requests to your Worker, so no manual configuration in the dashboard is needed.

Your Apple 🍎 game is now fully deployed and live. You can play it by visiting your Cloudflare Pages URL (e.g., `https://apple-word-game.pages.dev`).

---

## Updating Your Deployment

If you make changes to the code in the future, updating the live application is simple.

### If you change the backend...

1.  Open your terminal and navigate to the `backend` directory.
2.  Run the deploy command again:
    ```bash
    npx wrangler deploy
    ```
Wrangler will automatically deploy only the changes you have made.

### If you change the frontend...

1.  Open your terminal and navigate to the `frontend` directory.
2.  Run the deploy command again:
    ```bash
    npx wrangler pages deploy .
    ```
This will publish a new version of your frontend with the latest changes.
