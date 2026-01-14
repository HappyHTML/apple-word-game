# Deploying the Apple 🍎 Game

This guide will walk you through deploying the Apple 🍎 word game to Cloudflare for free. The frontend will be hosted on Cloudflare Pages, and the backend will run on Cloudflare Workers.

## Prerequisites

1.  A [Cloudflare account](https://dash.cloudflare.com/sign-up).
2.  Node.js and npm installed on your local machine.
3.  A [Google AI Studio API key](https://aistudio.google.com/app/apikey).

## Step 1: Get Your Google Gemini API Key

1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Click on "Create API key in new project".
3.  Copy the generated API key and save it somewhere safe. You will need it in a later step.

## Step 2: Deploy the Backend to Cloudflare Workers

The backend consists of a Cloudflare Worker that handles API requests and the WebSocket-based signaling for multiplayer.

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>/backend
    ```

2.  **Install Wrangler CLI:**
    Wrangler is the command-line tool for managing Cloudflare Workers.
    ```bash
    npm install -g wrangler
    ```

3.  **Log in to Cloudflare:**
    ```bash
    wrangler login
    ```
    This will open a browser window for you to log in to your Cloudflare account.

4.  **Deploy the Worker:**
    Run the following command to deploy the worker. You will be prompted to enter a name for your worker (e.g., `apple-word-game-backend`).
    ```bash
    wrangler deploy
    ```

5.  **Configure the Gemini API Key Secret:**
    Now you need to securely add your Google Gemini API key to your worker's environment variables.
    ```bash
    wrangler secret put GEMINI_API_KEY
    ```
    Paste your API key when prompted.

## Step 3: Deploy the Frontend to Cloudflare Pages

The frontend is a static site that will be hosted on Cloudflare Pages.

1.  **Navigate to the `frontend` Directory:**
    From the root of the repository, change into the `frontend` directory:
    ```bash
    cd ../frontend
    ```

2.  **Deploy with Wrangler:**
    The easiest way to do a one-time deployment of a static folder is with Wrangler.
    ```bash
    wrangler pages deploy .
    ```
    You will be prompted to select your Cloudflare account and enter a project name (e.g., `apple-word-game`).

3.  **Configure API Proxying:**
    The final step is to make sure your frontend can communicate with your backend worker. You need to set up a redirect so that requests to `/api/*` on your Pages site are forwarded to your worker.

    a. In the Cloudflare dashboard, go to your Pages project.
    b. Go to **Settings > Functions**.
    c. Under **Routes**, add a route:
        - **Route:** `/api/*`
        - **Service:** Your Cloudflare Worker (e.g., `apple-word-game-backend`)
        - **Environment:** `production`

    d. Click **Save**.

## You're Done!

Your Apple 🍎 game should now be live! You can access it at the URL provided by Cloudflare Pages.
