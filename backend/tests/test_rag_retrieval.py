import unittest
import asyncio

from backend.services import rag


class FakePoint:
    _next_id = 1

    def __init__(self, payload, text):
        self.payload = payload
        self.id = FakePoint._next_id
        FakePoint._next_id += 1
        self.payload["text"] = text


class FakeClient:
    def __init__(self, points):
        self._points = points

    def scroll(self, collection_name, with_payload=True, with_vectors=False, limit=500):
        return self._points, None


class RAGRetrievalTests(unittest.TestCase):
    def test_question_subject_overrides_selected_subject(self):
        self.assertEqual(
            rag._infer_subject("Hindi", "class 10 english chapter 2"),
            "English",
        )

    def test_english_chapter_request_shows_english_unit_options(self):
        options = rag.get_unit_options(
            subject="Hindi",
            question="class 10 english chapter 2",
            class_level="10",
        )

        self.assertEqual([option["section"] for option in options], ["2.1", "2.2", "2.3"])
        self.assertEqual(options[0]["subject"], "English")
        self.assertEqual(options[0]["chapter"], "2-A")
        self.assertIn("The Never-Never Nest", options[0]["title"])
        self.assertIn("class 10 english chapter 2-A", options[0]["prompt"])

    def test_hindi_options_are_skipped_for_english_question(self):
        options = rag.get_hindi_unit_options(
            subject="Hindi",
            question="class 10 english chapter 2",
            class_level="10",
        )

        self.assertEqual(options, [])

    def test_english_numeric_section_maps_to_reading_letter(self):
        self.assertEqual(
            rag._normalize_section_hint_for_subject("2-1", "English"),
            "2-A",
        )
        self.assertEqual(
            rag._normalize_section_hint_for_subject("3-1", "English"),
            "3-A",
        )

    def test_answer_style_formats_are_distinct(self):
        self.assertIn("2-mark", rag._answer_format_for_style("English", "two").lower())
        self.assertIn("5-mark", rag._answer_format_for_style("English", "five").lower())
        self.assertIn("q&a", rag._answer_format_for_style("English", "qa").lower())
        self.assertIn("सारांश", rag._answer_format_for_style("Hindi", "summary"))
        self.assertLess(rag._max_tokens_for_style("two"), rag._max_tokens_for_style("exam"))

    def test_two_mark_answer_is_coerced_to_compact_format(self):
        answer = rag._coerce_answer_to_style(
            "Answer as a 2-mark exam answer:\n\n1. First important point with context.\n\n2. Second important point.\n\n3. Extra point that should be removed.\n\nVocabulary: extra",
            "English",
            "two",
        )

        self.assertIn("2-Mark Answer", answer)
        self.assertIn("1. First important point", answer)
        self.assertIn("2. Second important point", answer)
        self.assertNotIn("Extra point", answer)

    def test_hindi_unit_options_for_plain_chapter_request(self):
        original_detector = rag._detect_hindi_unit_options
        rag._detect_hindi_unit_options = lambda unit: []
        try:
            options = rag.get_hindi_unit_options(
                subject="Hindi",
                question="class 10 hindi chapter 3",
                class_level="10",
            )
        finally:
            rag._detect_hindi_unit_options = original_detector

        self.assertEqual([option["section"] for option in options], ["3.1", "3.2", "3.3", "3.4"])
        self.assertEqual(options[0]["title"], "माटीवाली")

    def test_hindi_unit_options_skip_explicit_section(self):
        options = rag.get_hindi_unit_options(
            subject="Hindi",
            question="class 10 hindi chapter 3.2",
            class_level="10",
        )

        self.assertEqual(options, [])

    def test_bare_section_hint_is_available_for_hindi_context(self):
        self.assertEqual(rag._extract_section_hint("3.2", allow_bare=True), "3-2")
        self.assertIsNone(rag._extract_section_hint("3.2"))

    def test_bare_section_retrieves_exact_hindi_lesson(self):
        fake_client = FakeClient([
            FakePoint(
                {"subject": "Hindi", "class": "10", "chapter": "3-1", "topic": "माटीवाली"},
                "पाठ - 3.1 माटीवाली यह पाठ माटीवाली के जीवन पर आधारित है।",
            ),
            FakePoint(
                {"subject": "Hindi", "class": "10", "chapter": "3-2", "topic": "कन्यादान"},
                "पाठ - 3.2 कन्यादान यह कविता बेटी और मां के संबंध को दिखाती है।",
            ),
        ])
        original_client_factory = rag._get_qdrant_client
        original_mock = rag.embedding_service.use_mock
        rag._get_qdrant_client = lambda: fake_client
        rag.embedding_service.use_mock = True
        try:
            section_hint = rag._extract_section_hint("3.2", allow_bare=True)
            results = rag._retrieve_context(
                question="3.2",
                subject="Hindi",
                class_level="10",
                weak_topics=[],
                chapter_hint=None,
                section_hint=section_hint,
                limit=2,
            )
        finally:
            rag._get_qdrant_client = original_client_factory
            rag.embedding_service.use_mock = original_mock

        self.assertIn("कन्यादान", results[0][0])

    def test_retrieves_section_text_without_chapter_metadata(self):
        fake_client = FakeClient([
            FakePoint(
                {"subject": "Hindi", "class": "10", "chapter": "", "topic": ""},
                "पाठ - 1.3 बादल को घरते देखा है। यह कविता प्रकृति के सौंदर्य का वर्णन करती है।",
            )
        ])
        original_client_factory = rag._get_qdrant_client
        original_mock = rag.embedding_service.use_mock
        rag._get_qdrant_client = lambda: fake_client
        rag.embedding_service.use_mock = True
        try:
            results = rag._retrieve_context(
                question="कक्षा 10 हिंदी पाठ 1.3 बादल को घिरते देखा है की व्याख्या दो",
                subject="Hindi",
                class_level="10",
                weak_topics=[],
                chapter_hint="1",
                section_hint="1-3",
                limit=5,
            )
        finally:
            rag._get_qdrant_client = original_client_factory
            rag.embedding_service.use_mock = original_mock

        self.assertTrue(results, "Expected the chapter-related text to be retrieved")
        self.assertIn("बादल", results[0][0])

    def test_lesson_metadata_beats_unrelated_overlap(self):
        fake_client = FakeClient([
            FakePoint(
                {"subject": "Hindi", "class": "10", "chapter": "", "topic": ""},
                "बादलों का रूप अमरकंटक में देखा गया। यह नर्मदा पाठ का अंश है।",
            ),
            FakePoint(
                {"subject": "Hindi", "class": "10", "chapter": "1-3", "topic": "बादल को घिरते देखा है"},
                "पाठ - 1.3 बादल को घिरते देखा है नागार्जुन जीवन परिचय।",
            ),
        ])
        original_client_factory = rag._get_qdrant_client
        original_mock = rag.embedding_service.use_mock
        rag._get_qdrant_client = lambda: fake_client
        rag.embedding_service.use_mock = True
        try:
            results = rag._retrieve_context(
                question="बादल को घिरते देखा है कविता के लेखक कौन हैं",
                subject="Hindi",
                class_level="10",
                weak_topics=[],
                chapter_hint=None,
                section_hint=None,
                limit=2,
            )
        finally:
            rag._get_qdrant_client = original_client_factory
            rag.embedding_service.use_mock = original_mock

        self.assertIn("नागार्जुन", results[0][0])

    def test_science_chapter_hint_does_not_match_nested_section_number(self):
        fake_client = FakeClient([
            FakePoint(
                {"subject": "Science", "class": "10", "chapter": "", "topic": ""},
                "45.2.5 मेण्डल के नियम में प्रभावी और अप्रभावी लक्षणों की चर्चा की गई है।",
            ),
            FakePoint(
                {"subject": "Science", "class": "10", "chapter": "", "topic": ""},
                "चित्र 2-39 पोटैशियम परमेंगनेट से ऑक्सीजन गैस बनाने की विधि दिखाता है।",
            ),
            FakePoint(
                {"subject": "Science", "class": "10", "chapter": "", "topic": ""},
                "2.5 अम्ल व क्षार के विलयन कितने प्रबल? pH मान और सूचक से अम्लीय तथा क्षारीय विलयन पहचाने जाते हैं।",
            ),
        ])
        original_client_factory = rag._get_qdrant_client
        original_mock = rag.embedding_service.use_mock
        rag._get_qdrant_client = lambda: fake_client
        rag.embedding_service.use_mock = True
        try:
            results = rag._retrieve_context(
                question="class 10 science chapter 2",
                subject="Science",
                class_level="10",
                weak_topics=[],
                chapter_hint="2",
                section_hint=None,
                limit=3,
            )
        finally:
            rag._get_qdrant_client = original_client_factory
            rag.embedding_service.use_mock = original_mock

        self.assertIn("अम्ल", results[0][0])
        self.assertNotIn("मेण्डल", results[0][0])

    def test_science_chapter_2_answer_guard_blocks_mendel_response(self):
        class Student:
            class_level = "10"

        original_retrieve = rag._retrieve_context
        original_answer = rag._groq_answer
        try:
            rag._retrieve_context = lambda **kwargs: [
                (
                    "2.5 अम्ल व क्षार के विलयन कितने प्रबल? pH मान और सूचक से अम्लीय तथा क्षारीय विलयन पहचाने जाते हैं।",
                    "science-chapter-2",
                    13.5,
                    "Science | class_10_science_vigyan.pdf",
                )
            ]
            rag._groq_answer = lambda *args, **kwargs: ("मेंडल का नियम प्रभावी और अप्रभावी लक्षणों को समझाता है।", "groq")

            answer, sources, answer_source = asyncio.run(
                rag.run_rag(
                    Student(),
                    "Science",
                    "class 10 science chapter 2",
                    [],
                )
            )
        finally:
            rag._retrieve_context = original_retrieve
            rag._groq_answer = original_answer

        self.assertIn("अम्ल", answer)
        self.assertNotIn("मेंडल", answer)
        self.assertEqual(answer_source, "fallback-topic-guard")

    def test_science_chapter_2_answer_guard_blocks_hydrogen_drift(self):
        class Student:
            class_level = "10"

        original_retrieve = rag._retrieve_context
        original_answer = rag._groq_answer
        try:
            rag._retrieve_context = lambda **kwargs: [
                (
                    "2.5 अम्ल व क्षार के विलयन कितने प्रबल? pH मान और सूचक से अम्लीय तथा क्षारीय विलयन पहचाने जाते हैं।",
                    "science-chapter-2",
                    13.5,
                    "Science | class_10_science_vigyan.pdf",
                )
            ]
            rag._groq_answer = lambda *args, **kwargs: ("हाइड्रोजन के रासायनिक गुण में यह धातुओं से अभिक्रिया करती है।", "groq")

            answer, sources, answer_source = asyncio.run(
                rag.run_rag(
                    Student(),
                    "Science",
                    "class 10 science chapter 2",
                    [],
                )
            )
        finally:
            rag._retrieve_context = original_retrieve
            rag._groq_answer = original_answer

        self.assertIn("अम्ल", answer)
        self.assertIn("क्षार", answer)
        self.assertIn("लवण", answer)
        self.assertNotIn("हाइड्रोजन के रासायनिक गुण", answer)
        self.assertEqual(answer_source, "fallback-topic-guard")


if __name__ == "__main__":
    unittest.main()
