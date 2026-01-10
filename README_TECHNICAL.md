# AISiteBot Documentation

This document provides a comprehensive overview of the AISiteBot project, its architecture, and guidance on how to extend or modify it.

---

## 1. Project Overview

AISiteBot is a multi-tenant Chatbot-as-a-Service platform. It allows users to create custom AI bots, train them on specific URLs or documents, and embed them on their own websites using a simple JavaScript snippet.

### Core Features:
- **Admin Dashboard**: Manage domains, upload data resources, and view lead analytics.
- **RAG Implementation**: Uses Retrieval-Augmented Generation to ensure bots answer based *only* on provided data.
- **Multi-Tenant Isolation**: Cryptographic-style separation of data between different bot IDs.
- **Embeddable Widget**: A lightweight JS script for third-party website integration.

---

## 2. Technical Architecture

### Backend (FastAPI + SQLAlchemy + LangChain)
- **`backend/app/main.py`**: Entry point, CORS configuration, and router initialization.
- **`backend/app/api/endpoints.py`**: Contains core logic for:
  - `/ingest/url` & `/ingest/file`: Handling data training.
  - `/chat`: Main RAG engine for answering queries.
  - `/validateBot`: Security check for embeddable widgets.
- **`backend/app/services/vector_store.py`**: Wrapper for ChromaDB. Handles document storage and filtered retrieval.
- **`backend/app/models.py`**: Database schema (Users, Domains, Metrics, ChatSessions).

### Frontend (React + Vite + Tailwind)
- **`frontend/src/components/Dashboard.tsx`**: The primary administrative interface.
- **`frontend/src/components/ChatInterface.tsx`**: The user-facing chat widget.
- **`frontend/aiSiteBot.js`**: The standalone script used for embedding.

---

## 3. How the RAG Flow Works

1.  **Ingestion**: When a file/URL is uploaded, it is split into chunks and stored in **ChromaDB** with a metadata tag: `{"botId": "bot-xxx"}`.
2.  **Retrieval**: When a message is sent, the system queries ChromaDB with a `filter={"botId": "bot-xxx"}`. This ensures the bot never sees data from other users.
3.  **Generation**: The retrieved chunks are passed to **Ollama (Llama 3.2)** along with the user's question to generate a grounded response.

---

## 4. Customization & Scaling

### Using different LLMs (e.g., OpenAI, Anthropic)
To switch from local Ollama to OpenAI, modify `backend/app/api/endpoints.py`:
- Change `ChatOllama` to `ChatOpenAI`.
- Update the API key in `.env`.

### Using different Vector Databases (e.g., Pinecone, Milvus)
Modify `backend/app/services/vector_store.py`:
- Replace `Chroma` import with your desired store (e.g., `from langchain_community.vectorstores import Pinecone`).
- Update the `__init__` method to connect to your cloud instance instead of a local directory.

### Scaling the Database
The project currently uses **SQLite** for metadata. For production, change the `DATABASE_URL` in `backend/app/core/database.py` to a PostgreSQL connection string.

---

## 5. Security & Impersonation Prevention

1.  **Domain Locking**: Every bot ID is tied to a specific hostname in the `Domain` table.
2.  **Validation**: The `/validateBot` endpoint rejects any request where the calling site's hostname doesn't match the registered record.
3.  **Filtered Retrieval**: Even if someone successfully calls the API, they can only retrieve documents tagged with their specific `botId`.

---

## 6. Development Setup

1.  **Backend**: 
    - `cd backend`
    - `pip install -r requirements.txt`
    - `uvicorn app.main:app --reload`
2.  **Frontend**:
    - `cd frontend`
    - `npm install`
    - `npm run dev`
3.  **AI Engine**:
    - Ensure Ollama is running with `llama3.2` and `nomic-embed-text` models.

---

*For issues or contributions, contact the development team.*
