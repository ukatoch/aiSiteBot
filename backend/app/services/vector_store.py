from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
from app.core.config import settings
import os

class VectorStoreService:
    def __init__(self):
        # Ensure the persist directory exists
        if not os.path.exists(settings.CHROMA_PERSIST_DIRECTORY):
            os.makedirs(settings.CHROMA_PERSIST_DIRECTORY)

        # Using a standard embedding model for Ollama
        self.embeddings = OllamaEmbeddings(model="nomic-embed-text")
        self.vector_db = Chroma(
            persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
            embedding_function=self.embeddings,
            collection_name="aisitebot_collection"
        )

    def add_documents(self, documents):
        """Adds a list of documents to the vector store."""
        if documents:
            self.vector_db.add_documents(documents)
            # self.vector_db.persist() # Chroma in newer versions persists automatically or on specific calls

    def similarity_search(self, query: str, bot_id: str = None, k: int = 4):
        """Searches for documents similar to the query, filtered by bot_id."""
        kwargs = {"k": k}
        if bot_id:
            kwargs["filter"] = {"botId": bot_id}
        return self.vector_db.similarity_search(query, **kwargs)

    def get_retriever(self, bot_id: str = None):
        search_kwargs = {"k": 4}
        if bot_id:
            search_kwargs["filter"] = {"botId": bot_id}
        return self.vector_db.as_retriever(search_kwargs=search_kwargs)
        
    def list_documents(self, bot_id: str = None):
        """Lists all unique documents in the vector store for a specific bot."""
        try:
            # Get all documents from the collection
            where_filter = {}
            if bot_id:
                where_filter = {"botId": bot_id}
                
            data = self.vector_db.get(where=where_filter)
            
            if not data or not data['metadatas']:
                return []
                
            # Extract unique sources from metadata
            sources = []
            seen_sources = set()
            
            for metadata in data['metadatas']:
                source = metadata.get('source')
                doc_type = metadata.get('type', 'unknown')
                
                if source and source not in seen_sources:
                    seen_sources.add(source)
                    sources.append({
                        "source": source,
                        "type": doc_type
                    })
            
            return sources
        except Exception as e:
            print(f"Error listing documents: {e}")
            return []

    def delete_document(self, source: str, bot_id: str = None):
        """Deletes documents associated with a specific source and bot."""
        try:
            where_filter = {"source": source}
            if bot_id:
                where_filter = {
                    "$and": [
                        {"source": source},
                        {"botId": bot_id}
                    ]
                }
            
            self.vector_db.delete(where=where_filter)
            return True
        except Exception as e:
            print(f"Error deleting document {source}: {e}")
            raise e

vector_store = VectorStoreService()
