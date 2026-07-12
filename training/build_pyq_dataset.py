"""Build a large, grounded CGBSE PYQ instruction dataset.

Input must contain verified question/answer pairs as JSON or JSONL. The script
expands how a student may ask each question while keeping the verified answer
unchanged. Canonical questions are split as groups, preventing paraphrases of
the same answer from leaking into both train and evaluation sets.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
from pathlib import Path


SUBJECT_ALIASES = {
    "math": ("Math", "maths", "ganit", "गणित"),
    "science": ("Science", "vigyan", "विज्ञान"),
    "social science": ("Social Science", "SST", "social", "samajik vigyan"),
    "hindi": ("Hindi", "hindi", "हिंदी"),
    "english": ("English", "english"),
    "sanskrit": ("Sanskrit", "sanskrut", "संस्कृत"),
}

PROMPT_TEMPLATES = (
    "{question}",
    "{question} Iska exam-ready answer batao.",
    "{question} Simple language me samjhao.",
    "{question} {marks} marks ke hisab se answer likho.",
    "Class 10 {subject} PYQ: {question}",
    "Board exam ke liye solve karo: {question}",
    "Please {question}",
    "{question} Step by step batao.",
)


def read_records(paths: list[Path]) -> list[dict]:
    records: list[dict] = []
    for path in paths:
        if path.suffix.lower() == ".jsonl":
            rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
        else:
            payload = json.loads(path.read_text(encoding="utf-8"))
            rows = payload if isinstance(payload, list) else payload.get("items", [])
        records.extend(rows)
    return records


def normalize_record(row: dict) -> dict | None:
    question = str(row.get("question") or row.get("instruction") or "").strip()
    answer = str(row.get("answer") or row.get("output") or "").strip()
    metadata = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
    subject = str(row.get("subject") or metadata.get("subject") or "General").strip()
    if len(question) < 8 or len(answer) < 15:
        return None
    if any(marker in answer.lower() for marker in ("answer here", "todo", "unknown", "उत्तर यहाँ")):
        return None
    return {
        "question": re.sub(r"\s+", " ", question),
        "answer": answer,
        "subject": subject,
        "chapter": str(row.get("chapter") or metadata.get("chapter") or "General"),
        "marks": int(row.get("marks") or metadata.get("marks") or 3),
        "year": str(row.get("year") or metadata.get("year") or ""),
        "set": str(row.get("set") or metadata.get("set") or ""),
    }


def variants(record: dict, count: int) -> list[dict]:
    key = record["subject"].strip().lower()
    aliases = SUBJECT_ALIASES.get(key, (record["subject"],))
    seed = int(hashlib.sha1(record["question"].encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(seed)
    templates = list(PROMPT_TEMPLATES)
    rng.shuffle(templates)
    output = []
    for index in range(max(1, count)):
        template = templates[index % len(templates)]
        prompt = template.format(
            question=record["question"],
            subject=aliases[index % len(aliases)],
            marks=record["marks"],
        )
        output.append({
            "instruction": prompt,
            "output": record["answer"],
            "metadata": {
                **{key: record[key] for key in ("subject", "chapter", "marks", "year", "set")},
                "canonical_question": record["question"],
                "variant": index,
                "verified_answer_required": True,
            },
        })
    return output


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", type=Path, help="Verified PYQ Q&A JSON/JSONL files")
    parser.add_argument("--output-dir", type=Path, default=Path("training/training_data/pyq"))
    parser.add_argument("--variants", type=int, default=8, choices=range(1, 33))
    parser.add_argument("--test-ratio", type=float, default=0.1)
    args = parser.parse_args()

    canonical = [item for row in read_records(args.inputs) if (item := normalize_record(row))]
    if not canonical:
        raise SystemExit("No verified question/answer pairs found.")

    # Stable group split: all variants of one canonical question remain together.
    train, test = [], []
    for record in canonical:
        digest = int(hashlib.sha1(record["question"].encode("utf-8")).hexdigest()[:8], 16) / 0xFFFFFFFF
        target = test if digest < args.test_ratio else train
        target.extend(variants(record, args.variants))

    write_jsonl(args.output_dir / "train.jsonl", train)
    write_jsonl(args.output_dir / "test.jsonl", test)
    manifest = {
        "verified_pairs": len(canonical), "train_examples": len(train), "test_examples": len(test),
        "variants_per_pair": args.variants, "warning": "Review source answers before fine-tuning.",
    }
    (args.output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
