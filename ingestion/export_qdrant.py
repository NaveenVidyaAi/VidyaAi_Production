import argparse
import hashlib
import json
import re
from collections import Counter
from datetime import date
from pathlib import Path

from qdrant_client import QdrantClient

from ingestion.ingest import COLLECTION_NAME


def _client(host: str, port: int, path: str | None = None) -> QdrantClient:
    if path:
        return QdrantClient(path=path)
    return QdrantClient(host=host, port=port, timeout=30)


def export_points(
    output: str,
    host: str,
    port: int,
    source_files: list[str],
    path: str | None = None,
    dataset_version: str | None = None,
) -> dict:
    if dataset_version and not re.fullmatch(r"\d+\.\d+\.\d+", dataset_version):
        raise ValueError("dataset_version must use MAJOR.MINOR.PATCH")
    client = _client(host, port, path)
    source_filter = set(source_files)
    count = 0
    document_versions: set[tuple[str, str]] = set()
    catalog_versions: set[str] = set()
    document_types: Counter[str] = Counter()
    subjects: Counter[str] = Counter()
    vector_size = 0
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
                vector_size = vector_size or len(point.vector or [])
                if payload.get("document_id"):
                    document_versions.add((str(payload["document_id"]), str(payload.get("document_version", "0.0.0"))))
                if payload.get("catalog_version"):
                    catalog_versions.add(str(payload["catalog_version"]))
                document_types[str(payload.get("document_type", "unknown"))] += 1
                subjects[str(payload.get("subject", "unknown"))] += 1
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

    export_sha256 = hashlib.sha256(output_path.read_bytes()).hexdigest()
    manifest = {
        "schema_version": "1.0.0",
        "dataset_version": dataset_version or "unversioned",
        "created_at": date.today().isoformat(),
        "collection": COLLECTION_NAME,
        "point_count": count,
        "document_count": len(document_versions),
        "vector_size": vector_size,
        "catalog_versions": sorted(catalog_versions),
        "document_types": dict(sorted(document_types.items())),
        "subjects": dict(sorted(subjects.items())),
        "sha256": export_sha256,
        "data_file": output_path.name,
    }
    if dataset_version:
        manifest_path = output_path.with_suffix(".manifest.json")
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote dataset manifest to {manifest_path}", flush=True)
    print(f"Exported {count} points to {output_path}", flush=True)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Export Qdrant points to JSONL.")
    parser.add_argument("--output", required=True, help="JSONL output path.")
    parser.add_argument("--host", default="qdrant")
    parser.add_argument("--port", type=int, default=6333)
    parser.add_argument("--path", default=None, help="Local Qdrant persistence path. If set, host/port are ignored.")
    parser.add_argument("--source-file", action="append", default=[], help="Only export this source_file. Repeatable.")
    parser.add_argument("--dataset-version", required=True, help="Immutable export version in MAJOR.MINOR.PATCH format")
    args = parser.parse_args()
    export_points(args.output, args.host, args.port, args.source_file, args.path, args.dataset_version)


if __name__ == "__main__":
    main()
