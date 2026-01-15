# Deploying the Apple 🍎 Game

This guide will walk you through deploying the Apple 🍎 word game to Cloudflare for free.

## Prerequisites

1.  A [Cloudflare account](https://dash.cloudflare.com/sign-up).
2.  Node.js and npm installed on your local machine.
3.  A [Google AI Studio API key](https://aistudio.google.com/app/apikey).

## Step 1: Clone the Repository & Log In

1.  Open your terminal or command line (like Git Bash).
2.  If you have not already cloned the repository, do so now. If you have, navigate into the project folder.
    ```bash
    # If you have not cloned it yet:
    git clone <repository-url>
    cd apple-word-game
    ```
3.  Log in to your Cloudflare account using the Wrangler command-line tool:
    ```bash
    npx wrangler login
    ```
    This command will open a browser window for you to log in and authorize the tool.

## Step 2: Deploy the Backend Worker

The backend handles the game logic, AI, and multiplayer connections.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  **Install Dependencies:**
    This is a crucial step to ensure the worker has all the code it needs to run.
    ```bash
    npm install
    ```
3.  **Deploy to Cloudflare:**
    Run the following command. The configuration in this repository has been **fixed** to be compatible with Cloudflare's free tier. Wrangler will deploy the code and automatically set up the necessary components for the multiplayer feature.
    ```bash
    npx wrangler deploy
    ```
    After it's finished, take note of the worker URL in the output. It will look something like `https://apple-word-game.<your-subdomain>.workers.dev`.

4.  **Add Your Google API Key:**
    Securely add your Google Gemini API key as a secret so the worker can use it.
    ```bash
    npx wrangler secret put GEMINI_API_KEY
    ```
    Paste your API key when prompted and press Enter.

## Step 3: Deploy the Frontend Application

The frontend is the user interface for the game. We will deploy it using Cloudflare Pages.

1.  Navigate to the frontend directory from the `backend` folder:
    ```bash
    cd ../frontend
    ```
2.  **Deploy to Cloudflare Pages:**
    Run the following command. You will be prompted to select your Cloudflare account and enter a project name (e.g., `apple-word-game`).
    ```bash
    npx wrangler pages deploy .
    ```
    This will give you a URL for your live game, for example: `https://apple-word-game.pages.dev`.

## Step 4: Connect Frontend to Backend

The final step is to tell your live frontend how to communicate with your live backend.

1.  Go to your [Cloudflare Dashboard](https://dash.cloudflare.com).
2.  Select **Workers & Pages** from the sidebar.
3.  Find your Pages project (e.g., `apple-word-game`) and click on it.
4.  Go to the **Settings** tab, then select the **Functions** sub-menu.
5.  Under the **Routes** section, click **Add route**.
6.  Configure the route to forward all API requests to your worker:
    -   **Route:** `/api/*`
    -   **Service:** Select your backend worker from the dropdown (e.g., `apple-word-game`).
    -   **Environment:** `production`
7.  Click **Save route**.

## You're Done!

Your Apple 🍎 game is now fully deployed and live. You can play it by visiting your Cloudflare Pages URL (e.g., `https://apple-word-game.pages.dev`).
