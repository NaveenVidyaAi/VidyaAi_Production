from pathlib import Path

from backend.config import settings


def _cached_snapshot_path(model_name: str) -> str | None:
    model_path = Path(model_name).expanduser()
    if model_path.exists():
        return str(model_path)

    repo_cache_name = f"models--{model_name.replace('/', '--')}"
    cache_root = Path.home() / ".cache" / "huggingface" / "hub" / repo_cache_name
    refs_main = cache_root / "refs" / "main"
    if refs_main.exists():
        revision = refs_main.read_text(encoding="utf-8").strip()
        snapshot = cache_root / "snapshots" / revision
        if (snapshot / "modules.json").exists():
            return str(snapshot)

    snapshots_dir = cache_root / "snapshots"
    if snapshots_dir.exists():
        for snapshot in sorted(snapshots_dir.iterdir(), key=lambda item: item.stat().st_mtime, reverse=True):
            if (snapshot / "modules.json").exists():
                return str(snapshot)

    return None

class EmbeddingService:
    def __init__(self):
        self.model = None
        self.model_name = settings.embedding_model
        self.use_mock = str(settings.use_mock_embeddings).lower() == "true"

    def embed(self, text: str) -> list[float]:
        if self.use_mock:
            # Return a fixed-size mock embedding (384 dimensions for all-MiniLM-L6-v2)
            return [0.1] * 384
        
        # Lazy load the real model only if needed
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                try:
                    local_model = _cached_snapshot_path(self.model_name)
                    self.model = SentenceTransformer(local_model or self.model_name, local_files_only=True)
                except Exception:
                    if str(settings.allow_embedding_download).lower() != "true":
                        raise
                    self.model = SentenceTransformer(self.model_name)
            except Exception as e:
                print(f"Failed to load embedding model: {e}. Using mock embeddings.")
                self.use_mock = True
                return [0.1] * 384
        
        return self.model.encode(text, convert_to_numpy=True).tolist()

embedding_service = EmbeddingService()
