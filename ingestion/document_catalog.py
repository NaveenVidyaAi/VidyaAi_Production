"""Versioned catalog for every source document used by VidyaAI.

The catalog is deliberately checksum locked. A managed PDF must never be edited
in place: add a new ``-vMAJOR.MINOR.PATCH`` file and catalog entry instead.
This keeps Qdrant payloads, downloadable files, and source history traceable.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import date
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent.parent
CATALOG_PATH = Path(__file__).resolve().parent / "document_catalog.json"
SCHEMA_VERSION = "1.0.0"
VERSION_RE = re.compile(r"-v(?P<version>\d+\.\d+\.\d+)\.pdf$", re.IGNORECASE)

SUBJECT_ALIASES = {
    "english": "English",
    "hindi": "Hindi",
    "math": "Math",
    "maths": "Math",
    "mathematics": "Math",
    "sanskrit": "Sanskrit",
    "science": "Science",
    "social-science": "Social Science",
    "social_science": "Social Science",
}


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _repo_path(path: Path) -> str:
    return path.resolve().relative_to(ROOT_DIR).as_posix()


def _subject_from_name(name: str) -> str:
    normalized = Path(name).stem.lower().replace("_", "-")
    for alias in sorted(SUBJECT_ALIASES, key=len, reverse=True):
        if re.search(rf"(?:^|-){re.escape(alias)}(?:-|$)", normalized):
            return SUBJECT_ALIASES[alias]
    return ""


def _version_from_name(path: Path) -> tuple[str, bool]:
    match = VERSION_RE.search(path.name)
    return (match.group("version"), False) if match else ("1.0.0", True)


def _base_entry(path: Path, document_type: str) -> dict[str, Any]:
    version, legacy_filename = _version_from_name(path)
    class_match = re.search(r"class[-_](\d{1,2})", path.name, re.IGNORECASE)
    academic_match = re.search(r"(20\d{2})[-_](\d{2})(?:-|_v|\.pdf)", path.name, re.IGNORECASE)
    document_id = VERSION_RE.sub("", path.name).removesuffix(".pdf").lower().replace("_", "-")
    document_id = re.sub(r"[^a-z0-9-]+", "-", document_id).strip("-")
    entry: dict[str, Any] = {
        "document_id": document_id,
        "version": version,
        "status": "active",
        "path": _repo_path(path),
        "sha256": file_sha256(path),
        "board": "CGBSE",
        "class": class_match.group(1) if class_match else "",
        "subject": _subject_from_name(path.name),
        "medium": "English" if _subject_from_name(path.name) == "English" else "Hindi",
        "academic_year": f"{academic_match.group(1)}-{academic_match.group(2)}" if academic_match else "",
        "document_type": document_type,
        "authority": "CGBSE" if document_type != "textbook" else "SCERT Chhattisgarh",
        "ingestion_enabled": document_type != "archived_consolidated_pyq",
        "repository_managed": document_type != "textbook",
        "legacy_filename": legacy_filename,
    }
    return entry


def _catalog_sources() -> list[tuple[Path, str]]:
    sources: list[tuple[Path, str]] = []
    rules = [
        (ROOT_DIR / "ingestion/data/documents/curricula", "curriculum"),
        (ROOT_DIR / "ingestion/data/documents/model_papers", "model_question_paper"),
        (ROOT_DIR / "ingestion/data/documents/marking_schemes", "marking_scheme"),
        (ROOT_DIR / "ingestion/data/documents/answer_keys", "answer_key"),
        (ROOT_DIR / "ingestion/data/documents/learning_outcomes", "learning_outcome"),
        (ROOT_DIR / "ingestion/data/documents/teacher_guides", "teacher_guide"),
        (ROOT_DIR / "ingestion/data/documents/blueprints", "assessment_blueprint"),
        (ROOT_DIR / "ingestion/data/documents/academic_calendars", "academic_calendar"),
        (ROOT_DIR / "ingestion/data/textbooks", "textbook"),
        (ROOT_DIR / "ingestion/data/archive/consolidated_pyq", "archived_consolidated_pyq"),
    ]
    for directory, document_type in rules:
        if directory.exists():
            sources.extend((path, document_type) for path in sorted(directory.glob("*.pdf")))

    paper_dir = ROOT_DIR / "ingestion/data/Previous_Year_Questions"
    if paper_dir.exists():
        sources.extend(
            (path, "previous_year_question")
            for path in sorted(paper_dir.glob("*.pdf"))
            if "model-paper" not in path.name.lower()
        )
    return sources


def build_initial_catalog(catalog_version: str = "1.0.0") -> dict[str, Any]:
    documents: list[dict[str, Any]] = []
    for path, document_type in _catalog_sources():
        entry = _base_entry(path, document_type)
        if document_type == "model_question_paper":
            public_name = path.name
            public_path = ROOT_DIR / "frontend/public/pyq" / public_name
            display_path = ROOT_DIR / "ingestion/data/Previous_Year_Questions" / public_name
            entry["source_file"] = public_name
            entry["public_path"] = _repo_path(public_path)
            entry["public_sha256"] = file_sha256(public_path) if public_path.is_file() else ""
            entry["display_source_path"] = _repo_path(display_path)
            entry["display_source_sha256"] = file_sha256(display_path) if display_path.is_file() else ""
            # These are curated ingestion-ready PDFs. Their embedded structure and
            # numbers are more reliable than OCR, even when some Indic glyph maps
            # are imperfect.
            entry["ocr_required"] = False
        elif document_type == "previous_year_question":
            entry["source_file"] = path.name
            year_match = re.search(r"PYQ(\d{2,4})", path.name, re.IGNORECASE)
            set_match = re.search(r"SET[_-](.+?)\.pdf$", path.name, re.IGNORECASE)
            if year_match:
                raw_year = year_match.group(1)
                entry["year"] = f"20{raw_year}" if len(raw_year) == 2 else raw_year
            if set_match:
                entry["set"] = set_match.group(1).replace("_", " ")
            entry["ocr_required"] = entry["subject"] != "English"
        elif document_type == "curriculum":
            entry["source_file"] = path.name
            entry["ocr_required"] = False
        elif document_type == "textbook":
            entry["source_file"] = path.name
            entry["ocr_required"] = entry["subject"] != "English"
        else:
            entry["status"] = "archived"
            entry["authority"] = "legacy source"
            entry["ingestion_enabled"] = False
            entry["source_file"] = path.name
            legacy_names = {
                "English": "class_10_english_pyq.pdf",
                "Hindi": "class_10_hindi_PYQ.pdf",
                "Math": "class_10_maths_pyq.pdf",
                "Sanskrit": "class_10_sanskrit_pyq.pdf",
                "Science": "class_10_science_pyq.pdf",
                "Social Science": "class_10_social_science_pyq.pdf",
            }
            if entry["subject"] in legacy_names:
                entry["superseded_source_files"] = [legacy_names[entry["subject"]]]
        documents.append(entry)

    documents.sort(key=lambda item: (item["document_type"], item["subject"], item["document_id"]))
    return {
        "schema_version": SCHEMA_VERSION,
        "catalog_version": catalog_version,
        "updated_at": date.today().isoformat(),
        "versioning_policy": {
            "documents_are_immutable": True,
            "version_format": "MAJOR.MINOR.PATCH",
            "active_version_rule": "Only one active version per document_id may be ingested.",
            "change_rule": "Create a new versioned file and catalog entry; never replace a checksum in place.",
        },
        "documents": documents,
    }


def load_catalog(path: Path = CATALOG_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_catalog(catalog: dict[str, Any], *, verify_files: bool = True) -> list[str]:
    errors: list[str] = []
    if catalog.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"Unsupported schema_version: {catalog.get('schema_version')}")
    if not re.fullmatch(r"\d+\.\d+\.\d+", str(catalog.get("catalog_version", ""))):
        errors.append("catalog_version must use MAJOR.MINOR.PATCH")

    identities: set[tuple[str, str]] = set()
    active_ids: set[str] = set()
    for entry in catalog.get("documents", []):
        identity = (str(entry.get("document_id", "")), str(entry.get("version", "")))
        if identity in identities:
            errors.append(f"Duplicate document version: {identity[0]} v{identity[1]}")
        identities.add(identity)
        if not identity[0] or not re.fullmatch(r"\d+\.\d+\.\d+", identity[1]):
            errors.append(f"Invalid identity/version: {identity}")
        if entry.get("status") == "active":
            if identity[0] in active_ids:
                errors.append(f"Multiple active versions for document_id: {identity[0]}")
            active_ids.add(identity[0])
        if not verify_files:
            continue
        source_path = ROOT_DIR / str(entry.get("path", ""))
        if not source_path.is_file():
            if entry.get("repository_managed", True):
                errors.append(f"Missing source file: {entry.get('path')}")
            continue
        actual_sha = file_sha256(source_path)
        if actual_sha != entry.get("sha256"):
            errors.append(
                f"Checksum changed for {entry.get('document_id')} v{entry.get('version')}; "
                "create a new document version instead of replacing the PDF"
            )
        for path_key, sha_key in (
            ("public_path", "public_sha256"),
            ("display_source_path", "display_source_sha256"),
        ):
            if not entry.get(path_key):
                continue
            artifact = ROOT_DIR / entry[path_key]
            if not artifact.is_file():
                errors.append(f"Missing delivery artifact: {entry[path_key]}")
            elif file_sha256(artifact) != entry.get(sha_key):
                errors.append(f"Delivery artifact checksum changed: {entry[path_key]}")
    return errors


def catalog_entry_for_path(path: str | Path, catalog: dict[str, Any] | None = None) -> dict[str, Any] | None:
    catalog = catalog or load_catalog()
    resolved = Path(path).resolve()
    for entry in catalog.get("documents", []):
        if (ROOT_DIR / entry["path"]).resolve() == resolved:
            return dict(entry)
    return None


def active_ingestion_entries(catalog: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    catalog = catalog or load_catalog()
    return [
        dict(entry)
        for entry in catalog.get("documents", [])
        if entry.get("status") == "active" and entry.get("ingestion_enabled")
    ]


def _main() -> None:
    parser = argparse.ArgumentParser(description="Manage VidyaAI's immutable document catalog")
    subparsers = parser.add_subparsers(dest="command", required=True)
    bootstrap = subparsers.add_parser("bootstrap", help="Create the initial checksum-locked catalog")
    bootstrap.add_argument("--catalog-version", default="1.0.0")
    subparsers.add_parser("validate", help="Validate versions, paths, and checksums")
    subparsers.add_parser("list", help="List cataloged documents")
    args = parser.parse_args()

    if args.command == "bootstrap":
        if CATALOG_PATH.exists():
            raise SystemExit(f"{CATALOG_PATH} already exists; validation protects it from silent replacement")
        catalog = build_initial_catalog(args.catalog_version)
        CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {len(catalog['documents'])} locked document records to {CATALOG_PATH}")
        return

    catalog = load_catalog()
    if args.command == "validate":
        errors = validate_catalog(catalog)
        if errors:
            print("\n".join(f"ERROR: {error}" for error in errors))
            raise SystemExit(1)
        print(f"Catalog {catalog['catalog_version']} valid: {len(catalog['documents'])} documents")
        return

    for entry in catalog.get("documents", []):
        print(
            f"{entry['status']:8} {entry['document_type']:28} "
            f"{entry['document_id']} v{entry['version']} {entry['sha256'][:12]}"
        )


if __name__ == "__main__":
    _main()
