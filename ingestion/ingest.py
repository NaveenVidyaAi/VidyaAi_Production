import argparse
import hashlib
import logging
import os
import re
import sys
import unicodedata
from pathlib import Path
from typing import Dict, List, Optional

import pdfplumber
import pytesseract
from qdrant_client import QdrantClient
from qdrant_client.http.models import FieldCondition, Filter, MatchValue, PointStruct

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import settings
from backend.services.embeddings import embedding_service
from ingestion.document_catalog import (
    CATALOG_PATH,
    ROOT_DIR as CATALOG_ROOT_DIR,
    active_ingestion_entries,
    catalog_entry_for_path,
    file_sha256,
    load_catalog,
    validate_catalog,
)

COLLECTION_NAME = "cgbse_knowledge"
CHUNK_SIZE = 260
OVERLAP = 60
logger = logging.getLogger(__name__)

FIELD_KEYS = ["CLASS:", "SUBJECT:", "CHAPTER:", "TOPIC:", "SUBTOPIC:"]
LESSON_RE = re.compile(
    r"(?P<prefix>(?:^|\n)\s*पाठ\s*-?\s*)"
    r"(?P<lesson>\d{1,2}\s*[.\-]\s*\d{1,2})"
    r"\s*:?\s*(?P<title>[^\n]{0,90})"
)
ENGLISH_READING_RE = re.compile(
    r"(?P<prefix>(?:^|\n)\s*)"
    r"Reading[ \t]*(?P<letter>[ABC])[ \t]*:?[ \t]*(?P<title>[^\n]{0,110})",
    flags=re.IGNORECASE,
)

CLASS_10_ENGLISH_READINGS = {
    "1-A": "Patriotism",
    "1-B": "How The Little Kite Learned To Fly?",
    "1-C": "A Great Moment For All Those Children",
    "2-A": "The Never-Never Nest",
    "2-B": "Excuses, Excuses and Excuses",
    "2-C": "Uncle Podger Hangs a Picture",
    "3-A": "The Girl Who Asked Why",
    "3-B": "Including All My Friends",
    "3-C": "An Open Letter To The Teacher From a Child With Autism",
    "4-A": "Swami Is Expelled From School",
    "4-B": "About Me",
    "4-C": "Daddy's Enduring Script",
    "5-A": "Swiss Family Robinson",
    "5-B": "Sumba's Adventure",
    "5-C": "Adventures of Ibn Battuta",
}


COMMON_TEXT_FIXES = {
    "कवता": "कविता",
    "हन्दी": "हिन्दी",
    "हदं ी": "हिंदी",
    "नमद ा": "नर्मदा",
    "नमदा": "नर्मदा",
    "घरत े": "घिरते",
    "नागाजनु": "नागार्जुन",
    "ऋतरु ाज": "ऋतुराज",
    "वद्यासागर": "विद्यासागर",
    "परहार": "परिहार",
    "सख्ं या": "संख्या",
    "वधा": "विधा",
    "पाठ्यपस्ु तक": "पाठ्यपुस्तक",
}


def _looks_garbled(text: str) -> bool:
    compact = re.sub(r"\s+", "", text or "")
    if not compact:
        return True

    devanagari_count = len(re.findall(r"[\u0900-\u097F]", text))
    latin_count = len(re.findall(r"[A-Za-z]", text))
    total_letters = devanagari_count + latin_count

    if total_letters < 40:
        return False

    devanagari_ratio = devanagari_count / max(total_letters, 1)
    latin_ratio = latin_count / max(total_letters, 1)
    null_ratio = text.count("\x00") / max(len(text), 1)
    mixed_script_edges = len(re.findall(r"[A-Za-z][\u0900-\u097F]|[\u0900-\u097F][A-Za-z]", text))
    legacy_glyphs = len(re.findall(r"[¼½¾]", text))
    legacy_roman_tokens = len(
        re.findall(
            r"\b(?:ds|dk|dh|fd|gS|ij|bl|vk|dks|esa|fy|rFkk|iz|;g|ugha|gks|dj|ls|esa)\b",
            text,
        )
    )

    return (
        null_ratio > 0.01
        or (devanagari_count > 80 and latin_ratio > 0.30 and mixed_script_edges > 25)
        or (devanagari_count > 40 and legacy_glyphs > 8)
        or (devanagari_count > 20 and latin_count > 120 and legacy_roman_tokens > 18)
        or (0 < devanagari_ratio < 0.08 and latin_count > 120)
    )


def normalize_hindi_text(text: str) -> str:
    text = unicodedata.normalize("NFC", text or "")
    text = text.replace("\x00", "")
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
    text = re.sub(r"([A-Za-z])-\s*\n\s*([A-Za-z])", r"\1\2", text)
    text = re.sub(r"([^\S\n])+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    for wrong, right in COMMON_TEXT_FIXES.items():
        text = text.replace(wrong, right)
    return text.strip()


def _metadata_from_filename(path: str) -> Dict[str, str]:
    name = os.path.basename(path)
    base, _ = os.path.splitext(name)
    normalized = base.replace("-", "_").replace(" ", "_")
    lower_path = path.lower()

    meta = {
        "class": "",
        "subject": "",
        "chapter": "",
        "topic": "",
        "subtopic": "",
        "document_type": "textbook",
        "document_version": "1.0.0",
    }

    version_match = re.search(r"[-_]v(\d+\.\d+\.\d+)(?:\.pdf)?$", name, flags=re.IGNORECASE)
    if version_match:
        meta["document_version"] = version_match.group(1)

    academic_year_match = re.search(r"(20\d{2})[-_](\d{2})", normalized)
    if academic_year_match:
        meta["academic_year"] = f"{academic_year_match.group(1)}-{academic_year_match.group(2)}"

    if "curricul" in normalized.lower():
        meta["document_type"] = "curriculum"
        meta["content_type"] = "curriculum"
        meta["topic"] = "Curriculum and assessment blueprint"

    if re.search(r"model[_\s-]*paper|model[_\s-]*question", normalized, flags=re.IGNORECASE):
        meta["document_type"] = "model_question_paper"
        meta["content_type"] = "model_question_paper"
        meta["topic"] = "Model Question Paper"

    managed_type_patterns = (
        (r"marking[_\s-]*scheme|ank[_\s-]*yojana", "marking_scheme", "Marking Scheme"),
        (r"answer[_\s-]*key|uttar[_\s-]*mala", "answer_key", "Answer Key"),
        (r"learning[_\s-]*outcome", "learning_outcome", "Learning Outcomes"),
        (r"teacher[_\s-]*(?:guide|handbook)", "teacher_guide", "Teacher Guide"),
        (r"assessment[_\s-]*blueprint|paper[_\s-]*blueprint", "assessment_blueprint", "Assessment Blueprint"),
        (r"academic[_\s-]*calendar", "academic_calendar", "Academic Calendar"),
    )
    for pattern, document_type, topic_label in managed_type_patterns:
        if re.search(pattern, normalized, flags=re.IGNORECASE):
            meta["document_type"] = document_type
            meta["content_type"] = document_type
            meta["topic"] = topic_label
            break

    is_pyq = bool(
        re.search(r"(?:^|_)pyq(?:_|$|\d)", normalized, flags=re.IGNORECASE)
        or "previous_year" in lower_path
        or "previous year" in lower_path
    )
    if is_pyq:
        meta["document_type"] = "previous_year_question"
        meta["content_type"] = "previous_year_question"
        meta["topic"] = "Previous Year Questions"

    class_match = re.search(r"class[_\s]*(x|ix|viii|\d{1,2})", normalized, flags=re.IGNORECASE)
    if class_match:
        raw_class = class_match.group(1).upper()
        roman_map = {"X": "10", "IX": "9", "VIII": "8"}
        meta["class"] = roman_map.get(raw_class, raw_class)

    subject_match = re.search(r"(hindi|english|sanskrit|maths?|science|vigyan|ganit|social(?:_science)?)", normalized, flags=re.IGNORECASE)
    if subject_match:
        raw = subject_match.group(1).lower().replace("_", " ")
        subject_map = {
            "hindi": "Hindi",
            "english": "English",
            "sanskrit": "Sanskrit",
            "math": "Math",
            "maths": "Math",
            "ganit": "Math",
            "science": "Science",
            "vigyan": "Science",
            "social science": "Social Science",
            "social": "Social Science",
        }
        meta["subject"] = subject_map.get(raw, raw.title())

    chapter_match = re.search(r"chapter[_\s]*(\d{1,2})", normalized, flags=re.IGNORECASE)
    if chapter_match:
        meta["chapter"] = chapter_match.group(1)

    if is_pyq:
        year_match = re.search(r"pyq[_\s]*(\d{2,4})", normalized, flags=re.IGNORECASE)
        if year_match:
            raw_year = year_match.group(1)
            meta["year"] = f"20{raw_year}" if len(raw_year) == 2 else raw_year
            meta["topic"] = f"Previous Year Questions {meta['year']}"
        set_match = re.search(r"set[_\s]*([a-z0-9]+)", normalized, flags=re.IGNORECASE)
        if set_match:
            meta["set"] = set_match.group(1).upper()
            meta["subtopic"] = f"Set {meta['set']}"
        return meta

    topic = normalized
    topic = re.sub(r"class[_\s]*(x|ix|viii|\d{1,2})", "", topic, flags=re.IGNORECASE)
    topic = re.sub(r"(hindi|english|sanskrit|maths?|ganit|science|vigyan|social[_\s]*science)", "", topic, flags=re.IGNORECASE)
    topic = re.sub(r"chapter[_\s]*\d{1,2}", "", topic, flags=re.IGNORECASE)
    topic = re.sub(r"_+", " ", topic).strip(" _")
    generic_topics = {"credits", "subject", "class subject", "ganit", "vigyan"}
    if topic and topic.lower() not in generic_topics and not meta.get("topic"):
        meta["topic"] = topic.title()

    return meta


def _resolve_ingest_path(file_arg: str) -> str:
    if os.path.isabs(file_arg) or os.path.exists(file_arg):
        return file_arg
    return os.path.join(os.path.dirname(__file__), "data", "textbooks", file_arg)


def extract_text_from_pdf(path: str, enable_ocr: bool = False) -> str:
    text = []
    ocr_available = True
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if enable_ocr and (not page_text or _looks_garbled(page_text)):
                if ocr_available:
                    image = page.to_image(resolution=150)
                    try:
                        page_text = pytesseract.image_to_string(image.original, lang="hin+eng")
                    except pytesseract.TesseractNotFoundError:
                        ocr_available = False
                    except pytesseract.TesseractError:
                        page_text = pytesseract.image_to_string(image.original)

                # If OCR is unavailable or failed, keep extracted text (even if imperfect)
                # so ingestion can proceed and metadata can still be attached.
            text.append(normalize_hindi_text(page_text or ""))
    return normalize_hindi_text("\n".join(text))


def detect_metadata(text: str) -> Dict[str, str]:
    metadata = {
        "text": text,
        "class": "",
        "subject": "",
        "chapter": "",
        "topic": "",
        "subtopic": "",
        "content_type": "theory",
    }
    for line in text.splitlines():
        stripped = line.strip()
        for key in FIELD_KEYS:
            if stripped.upper().startswith(key):
                value = stripped.split(":", 1)[1].strip()
                metadata[key[:-1].lower()] = value
    lower = text.lower()
    if "example" in lower or "solution:" in lower:
        metadata["content_type"] = "example"
    elif "q:" in lower or "question" in lower:
        metadata["content_type"] = "question"
    return metadata


def chunk_text(text: str) -> List[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_SIZE, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += CHUNK_SIZE - OVERLAP
    return chunks


def _clean_lesson_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title or "").strip(" :-।\t")
    title = re.sub(r"\b\d{1,3}\s*[-–]\s*\d{1,3}\b.*$", "", title).strip()
    title = re.sub(r"\([^)]{0,40}\)", "", title).strip()
    return title[:90]


def _lesson_metadata(section_text: str, base_metadata: Dict[str, str]) -> Dict[str, str]:
    metadata = dict(base_metadata)
    match = LESSON_RE.search(section_text)
    if match:
        lesson = re.sub(r"\s+", "", match.group("lesson")).replace(".", "-")
        metadata["chapter"] = lesson
        metadata["topic"] = _clean_lesson_title(match.group("title")) or metadata.get("topic", "")
    return metadata


def _normalize_english_title(text: str) -> str:
    text = (text or "").replace("’", "'")
    text = text.replace("austim", "autism").replace("Austim", "Autism")
    text = text.replace("batutta", "battuta").replace("Batutta", "Battuta")
    text = re.sub(r"[^a-zA-Z0-9]+", " ", text)
    text = re.sub(r"\b\d{1,3}\b", " ", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def _class_10_english_reading_key(section_text: str, letter: str, raw_title: str) -> Optional[str]:
    normalized_section = _normalize_english_title(section_text[:900])
    normalized_title = _normalize_english_title(raw_title)
    letter = (letter or "").upper()

    for key, title in CLASS_10_ENGLISH_READINGS.items():
        if not key.endswith(f"-{letter}"):
            continue
        normalized_known = _normalize_english_title(title)
        title_tokens = normalized_title.split()
        known_tokens = normalized_known.split()
        if normalized_known and normalized_known in normalized_section:
            return key
        if normalized_title and (
            normalized_title in normalized_known
            or normalized_known in normalized_title
            or (len(title_tokens) >= 5 and title_tokens[:5] == known_tokens[:5])
            or all(token in normalized_section for token in normalized_known.split()[-3:])
        ):
            return key
    return None


def _english_reading_metadata(section_text: str, base_metadata: Dict[str, str]) -> Dict[str, str]:
    metadata = dict(base_metadata)
    match = ENGLISH_READING_RE.search(section_text)
    if not match:
        return metadata

    letter = match.group("letter").upper()
    raw_title = _clean_lesson_title(match.group("title"))
    if not raw_title:
        after_heading = section_text[match.end():].splitlines()
        raw_title = _clean_lesson_title(next((line for line in after_heading if line.strip()), ""))

    reading_key = _class_10_english_reading_key(section_text, letter, raw_title)
    metadata["chapter"] = reading_key or letter
    metadata["topic"] = CLASS_10_ENGLISH_READINGS.get(reading_key, raw_title or metadata.get("topic", ""))
    metadata["content_type"] = "reading"
    return metadata


def _chunk_english_text_with_metadata(text: str, base_metadata: Dict[str, str]) -> List[tuple[str, Dict[str, str]]]:
    matches = list(ENGLISH_READING_RE.finditer(text))
    body_matches = [match for match in matches if not match.group("title").strip()]
    if body_matches:
        matches = body_matches
    if not matches:
        return [(chunk, dict(base_metadata)) for chunk in chunk_text(text)]

    chunks: List[tuple[str, Dict[str, str]]] = []
    preface = text[: matches[0].start()].strip()
    if preface:
        preface_meta = dict(base_metadata)
        preface_meta["content_type"] = "toc"
        preface_meta["topic"] = preface_meta.get("topic") or "Front Matter"
        chunks.extend((chunk, dict(preface_meta)) for chunk in chunk_text(preface))

    seen_reading_keys = set()
    for idx, match in enumerate(matches):
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        section_text = text[match.start():end].strip()
        if not section_text:
            continue

        reading_meta = _english_reading_metadata(section_text, base_metadata)
        reading_key = reading_meta.get("chapter", "")

        # Skip duplicate table-of-contents snippets once the real reading body was seen.
        if reading_key in seen_reading_keys and len(section_text.split()) < 90:
            continue
        if reading_key:
            seen_reading_keys.add(reading_key)

        for chunk in chunk_text(section_text):
            chunks.append((chunk, dict(reading_meta)))
    return chunks


def chunk_text_with_metadata(text: str, base_metadata: Dict[str, str]) -> List[tuple[str, Dict[str, str]]]:
    if str(base_metadata.get("subject", "")).lower() == "english":
        return _chunk_english_text_with_metadata(text, base_metadata)

    matches = list(LESSON_RE.finditer(text))
    if not matches:
        return [(chunk, dict(base_metadata)) for chunk in chunk_text(text)]

    chunks: List[tuple[str, Dict[str, str]]] = []
    preface = text[: matches[0].start()].strip()
    if preface:
        preface_meta = dict(base_metadata)
        preface_meta["content_type"] = "toc"
        preface_meta["topic"] = preface_meta.get("topic") or "अनुक्रमणिका"
        chunks.extend((chunk, dict(preface_meta)) for chunk in chunk_text(preface))

    for idx, match in enumerate(matches):
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        section_text = text[match.start():end].strip()
        if not section_text:
            continue
        lesson_meta = _lesson_metadata(section_text, base_metadata)
        for chunk in chunk_text(section_text):
            chunks.append((chunk, dict(lesson_meta)))
    return chunks


def create_qdrant_collection(client: QdrantClient):
    existing = [col.name for col in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        from qdrant_client.http.models import VectorParams, Distance
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


def _delete_existing_source(client: QdrantClient, source_file: str) -> None:
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="source_file",
                    match=MatchValue(value=source_file),
                )
            ]
        ),
    )


def _delete_existing_document(client: QdrantClient, document_id: str, source_file: str) -> None:
    """Replace the active knowledge version while preserving PDF history on disk."""
    if document_id:
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            ),
        )
    # Remove points created before document_id/version metadata existed.
    if source_file:
        _delete_existing_source(client, source_file)


def get_qdrant_client() -> QdrantClient:
    try:
        client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port, timeout=5)
        client.get_collections()
        return client
    except Exception as exc:
        if str(settings.app_env).lower() == "production":
            raise RuntimeError(
                f"Qdrant unavailable at {settings.qdrant_host}:{settings.qdrant_port}; refusing to ingest into fallback storage in production."
            ) from exc

        fallback_path = os.path.join(os.path.dirname(__file__), "..", "qdrant_storage_local")
        os.makedirs(fallback_path, exist_ok=True)
        logger.warning(
            "Qdrant unavailable at %s:%s; using local persistence at %s",
            settings.qdrant_host,
            settings.qdrant_port,
            fallback_path,
        )
        return QdrantClient(path=fallback_path)


def _catalog_qdrant_metadata(entry: dict, catalog_version: str) -> Dict[str, str | bool]:
    metadata: Dict[str, str | bool] = {
        "document_id": str(entry.get("document_id", "")),
        "document_version": str(entry.get("version", "1.0.0")),
        "catalog_version": catalog_version,
        "source_sha256": str(entry.get("sha256", "")),
        "board": str(entry.get("board", "CGBSE")),
        "class": str(entry.get("class", "")),
        "subject": str(entry.get("subject", "")),
        "medium": str(entry.get("medium", "")),
        "academic_year": str(entry.get("academic_year", "")),
        "document_type": str(entry.get("document_type", "")),
        "authority": str(entry.get("authority", "")),
        "document_status": str(entry.get("status", "active")),
        "is_active_version": entry.get("status") == "active",
        "source_path": str(entry.get("path", "")),
    }
    for key in ("year", "set"):
        if entry.get(key):
            metadata[key] = str(entry[key])
    return {key: value for key, value in metadata.items() if value != ""}


def ingest_file(path: str, enable_ocr: bool = False, dry_run: bool = False):
    resolved_path = str(Path(path).resolve())
    catalog = load_catalog() if CATALOG_PATH.is_file() else {"catalog_version": "0.0.0", "documents": []}
    entry = catalog_entry_for_path(resolved_path, catalog)
    if entry:
        actual_sha = file_sha256(Path(resolved_path))
        if actual_sha != entry.get("sha256"):
            raise RuntimeError(
                f"Checksum mismatch for {entry['document_id']} v{entry['version']}; "
                "create a new document version instead of editing the PDF in place"
            )
        if entry.get("status") != "active" or not entry.get("ingestion_enabled"):
            raise RuntimeError(f"Document is not active for ingestion: {entry['document_id']} v{entry['version']}")
    effective_ocr = enable_ocr or bool(entry and entry.get("ocr_required"))
    print(f"Extracting text from {path} (OCR {'enabled' if effective_ocr else 'disabled'})...", flush=True)
    text = extract_text_from_pdf(resolved_path, enable_ocr=effective_ocr)
    if len(text.strip()) < 100:
        raise RuntimeError(f"Extracted text is too short for safe ingestion: {path}")
    file_metadata = _metadata_from_filename(path)
    catalog_metadata = _catalog_qdrant_metadata(entry, str(catalog.get("catalog_version", "0.0.0"))) if entry else {}
    for key, value in catalog_metadata.items():
        if value != "":
            file_metadata[key] = value
    chunks = chunk_text_with_metadata(text, file_metadata)
    print(f"Prepared {len(chunks)} chunks from {path}.", flush=True)
    source_file = str(entry.get("source_file")) if entry and entry.get("source_file") else os.path.basename(path)
    summary = {
        "path": resolved_path,
        "document_id": str(file_metadata.get("document_id", Path(path).stem)),
        "document_version": str(file_metadata.get("document_version", "1.0.0")),
        "document_type": str(file_metadata.get("document_type", "textbook")),
        "subject": str(file_metadata.get("subject", "")),
        "source_file": source_file,
        "chunks": len(chunks),
        "characters": len(text),
        "ocr": effective_ocr,
        "dry_run": dry_run,
    }
    if dry_run:
        print(f"DRY RUN: {summary}", flush=True)
        return summary

    client = get_qdrant_client()
    create_qdrant_collection(client)
    _delete_existing_document(client, str(file_metadata.get("document_id", "")), source_file)
    points = []
    for idx, (chunk, base_metadata) in enumerate(chunks):
        metadata = detect_metadata(chunk)
        for key, value in base_metadata.items():
            if key == "content_type" and value:
                metadata[key] = value
            elif value and not metadata.get(key):
                metadata[key] = value
        metadata["source_file"] = source_file

        vector = embedding_service.embed(chunk)
        identity = (
            f"{file_metadata.get('document_id', source_file)}::"
            f"{file_metadata.get('document_version', '1.0.0')}::"
            f"{file_metadata.get('source_sha256', '')}::{idx}"
        )
        stable_id = int(hashlib.sha1(identity.encode("utf-8")).hexdigest()[:16], 16)
        points.append(
            PointStruct(
                id=stable_id,
                vector=vector,
                payload=metadata,
            )
        )
    client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"Ingested {len(points)} chunks from {path} into Qdrant.")
    return summary


def prune_archived_documents(catalog: dict | None = None) -> int:
    """Remove archived/superseded vector sources without deleting source history."""
    catalog = catalog or load_catalog()
    client = get_qdrant_client()
    existing = [collection.name for collection in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        print(f"Collection {COLLECTION_NAME} does not exist; nothing to prune.", flush=True)
        return 0
    pruned = 0
    for entry in catalog.get("documents", []):
        if entry.get("status") != "archived":
            continue
        sources = [str(entry.get("source_file") or ""), *map(str, entry.get("superseded_source_files") or [])]
        _delete_existing_document(client, str(entry.get("document_id") or ""), sources[0])
        for source_file in sources[1:]:
            if source_file:
                _delete_existing_source(client, source_file)
        pruned += 1
    print(f"Pruned vectors for {pruned} archived document records.", flush=True)
    return pruned


def main():
    parser = argparse.ArgumentParser(description="Ingest CGBSE PDF into Qdrant.")
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--file", help="PDF path, or a filename under ingestion/data/textbooks")
    selection.add_argument("--all-active", action="store_true", help="Ingest all active catalog entries")
    selection.add_argument("--prune-archived", action="store_true", help="Delete vectors for cataloged archived/superseded sources")
    parser.add_argument(
        "--document-type",
        action="append",
        default=[],
        help="With --all-active, include only this catalog document type (repeatable)",
    )
    parser.add_argument("--enable-ocr", action="store_true", help="Render pages and OCR garbled text. Uses much more memory.")
    parser.add_argument("--dry-run", action="store_true", help="Extract, classify, and chunk without writing to Qdrant")
    args = parser.parse_args()
    if args.prune_archived:
        catalog = load_catalog()
        errors = validate_catalog(catalog)
        if errors:
            raise SystemExit("\n".join(errors))
        prune_archived_documents(catalog)
        return
    if args.all_active:
        catalog = load_catalog()
        errors = validate_catalog(catalog)
        if errors:
            raise SystemExit("\n".join(errors))
        entries = active_ingestion_entries(catalog)
        if args.document_type:
            allowed = set(args.document_type)
            entries = [entry for entry in entries if entry.get("document_type") in allowed]
        if not entries:
            raise SystemExit("No active catalog documents matched the requested types")
        for entry in entries:
            ingest_file(
                str(CATALOG_ROOT_DIR / entry["path"]),
                enable_ocr=args.enable_ocr,
                dry_run=args.dry_run,
            )
        return
    ingest_file(_resolve_ingest_path(args.file), enable_ocr=args.enable_ocr, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
