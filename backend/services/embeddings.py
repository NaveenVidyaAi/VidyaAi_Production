import os

class EmbeddingService:
    def __init__(self):
        self.model = None
        # Check if we should use mock embeddings for development
        self.use_mock = os.getenv("USE_MOCK_EMBEDDINGS", "true").lower() == "true"

    def embed(self, text: str) -> list[float]:
        if self.use_mock:
            # Return a fixed-size mock embedding (384 dimensions for all-MiniLM-L6-v2)
            return [0.1] * 384
        
        # Lazy load the real model only if needed
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception as e:
                print(f"Failed to load embedding model: {e}. Using mock embeddings.")
                self.use_mock = True
                return [0.1] * 384
        
        return self.model.encode(text, convert_to_numpy=True).tolist()

embedding_service = EmbeddingService()
