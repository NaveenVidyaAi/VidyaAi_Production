import argparse
import json
from pathlib import Path

from qdrant_client import QdrantClient

from ingestion.ingest import COLLECTION_NAME


def _client(host: str, port: int) -> QdrantClient:
    return QdrantClient(host=host, port=port, timeout=30)


def export_points(output: str, host: str, port: int, source_files: list[str]) -> None:
    client = _client(host, port)
    source_filter = set(source_files)
    count = 0
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as export_file:
        offset = None
        while True:
            points, offset = client.scroll(
                collection_name=COLLECTION_NAME,
                with_payload=True,
                with_vectors=True,
                limit=256,
                offset=offset,
            )
            for point in points:
                payload = point.payload or {}
                if source_filter and payload.get("source_file") not in source_filter:
                    continue
                export_file.write(
                    json.dumps(
                        {
                            "id": point.id,
                            "vector": point.vector,
                            "payload": payload,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                count += 1
            if offset is None:
                break

    print(f"Exported {count} points to {output_path}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export Qdrant points to JSONL.")
    parser.add_argument("--output", required=True, help="JSONL output path.")
    parser.add_argument("--host", default="qdrant")
    parser.add_argument("--port", type=int, default=6333)
    parser.add_argument("--source-file", action="append", default=[], help="Only export this source_file. Repeatable.")
    args = parser.parse_args()
    export_points(args.output, args.host, args.port, args.source_file)


if __name__ == "__main__":
    main()
