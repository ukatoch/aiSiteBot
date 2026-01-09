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

    def similarity_search(self, query: str, k: int = 4):
        """Searches for documents similar to the query."""
        return self.vector_db.similarity_search(query, k=k)

    def get_retriever(self):
        return self.vector_db.as_retriever()
        
    def list_documents(self):
        """Lists all unique documents in the vector store."""
        try:
            # Get all documents from the collection
            # We use get() without arguments to retrieve all items properly
            data = self.vector_db.get()
            
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

    def delete_document(self, source: str):
        """Deletes documents associated with a specific source."""
        try:
            # ChromaDB delete by metadata
            self.vector_db.delete(where={"source": source})
            return True
        except Exception as e:
            print(f"Error deleting document {source}: {e}")
            raise e

vector_store = VectorStoreService()
