# AISiteBot

A production-ready RAG (Retrieval-Augmented Generation) chatbot that turns messy data into clean, searchable insights.

## Features

- **Data Ingestion**: Scrape URLs, upload PDFs and Text files.
- **RAG Engine**: Powered by LangChain and ChromaDB.
- **Modern UI**: Built with React, Vite, and Tailwind CSS.
- **Customizable**: Easy to switch vector stores or LLMs.

## Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API Key

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set your API Key:
   Create a `.env` file in `backend` (or export it):
   ```bash
   export OPENAI_API_KEY=sk-...
   ```
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open http://localhost:5173
2. Enter a URL or upload a file in the sidebar.
3. Chat with your data in the main window!
