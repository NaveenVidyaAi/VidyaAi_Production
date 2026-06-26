import argparse
import hashlib
import os
import re
from typing import Dict, List, Optional

import pdfplumber
import pytesseract
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct

from backend.config import settings
from backend.services.embeddings import embedding_service

COLLECTION_NAME = "cgbse_knowledge"
CHUNK_SIZE = 400
OVERLAP = 50

FIELD_KEYS = ["CLASS:", "SUBJECT:", "CHAPTER:", "TOPIC:", "SUBTOPIC:"]


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
    return devanagari_ratio < 0.08 and latin_count > 120


def _metadata_from_filename(path: str) -> Dict[str, str]:
    name = os.path.basename(path)
    base, _ = os.path.splitext(name)
    normalized = base.replace("-", "_").replace(" ", "_")

    meta = {
        "class": "",
        "subject": "",
        "chapter": "",
        "topic": "",
        "subtopic": "",
    }

    class_match = re.search(r"class[_\s]*(x|ix|viii|\d{1,2})", normalized, flags=re.IGNORECASE)
    if class_match:
        raw_class = class_match.group(1).upper()
        roman_map = {"X": "10", "IX": "9", "VIII": "8"}
        meta["class"] = roman_map.get(raw_class, raw_class)

    subject_match = re.search(r"(hindi|english|math|science|social(?:_science)?)", normalized, flags=re.IGNORECASE)
    if subject_match:
        raw = subject_match.group(1).lower().replace("_", " ")
        subject_map = {
            "hindi": "Hindi",
            "english": "English",
            "math": "Math",
            "science": "Science",
            "social science": "Social Science",
            "social": "Social Science",
        }
        meta["subject"] = subject_map.get(raw, raw.title())

    chapter_match = re.search(r"chapter[_\s]*(\d{1,2})", normalized, flags=re.IGNORECASE)
    if chapter_match:
        meta["chapter"] = chapter_match.group(1)

    topic = normalized
    topic = re.sub(r"class[_\s]*(x|ix|viii|\d{1,2})", "", topic, flags=re.IGNORECASE)
    topic = re.sub(r"(hindi|english|math|science|social[_\s]*science)", "", topic, flags=re.IGNORECASE)
    topic = re.sub(r"chapter[_\s]*\d{1,2}", "", topic, flags=re.IGNORECASE)
    topic = re.sub(r"_+", " ", topic).strip(" _")
    if topic and topic.lower() != "credits":
        meta["topic"] = topic.title()

    return meta


def extract_text_from_pdf(path: str) -> str:
    text = []
    ocr_available = True
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text and not _looks_garbled(page_text):
                text.append(page_text)
            else:
                if ocr_available:
                    image = page.to_image(resolution=300)
                    try:
                        page_text = pytesseract.image_to_string(image.original, lang="hin+eng")
                    except pytesseract.TesseractNotFoundError:
                        ocr_available = False
                    except pytesseract.TesseractError:
                        page_text = pytesseract.image_to_string(image.original)

                # If OCR is unavailable or failed, keep extracted text (even if imperfect)
                # so ingestion can proceed and metadata can still be attached.
                text.append(page_text or "")
    return "\n".join(text)


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


def create_qdrant_collection(client: QdrantClient):
    existing = [col.name for col in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        from qdrant_client.http.models import VectorParams, Distance
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


def ingest_file(path: str):
    text = extract_text_from_pdf(path)
    chunks = chunk_text(text)
    file_metadata = _metadata_from_filename(path)
    client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
    create_qdrant_collection(client)
    points = []
    for idx, chunk in enumerate(chunks):
        metadata = detect_metadata(chunk)
        for key, value in file_metadata.items():
            if value and not metadata.get(key):
                metadata[key] = value
        metadata["source_file"] = os.path.basename(path)

        vector = embedding_service.embed(f"passage: {chunk}")
        stable_id = int(hashlib.sha1(f"{os.path.basename(path)}::{idx}".encode("utf-8")).hexdigest()[:16], 16)
        points.append(
            PointStruct(
                id=stable_id,
                vector=vector,
                payload=metadata,
            )
        )
    client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"Ingested {len(points)} chunks from {path} into Qdrant.")


def main():
    parser = argparse.ArgumentParser(description="Ingest CGBSE textbook PDF into Qdrant.")
    parser.add_argument("--file", required=True, help="Path to textbook PDF under ingestion/data/textbooks")
    args = parser.parse_args()
    ingest_file(os.path.join(os.path.dirname(__file__), "data", "textbooks", args.file))


if __name__ == "__main__":
    main()
