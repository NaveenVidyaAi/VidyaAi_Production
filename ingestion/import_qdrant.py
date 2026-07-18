import argparse
import json

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, FieldCondition, Filter, MatchValue, PointStruct, VectorParams

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


def _replace_imported_documents(client: QdrantClient, document_ids: set[str], legacy_sources: set[str]) -> None:
    for document_id in sorted(document_ids):
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            ),
        )
    for source_file in sorted(legacy_sources):
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[FieldCondition(key="source_file", match=MatchValue(value=source_file))]
            ),
        )


def import_points(input_path: str, host: str, port: int, batch_size: int, replace_active: bool = True) -> None:
    client = _client(host, port)
    batch: list[PointStruct] = []
    total = 0
    vector_size = None
    document_versions: dict[str, set[str]] = {}
    legacy_sources: set[str] = set()

    # Validate the whole package before mutating Qdrant. One import must never
    # contain competing active versions of the same logical document.
    with open(input_path, "r", encoding="utf-8") as import_file:
        for line in import_file:
            if not line.strip():
                continue
            item = json.loads(line)
            vector = item["vector"]
            vector_size = vector_size or len(vector)
            payload = item.get("payload") or {}
            document_id = str(payload.get("document_id") or "")
            if document_id:
                document_versions.setdefault(document_id, set()).add(str(payload.get("document_version") or "0.0.0"))
            elif payload.get("source_file"):
                legacy_sources.add(str(payload["source_file"]))

    if vector_size is None:
        raise ValueError(f"No Qdrant points found in {input_path}")
    competing = {document_id: versions for document_id, versions in document_versions.items() if len(versions) > 1}
    if competing:
        raise ValueError(f"Import contains multiple versions of the same document: {competing}")
    _ensure_collection(client, vector_size)
    if replace_active:
        _replace_imported_documents(client, set(document_versions), legacy_sources)

    with open(input_path, "r", encoding="utf-8") as import_file:
        for line in import_file:
            if not line.strip():
                continue
            item = json.loads(line)
            vector = item["vector"]
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

    mode = "replaced active versions and imported" if replace_active else "imported without replacement"
    print(f"{mode.capitalize()} {total} points into {COLLECTION_NAME}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Qdrant points from JSONL.")
    parser.add_argument("--input", required=True, help="JSONL input path.")
    parser.add_argument("--host", default="qdrant")
    parser.add_argument("--port", type=int, default=6333)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--no-replace-active", action="store_true", help="Upsert without deleting existing document versions first")
    args = parser.parse_args()
    import_points(args.input, args.host, args.port, args.batch_size, replace_active=not args.no_replace_active)


if __name__ == "__main__":
    main()
