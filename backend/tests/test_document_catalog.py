import hashlib
import json
import unittest
from pathlib import Path

from ingestion.document_catalog import (
    ROOT_DIR,
    active_ingestion_entries,
    catalog_entry_for_path,
    load_catalog,
    validate_catalog,
)


class DocumentCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog()

    def test_catalog_paths_versions_and_checksums_are_valid(self):
        self.assertEqual(validate_catalog(self.catalog), [])

    def test_only_one_active_version_exists_per_document(self):
        active_ids = [
            entry["document_id"]
            for entry in self.catalog["documents"]
            if entry["status"] == "active"
        ]
        self.assertEqual(len(active_ids), len(set(active_ids)))

    def test_model_paper_has_versioned_delivery_artifacts(self):
        path = ROOT_DIR / "ingestion/data/documents/model_papers/cgbse-class-10-science-model-paper-2025-26-v1.0.0.pdf"
        entry = catalog_entry_for_path(path, self.catalog)

        self.assertIsNotNone(entry)
        self.assertEqual(entry["document_type"], "model_question_paper")
        self.assertEqual(entry["version"], "1.0.0")
        self.assertTrue((ROOT_DIR / entry["public_path"]).is_file())
        self.assertTrue((ROOT_DIR / entry["display_source_path"]).is_file())

    def test_archived_low_quality_sources_are_not_ingested(self):
        ingestible_paths = {Path(entry["path"]) for entry in active_ingestion_entries(self.catalog)}
        self.assertFalse(any("archive" in path.parts for path in ingestible_paths))

    def test_latest_teacher_dataset_matches_its_version_manifest(self):
        export_path = ROOT_DIR / "ingestion/qdrant_exports/teacher_resources_catalog-v1.0.1.jsonl"
        manifest_path = ROOT_DIR / "ingestion/qdrant_exports/teacher_resources_catalog-v1.0.1.manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        checksum = hashlib.sha256(export_path.read_bytes()).hexdigest()

        self.assertEqual(manifest["dataset_version"], "1.0.1")
        self.assertEqual(manifest["sha256"], checksum)
        self.assertEqual(manifest["point_count"], 173)
        self.assertEqual(manifest["document_count"], 12)


if __name__ == "__main__":
    unittest.main()
