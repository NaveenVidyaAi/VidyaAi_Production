# VidyaAI Document Data

All knowledge documents are governed by `ingestion/document_catalog.json`. The
catalog version and each document version use semantic `MAJOR.MINOR.PATCH`
numbers, and every record is locked to a SHA-256 checksum.

## Directory layout

```text
data/
├── documents/
│   ├── curricula/              # Active curriculum, blueprint, and outcome sources
│   └── model_papers/           # Clean text sources used for retrieval
├── Previous_Year_Questions/    # Exact downloadable/student-practice paper files
├── textbooks/                  # Textbook sources (legacy filenames are cataloged)
└── archive/
    └── consolidated_pyq/       # Preserved, but excluded from retrieval
```

Model papers intentionally have two artifacts:

- `documents/model_papers/` contains the extraction-friendly knowledge source.
- `Previous_Year_Questions/` contains the original paper shown to students.

Their paths and separate checksums are tied together by one catalog record. The
public copy under `frontend/public/pyq/` is checksum locked as a delivery
artifact as well.

## Canonical filename

```text
cgbse-class-<class>-<subject>-<document-type>-<academic-year>-v<version>.pdf
```

Examples:

```text
cgbse-class-10-science-curriculum-2026-27-v1.0.0.pdf
cgbse-class-10-science-model-paper-2025-26-v1.0.0.pdf
cgbse-class-10-science-marking-scheme-2025-26-v1.0.0.pdf
```

Use lowercase ASCII slugs and hyphens. Put the human language inside the PDF,
not in its path. Existing PYQ/textbook filenames are cataloged as legacy v1.0.0
so current links remain stable.

## Version rules

- **PATCH** (`1.0.0` → `1.0.1`): OCR, punctuation, or metadata correction that
  does not change academic meaning.
- **MINOR** (`1.0.0` → `1.1.0`): added questions, outcomes, examples, or marking
  detail without changing the official session/scope.
- **MAJOR** (`1.0.0` → `2.0.0`): changed board pattern, syllabus scope,
  authority, or academic meaning.
- A new academic session belongs in a new filename/document ID.
- Never overwrite an existing managed PDF. Add the new file, mark the previous
  catalog record `superseded`, and make only the new record `active`.
- Never change a catalog checksum to hide an in-place edit. Catalog validation
  intentionally rejects that operation.

## Safe workflow

```bash
# 1. Validate paths, active-version uniqueness, and checksums
backend/.venv311/bin/python -m ingestion.document_catalog validate

# 2. Verify extraction and metadata without touching Qdrant
backend/.venv311/bin/python -m ingestion.ingest \
  --file ingestion/data/documents/curricula/<versioned-file>.pdf \
  --dry-run

# 3. Ingest active teacher resources
backend/.venv311/bin/python -m ingestion.ingest \
  --all-active \
  --document-type curriculum \
  --document-type model_question_paper

# 4. Remove vectors belonging to preserved-but-archived sources
backend/.venv311/bin/python -m ingestion.ingest --prune-archived
```

Qdrant payloads include `document_id`, `document_version`, `catalog_version`,
`document_type`, `academic_year`, `authority`, `source_sha256`, and
`is_active_version`. Re-ingestion deletes the older active vectors for the same
`document_id`, while old source PDFs and catalog history remain auditable.

Vector exports are versioned independently from source PDFs. A metadata or
chunking correction that leaves source documents unchanged increments the
dataset PATCH version and preserves the previous JSONL plus its manifest.

## Quality and authority

Use `CGBSE`/`SCERT Chhattisgarh` for official sources. Teacher-reviewed material
must be labeled `reviewed`, and coaching material must be `supplementary`; it
must not silently replace official evidence.

The current model papers do **not** contain answer keys or official marking
schemes. They are suitable for paper-pattern grounding and question generation,
but authoritative answer-copy evaluation additionally requires separately
versioned answer keys, step-wise marking schemes, and rubrics.

Reserved managed document types are `marking_scheme`, `answer_key`,
`learning_outcome`, `teacher_guide`, `assessment_blueprint`, and
`academic_calendar`. Place future versioned PDFs in the matching plural folder
under `documents/` and add their locked catalog records before ingestion.
