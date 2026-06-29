import argparse
import json

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, PointStruct, VectorParams

from ingestion.ingest import COLLECTION_NAME


def _client(host: str, port: int) -> QdrantClient:
    return QdrantClient(host=host, port=port, timeout=30)


def _ensure_collection(client: QdrantClient, vector_size: int) -> None:
    existing = [collection.name for collection in client.get_collections().collections]
    if COLLECTION_NAME in existing:
        return
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )


def import_points(input_path: str, host: str, port: int, batch_size: int) -> None:
    client = _client(host, port)
    batch: list[PointStruct] = []
    total = 0
    vector_size = None

    with open(input_path, "r", encoding="utf-8") as import_file:
        for line in import_file:
            if not line.strip():
                continue
            item = json.loads(line)
            vector = item["vector"]
            if vector_size is None:
                vector_size = len(vector)
                _ensure_collection(client, vector_size)

            batch.append(
                PointStruct(
                    id=item["id"],
                    vector=vector,
                    payload=item.get("payload") or {},
                )
            )
            if len(batch) >= batch_size:
                client.upsert(collection_name=COLLECTION_NAME, points=batch)
                total += len(batch)
                batch = []

    if batch:
        client.upsert(collection_name=COLLECTION_NAME, points=batch)
        total += len(batch)

    print(f"Imported {total} points into {COLLECTION_NAME}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Qdrant points from JSONL.")
    parser.add_argument("--input", required=True, help="JSONL input path.")
    parser.add_argument("--host", default="qdrant")
    parser.add_argument("--port", type=int, default=6333)
    parser.add_argument("--batch-size", type=int, default=128)
    args = parser.parse_args()
    import_points(args.input, args.host, args.port, args.batch_size)


if __name__ == "__main__":
    main()
