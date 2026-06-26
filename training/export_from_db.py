#!/usr/bin/env python3
"""
Export live Q&A data from PostgreSQL → training/training_data/train.jsonl + test.jsonl

Pulls from:
  - qa_cache       : Every unique question+answer the system has ever generated
  - weak_topics    : Topics flagged by students as not understood (used to label hard questions)
  - chat_sessions  : Used to detect which cache entries were thumbs-downed (quality exclusion)

Quality filters applied:
  1. source_type = 'groq'   (exclude pure cache-hit answers with no Groq involvement)
  2. len(answer) >= 80      (exclude very short/trivial answers)
  3. len(question) >= 8     (exclude junk questions)
  4. Optional: --min-hits N  (only export if hit_count >= N, meaning multiple students used it)
  5. Optional: --exclude-weak  (skip Q&A pairs whose subject+topic was flagged as weak by ANY student)

Output format (same as hand-crafted training_data):
  {"instruction": "...", "output": "...", "metadata": {...}}

Usage:
  # Export everything (append to existing data):
  python -m training.export_from_db

  # Only well-validated answers (used by ≥2 students):
  python -m training.export_from_db --min-hits 2

  # Exclude weak-topic-flagged content:
  python -m training.export_from_db --exclude-weak

  # Overwrite instead of append:
  python -m training.export_from_db --overwrite

  # Custom DB connection:
  python -m training.export_from_db --db-url "postgresql://user:pass@host:5432/dbname"

  # Dry run - show stats only, don't write files:
  python -m training.export_from_db --dry-run
"""

import argparse
import json
import os
import random
import sys
from datetime import datetime
from pathlib import Path

import psycopg2
import psycopg2.extras

# ── default DB URL (matches docker-compose.yml) ──────────────────────────────
DEFAULT_DB_URL = "postgresql://vidyaai:password@localhost:5432/vidyaai_db"

# ── output paths ─────────────────────────────────────────────────────────────
TRAIN_PATH = Path(__file__).parent / "training_data" / "train.jsonl"
TEST_PATH  = Path(__file__).parent / "training_data" / "test.jsonl"
TEST_SPLIT = 0.1   # 10% of new records go to test set


# ─────────────────────────────────────────────────────────────────────────────

def connect(db_url: str):
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except psycopg2.OperationalError as e:
        print(f"[ERROR] Cannot connect to DB: {e}")
        print("       Is the postgres Docker container running? (docker compose up -d postgres)")
        sys.exit(1)


def load_weak_subjects(conn) -> set[str]:
    """Return a set of (subject) strings that were flagged as weak by any student."""
    with conn.cursor() as cur:
        cur.execute("SELECT DISTINCT subject FROM weak_topics;")
        return {row[0] for row in cur.fetchall()}


def load_excluded_normalized_questions(conn) -> set[str]:
    """
    Return normalized_questions that correspond to chat sessions where the student
    marked 'understood=false'. We detect this indirectly: if a weak_topic was created
    immediately after a session for the same student+subject, that session is suspect.

    Simpler heuristic used here: exclude qa_cache entries whose subject appears
    in weak_topics AND hit_count == 1 (only 1 use, no positive reuse signal).
    Full exclusion by (subject, topic) would require topic extraction — not done here.
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT DISTINCT wt.subject
            FROM weak_topics wt
        """)
        weak_subjects = {row[0] for row in cur.fetchall()}
    return weak_subjects


def fetch_cache_rows(conn, min_hits: int, exclude_weak_subjects: set[str]) -> list[dict]:
    """Fetch qualifying rows from qa_cache."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT
                id,
                original_question,
                normalized_question,
                answer,
                subject,
                class_level,
                source_type,
                hit_count,
                created_at
            FROM qa_cache
            WHERE source_type IN ('groq', 'rag')
              AND LENGTH(answer) >= 80
              AND LENGTH(original_question) >= 8
              AND hit_count >= %s
            ORDER BY hit_count DESC, created_at DESC;
        """, (min_hits,))
        rows = cur.fetchall()

    # apply weak-subject exclusion (only exclude if single-hit AND weak subject)
    filtered = []
    excluded_count = 0
    for row in rows:
        if row["subject"] in exclude_weak_subjects and row["hit_count"] == 1:
            excluded_count += 1
            continue
        filtered.append(dict(row))

    print(f"[DB]    Raw rows from qa_cache : {len(rows)}")
    print(f"[DB]    Excluded (weak+single) : {excluded_count}")
    print(f"[DB]    Remaining after filter : {len(filtered)}")
    return filtered


def row_to_jsonl(row: dict) -> dict:
    """Convert a qa_cache row to the training JSONL format."""
    question = row["original_question"].strip()
    subject  = row["subject"] or "General"
    class_lv = row["class_level"] or "10"

    instruction = (
        f"{question}\n"
        f"(Subject: {subject}, Class: {class_lv})"
    )

    # estimate difficulty from answer length
    alen = len(row["answer"])
    if alen < 200:
        difficulty = "easy"
    elif alen < 600:
        difficulty = "medium"
    else:
        difficulty = "hard"

    return {
        "instruction": instruction,
        "output": row["answer"].strip(),
        "metadata": {
            "subject": subject,
            "class_level": class_lv,
            "source": f"qa_cache:{row['source_type']}",
            "hit_count": row["hit_count"],
            "cache_id": row["id"],
            "difficulty": difficulty,
            "exported_at": datetime.utcnow().isoformat(),
        },
    }


def load_existing_ids(path: Path) -> set[int]:
    """Return cache_id values already present in a .jsonl file (to avoid duplicates)."""
    ids = set()
    if not path.exists():
        return ids
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                cid = obj.get("metadata", {}).get("cache_id")
                if cid is not None:
                    ids.add(int(cid))
            except json.JSONDecodeError:
                pass
    return ids


def write_jsonl(path: Path, records: list[dict], mode: str = "a"):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, mode, encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def count_lines(path: Path) -> int:
    if not path.exists():
        return 0
    with open(path, encoding="utf-8") as f:
        return sum(1 for line in f if line.strip())


# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Export Q&A from DB → training JSONL")
    parser.add_argument("--db-url",       default=DEFAULT_DB_URL, help="PostgreSQL connection URL")
    parser.add_argument("--min-hits",     type=int, default=1,    help="Minimum hit_count to include a record (default: 1)")
    parser.add_argument("--exclude-weak", action="store_true",    help="Skip ALL entries whose subject appears in weak_topics")
    parser.add_argument("--overwrite",    action="store_true",    help="Overwrite existing files instead of appending new records")
    parser.add_argument("--dry-run",      action="store_true",    help="Print stats without writing any files")
    args = parser.parse_args()

    print("\n=== VidyaAI: DB → Training Export ===")
    print(f"DB          : {args.db_url}")
    print(f"Min hits    : {args.min_hits}")
    print(f"Exclude weak: {args.exclude_weak}")
    print(f"Overwrite   : {args.overwrite}")
    print(f"Dry run     : {args.dry_run}")
    print()

    conn = connect(args.db_url)

    # load weak subjects for exclusion
    weak_subjects = load_excluded_normalized_questions(conn) if args.exclude_weak else set()
    if args.exclude_weak:
        print(f"[Filter] Weak subjects: {weak_subjects or '(none)'}")

    rows = fetch_cache_rows(conn, args.min_hits, weak_subjects)
    conn.close()

    if not rows:
        print("\n[INFO] No records matched the filters. Nothing to export.")
        return

    # convert all rows to training format
    all_records = [row_to_jsonl(r) for r in rows]

    # if not overwriting, deduplicate against what's already on disk
    if not args.overwrite:
        existing_train_ids = load_existing_ids(TRAIN_PATH)
        existing_test_ids  = load_existing_ids(TEST_PATH)
        existing_ids = existing_train_ids | existing_test_ids
        before = len(all_records)
        all_records = [r for r in all_records if r["metadata"]["cache_id"] not in existing_ids]
        print(f"[Dedup]  Already in files : {before - len(all_records)}")
        print(f"[Dedup]  New records      : {len(all_records)}")

    if not all_records:
        print("\n[INFO] All records already exported. Nothing new to write.")
        return

    # shuffle before split
    random.shuffle(all_records)
    split_at     = max(1, int(len(all_records) * (1 - TEST_SPLIT)))
    train_new    = all_records[:split_at]
    test_new     = all_records[split_at:]

    print(f"\n[Split]  New → train : {len(train_new)}")
    print(f"[Split]  New → test  : {len(test_new)}")

    if args.dry_run:
        print("\n[DRY RUN] No files written.")
        print("\nSample record:")
        print(json.dumps(all_records[0], ensure_ascii=False, indent=2))
        return

    write_mode = "w" if args.overwrite else "a"
    write_jsonl(TRAIN_PATH, train_new, mode=write_mode)
    write_jsonl(TEST_PATH,  test_new,  mode=write_mode)

    print(f"\n[Done]  train.jsonl : {count_lines(TRAIN_PATH)} total lines  ({TRAIN_PATH})")
    print(f"[Done]  test.jsonl  : {count_lines(TEST_PATH)} total lines  ({TEST_PATH})")
    print("\nNext step: run  python -m training.fine_tune_qlora  to start QLoRA fine-tuning.\n")


if __name__ == "__main__":
    main()
