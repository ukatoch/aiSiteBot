# Local Setup Guide - AISiteBot

Follow these steps to get the project running on your local machine.

---

## 1. Prerequisites
Ensure you have the following installed:
- **Python** (3.9 or higher)
- **Node.js** (v18 or higher) and **npm**
- **Ollama** (Download from [ollama.com](https://ollama.com))

---

## 2. AI Engine Setup (Ollama)
Ollama handles our local LLM and Vector Embeddings. Open your terminal and run:

```bash
# Pull the LLM model
ollama pull llama3.2

# Pull the Embedding model
ollama pull nomic-embed-text
```
*Note: Make sure the Ollama application is running in the background.*

---

## 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The backend will be available at http://localhost:8000*

---

## 4. Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at http://localhost:5173*

---

## 5. Usage & Testing

### Accessing the Dashboard
- Go to `http://localhost:5173/register` to create your first admin account.
- After registration, log in at `http://localhost:5173/login`.
- Go to the **Admin Dashboard** (`/admin`) to add your domains and upload training data.

### Embedding the Bot
To test the bot on a third-party site (like a local HTML file), add this script before the `</body>` tag:

```html
<script 
  src="http://localhost:5173/aiSiteBot.js" 
  data-bot-id="YOUR_BOT_ID_FROM_DASHBOARD">
</script>
```

---

## Troubleshooting
- **CORS Errors**: If you are testing from a specific port (e.g., Live Server at 5501), ensure that port is added to the `allow_origins` list in `backend/app/main.py`.
- **Database Reset**: To start fresh, delete the `sql_app.db` file and the `chroma_db` folder; they will be recreated automatically on the next run.
- **Model Errors**: If the bot fails to answer, verify that `ollama list` shows both `llama3.2` and `nomic-embed-text`.
