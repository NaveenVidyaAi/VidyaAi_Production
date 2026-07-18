import unittest

from ingestion.ingest import _metadata_from_filename, chunk_text_with_metadata, normalize_hindi_text


class IngestionChunkingTests(unittest.TestCase):
    def test_extracts_lesson_metadata_from_hindi_textbook_markers(self):
        text = normalize_hindi_text(
            """
            अनुक्रमणिका
            पाठ 1.2 : नमद ा का उद्गम : अमरकंटक (लेख)
            यह नर्मदा पाठ का मुख्य भाग है।

            पाठ - 1.3 बादल को घरत े देखा है नागाजनु जीवन परिचय
            यह कविता प्रकृति के सौंदर्य का वर्णन करती है।
            """
        )

        chunks = chunk_text_with_metadata(text, {"class": "10", "subject": "Hindi", "chapter": "", "topic": ""})
        lesson_chunks = [(chunk, meta) for chunk, meta in chunks if meta.get("chapter")]

        self.assertEqual(lesson_chunks[0][1]["chapter"], "1-2")
        self.assertIn("नर्मदा", lesson_chunks[0][1]["topic"])
        self.assertEqual(lesson_chunks[1][1]["chapter"], "1-3")
        self.assertIn("बादल", lesson_chunks[1][1]["topic"])

    def test_extracts_reading_metadata_from_english_textbook_markers(self):
        text = """
        Unit 1
        Inspiration
        Reading A : Patriotism
        Reading B : How The Little Kite Learned To Fly ?

        Reading A
        Patriotism
        Nanaji explained that patriotism can be reflected in simple day to day things.

        How The Little Kite
        Reading B
        Learned To Fly?
        I never can do it, the little kite said.
        """

        chunks = chunk_text_with_metadata(text, {"class": "10", "subject": "English", "chapter": "", "topic": ""})
        reading_chunks = [(chunk, meta) for chunk, meta in chunks if meta.get("content_type") == "reading"]

        self.assertEqual(reading_chunks[0][1]["chapter"], "1-A")
        self.assertEqual(reading_chunks[0][1]["topic"], "Patriotism")
        self.assertEqual(reading_chunks[-1][1]["chapter"], "1-B")
        self.assertIn("Little Kite", reading_chunks[-1][1]["topic"])

    def test_extracts_pyq_metadata_from_filename(self):
        metadata = _metadata_from_filename(
            "ingestion/data/Previous_Year_Questions/class_10_hindi_PYQ25_SET_B.pdf"
        )

        self.assertEqual(metadata["class"], "10")
        self.assertEqual(metadata["subject"], "Hindi")
        self.assertEqual(metadata["content_type"], "previous_year_question")
        self.assertEqual(metadata["year"], "2025")
        self.assertEqual(metadata["set"], "B")
        self.assertEqual(metadata["subtopic"], "Set B")

    def test_extracts_sanskrit_pyq_subject_from_filename(self):
        metadata = _metadata_from_filename(
            "ingestion/data/Previous_Year_Questions_For_Ingestion/class_10_sanskrit_pyq.pdf"
        )

        self.assertEqual(metadata["class"], "10")
        self.assertEqual(metadata["subject"], "Sanskrit")
        self.assertEqual(metadata["content_type"], "previous_year_question")

    def test_extracts_versioned_model_paper_metadata(self):
        metadata = _metadata_from_filename(
            "ingestion/data/documents/model_papers/cgbse-class-10-science-model-paper-2025-26-v1.0.0.pdf"
        )

        self.assertEqual(metadata["class"], "10")
        self.assertEqual(metadata["subject"], "Science")
        self.assertEqual(metadata["document_type"], "model_question_paper")
        self.assertEqual(metadata["content_type"], "model_question_paper")
        self.assertEqual(metadata["academic_year"], "2025-26")
        self.assertEqual(metadata["document_version"], "1.0.0")

    def test_extracts_versioned_curriculum_metadata(self):
        metadata = _metadata_from_filename(
            "ingestion/data/documents/curricula/cgbse-class-10-math-curriculum-2026-27-v1.0.0.pdf"
        )

        self.assertEqual(metadata["subject"], "Math")
        self.assertEqual(metadata["document_type"], "curriculum")
        self.assertEqual(metadata["academic_year"], "2026-27")



if __name__ == "__main__":
    unittest.main()
