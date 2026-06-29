import unittest

from ingestion.ingest import chunk_text_with_metadata, normalize_hindi_text


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


if __name__ == "__main__":
    unittest.main()
