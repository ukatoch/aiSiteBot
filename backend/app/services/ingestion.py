import requests
from bs4 import BeautifulSoup
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import tempfile
import os

class IngestionService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )

    async def ingest_url(self, url: str, bot_id: str):
        """Scrapes content from a URL."""
        try:
            response = requests.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Simple extraction: get all paragraph text
            text = ' '.join([p.get_text() for p in soup.find_all('p')])
            
            if not text:
                return []

            doc = Document(page_content=text, metadata={"source": url, "type": "url", "botId": bot_id})
            return self.text_splitter.split_documents([doc])
        except Exception as e:
            print(f"Error ingesting URL {url}: {e}")
            raise e

    async def ingest_text(self, text: str, bot_id: str, source_name: str = "text_input"):
        """Ingests raw text."""
        doc = Document(page_content=text, metadata={"source": source_name, "type": "text", "botId": bot_id})
        return self.text_splitter.split_documents([doc])

    async def ingest_pdf(self, file_content: bytes, filename: str, bot_id: str):
        """Ingests a PDF file."""
        # Save bytes to a temp file because PyPDFLoader expects a path
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        try:
            loader = PyPDFLoader(tmp_path)
            documents = loader.load()
            
            # Update metadata
            for doc in documents:
                doc.metadata["source"] = filename
                doc.metadata["type"] = "pdf"
                doc.metadata["botId"] = bot_id
            
            return self.text_splitter.split_documents(documents)
        finally:
            os.remove(tmp_path)

ingestion_service = IngestionService()
