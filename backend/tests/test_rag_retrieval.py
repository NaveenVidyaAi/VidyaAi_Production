import unittest
import asyncio

from backend.services import rag
from backend.routers import chat


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


class FakePyqClient:
    def __init__(self, points):
        self._points = points
        self.filter = None

    def scroll(self, collection_name, scroll_filter, with_payload=True, with_vectors=False, limit=8):
        self.filter = scroll_filter
        return self._points, None


class RAGRetrievalTests(unittest.TestCase):
    def test_question_subject_overrides_selected_subject(self):
        self.assertEqual(
            rag._infer_subject("Hindi", "class 10 english chapter 2"),
            "English",
        )

    def test_pyq_retrieval_uses_exact_source_file_and_subject(self):
        matching = FakePoint(
            {"subject": "Hindi", "content_type": "previous_year_question", "source_file": "class_10_hindi_PYQ25_SET_B.pdf"},
            "प्रश्न 8. लड़कों को दान देते समय माँ को अंतिम पूँजी देने जैसा दुःख क्यों हो रहा है?",
        )
        wrong_subject = FakePoint(
            {"subject": "Science", "content_type": "previous_year_question", "source_file": "class_10_hindi_PYQ25_SET_B.pdf"},
            "This must not enter Hindi practice even if its filename metadata is wrong.",
        )
        client = FakePyqClient([matching, wrong_subject])
        original_client = rag._get_qdrant_client
        try:
            rag._get_qdrant_client = lambda: client
            text, sources = rag.retrieve_pyq_paper_text("Hindi", "class_10_hindi_PYQ25_SET_B.pdf")
        finally:
            rag._get_qdrant_client = original_client

        self.assertIn("प्रश्न 8", text)
        self.assertNotIn("must not enter", text)
        self.assertTrue(sources)
        self.assertIsNotNone(client.filter)

    def test_exact_paper_retrieval_accepts_versioned_model_paper(self):
        source_file = "cgbse-class-10-science-model-paper-2025-26-v1.0.0.pdf"
        model_point = FakePoint(
            {
                "subject": "Science",
                "document_type": "model_question_paper",
                "source_file": source_file,
                "document_version": "1.0.0",
            },
            "Model question: Explain the reaction of acids with metals using a balanced equation.",
        )
        client = FakePyqClient([model_point])
        original_client = rag._get_qdrant_client
        try:
            rag._get_qdrant_client = lambda: client
            text, sources = rag.retrieve_pyq_paper_text("Science", source_file)
        finally:
            rag._get_qdrant_client = original_client

        self.assertIn("Model question", text)
        self.assertTrue(any("v1.0.0" in source for source in sources))

    def test_teacher_document_type_boost_prioritizes_model_papers(self):
        fake_client = FakeClient([
            FakePoint(
                {"subject": "Science", "class": "10", "document_type": "textbook"},
                "Class 10 Science acids bases important questions and examples.",
            ),
            FakePoint(
                {"subject": "Science", "class": "10", "document_type": "model_question_paper"},
                "Class 10 Science acids bases important questions and examples.",
            ),
        ])
        original_client_factory = rag._get_qdrant_client
        original_mock = rag.embedding_service.use_mock
        rag._get_qdrant_client = lambda: fake_client
        rag.embedding_service.use_mock = True
        try:
            results = rag._retrieve_context(
                question="Class 10 Science acids bases important questions",
                subject="Science",
                class_level="10",
                weak_topics=[],
                chapter_hint=None,
                section_hint=None,
                limit=2,
                document_type_boosts={"model_question_paper": 8.0, "textbook": 1.0},
            )
        finally:
            rag._get_qdrant_client = original_client_factory
            rag.embedding_service.use_mock = original_mock

        self.assertIn("Model Question Paper", results[0][3])

    def test_legacy_textbook_content_types_use_textbook_document_type(self):
        for content_type in ("theory", "example", "question"):
            with self.subTest(content_type=content_type):
                self.assertEqual(
                    rag._payload_document_type({"content_type": content_type}),
                    "textbook",
                )

        self.assertEqual(
            rag._payload_document_type(
                {"document_type": "curriculum", "content_type": "theory"}
            ),
            "curriculum",
        )
        self.assertEqual(
            rag._payload_document_type({"content_type": "reading"}),
            "reading",
        )
        self.assertEqual(
            rag._format_source_label(
                {"subject": "English", "content_type": "reading"},
                "legacy-reading",
            ),
            "English",
        )

    def test_teacher_textbook_boost_includes_legacy_theory_chunks(self):
        fake_client = FakeClient([
            FakePoint(
                {"subject": "Science", "class": "10", "content_type": "theory"},
                "Class 10 Science acids bases important concepts and examples.",
            ),
            FakePoint(
                {"subject": "Science", "class": "10", "document_type": "curriculum"},
                "Class 10 Science acids bases important concepts and examples.",
            ),
        ])
        original_client_factory = rag._get_qdrant_client
        original_mock = rag.embedding_service.use_mock
        rag._get_qdrant_client = lambda: fake_client
        rag.embedding_service.use_mock = True
        try:
            results = rag._retrieve_context(
                question="Class 10 Science acids bases important concepts",
                subject="Science",
                class_level="10",
                weak_topics=[],
                chapter_hint=None,
                section_hint=None,
                limit=2,
                document_type_boosts={"textbook": 6.0, "curriculum": 0.0},
            )
        finally:
            rag._get_qdrant_client = original_client_factory
            rag.embedding_service.use_mock = original_mock

        self.assertIn("Textbook", results[0][3])

    def test_teacher_strict_subject_excludes_other_subject_model_papers(self):
        fake_client = FakeClient([
            FakePoint(
                {"subject": "Science", "class": "10", "document_type": "model_question_paper"},
                "Class 10 model paper important questions and blueprint.",
            ),
            FakePoint(
                {"subject": "Hindi", "class": "10", "document_type": "curriculum"},
                "Class 10 Hindi model paper important questions and blueprint.",
            ),
        ])
        original_client_factory = rag._get_qdrant_client
        original_mock = rag.embedding_service.use_mock
        rag._get_qdrant_client = lambda: fake_client
        rag.embedding_service.use_mock = True
        try:
            results = rag._retrieve_context(
                question="Class 10 Hindi model paper important questions",
                subject="Hindi",
                class_level="10",
                weak_topics=[],
                chapter_hint=None,
                section_hint=None,
                limit=4,
                document_type_boosts={"model_question_paper": 20.0, "curriculum": 1.0},
                strict_subject=True,
            )
        finally:
            rag._get_qdrant_client = original_client_factory
            rag.embedding_service.use_mock = original_mock

        self.assertEqual(len(results), 1)
        self.assertIn("Hindi", results[0][3])

    def test_hinglish_subject_terms_override_selected_subject(self):
        cases = {
            "ganit ka quadratic equation solve karo": "Math",
            "vigyan me acid base kya hota hai": "Science",
            "itihas me gandhiji ka role samjhao": "Social Science",
            "english grammar me tense samjhao": "English",
            "sanskrit ka shlok arth batao": "Sanskrit",
        }
        for prompt, expected in cases.items():
            with self.subTest(prompt=prompt):
                self.assertEqual(rag._infer_subject("Hindi", prompt), expected)

    def test_roman_hindi_is_detected_as_hindi_answer_language(self):
        for prompt in ("ganit ka answer nikalo", "mujhe science samjao", "solve karo please"):
            with self.subTest(prompt=prompt):
                self.assertEqual(rag._detect_prompt_language(prompt), "hindi")

    def test_math_problem_prompt_overrides_selected_subject(self):
        self.assertEqual(
            rag._infer_subject("Hindi", "Solve 2x + 3 = 11 and 5x - 4 = 16"),
            "Math",
        )
        self.assertEqual(
            rag._infer_subject("Hindi", "इन 2 प्रश्नों को हल करो: 2x + 3 = 11, 5x - 4 = 16"),
            "Math",
        )
        self.assertEqual(rag._infer_subject("Hindi", "2-3"), "Math")

    def test_math_prompt_does_not_trigger_hindi_unit_options(self):
        options = rag.get_unit_options(
            subject="Hindi",
            question="Solve 2-3 maths questions: 2x + 3 = 11 and 5x - 4 = 16",
            class_level="10",
        )

        self.assertEqual(options, [])

    def test_bare_arithmetic_does_not_trigger_hindi_unit_options(self):
        options = rag.get_unit_options(
            subject="Hindi",
            question="2-3",
            class_level="10",
        )

        self.assertEqual(options, [])

    def test_bare_arithmetic_returns_direct_answer(self):
        class Student:
            class_level = "10"

        original_retrieve = rag._retrieve_context
        original_answer = rag._groq_answer
        calls = {"retrieved": False, "llm": False}

        def fake_retrieve(**kwargs):
            calls["retrieved"] = True
            return []

        def fake_answer(*args, **kwargs):
            calls["llm"] = True
            return ("wrong", "groq")

        try:
            rag._retrieve_context = fake_retrieve
            rag._groq_answer = fake_answer
            answer, sources, answer_source = asyncio.run(
                rag.run_rag(Student(), "Hindi", "2-3", [])
            )
        finally:
            rag._retrieve_context = original_retrieve
            rag._groq_answer = original_answer

        self.assertEqual(answer, "-1")
        self.assertEqual(sources, [])
        self.assertEqual(answer_source, "math-direct")
        self.assertFalse(calls["retrieved"])
        self.assertFalse(calls["llm"])

    def test_trailing_equals_arithmetic_returns_only_result(self):
        class Student:
            class_level = "10"

        original_retrieve = rag._retrieve_context
        original_answer = rag._groq_answer
        calls = {"retrieved": False, "llm": False}

        def fake_retrieve(**kwargs):
            calls["retrieved"] = True
            return []

        def fake_answer(*args, **kwargs):
            calls["llm"] = True
            return ("wrong", "groq")

        try:
            rag._retrieve_context = fake_retrieve
            rag._groq_answer = fake_answer
            answer, sources, answer_source = asyncio.run(
                rag.run_rag(Student(), "Hindi", "5+4+9=", [])
            )
        finally:
            rag._retrieve_context = original_retrieve
            rag._groq_answer = original_answer

        self.assertEqual(answer, "18")
        self.assertEqual(sources, [])
        self.assertEqual(answer_source, "math-direct")
        self.assertFalse(calls["retrieved"])
        self.assertFalse(calls["llm"])

    def test_prompt_intent_router_separates_direct_and_rag_tasks(self):
        cases = {
            "5 + 4 + 9 =": "simple_arithmetic",
            "Solve 2x + 3 = 11": "math_problem",
            "Create a pie chart: Maths 80, Science 70": "visual_data",
            "Write an application to the principal": "writing_task",
            "Create a seven-day study plan": "study_plan",
            "Class 10 Science chapter 2 explain": "curriculum",
            "What is the capital of India?": "general",
        }
        for prompt, expected in cases.items():
            with self.subTest(prompt=prompt):
                self.assertEqual(rag._classify_prompt_intent("Hindi", prompt), expected)

    def test_general_question_skips_retrieval_and_uses_ai_directly(self):
        class Student:
            class_level = "10"

        original_retrieve = rag._retrieve_context
        original_answer = rag._groq_answer
        calls = {"retrieved": False, "contexts": None, "subject": None}

        def fake_retrieve(**kwargs):
            calls["retrieved"] = True
            return []

        def fake_answer(question, context_blocks, subject, class_level, answer_style="exam", recent_history=None):
            calls["contexts"] = context_blocks
            calls["subject"] = subject
            return ("New Delhi.", "groq")

        try:
            rag._retrieve_context = fake_retrieve
            rag._groq_answer = fake_answer
            answer, sources, answer_source = asyncio.run(
                rag.run_rag(Student(), "Hindi", "What is the capital of India?", [])
            )
        finally:
            rag._retrieve_context = original_retrieve
            rag._groq_answer = original_answer

        self.assertFalse(calls["retrieved"])
        self.assertEqual(calls["contexts"], [])
        self.assertEqual(calls["subject"], "General")
        self.assertEqual(answer, "New Delhi.")
        self.assertEqual(sources, [])
        self.assertEqual(answer_source, "groq")

    def test_weak_curriculum_retrieval_uses_guarded_rewrite_then_retries(self):
        class Student:
            class_level = "10"

        original_retrieve = rag._retrieve_context
        original_rewrite = rag._rewrite_query_for_retrieval
        original_answer = rag._groq_answer
        retrieval_queries = []
        captured = {}

        def fake_retrieve(**kwargs):
            retrieval_queries.append(kwargs["question"])
            if "Acids Bases and Salts" in kwargs["question"]:
                return [
                    (
                        "Acids react with bases to form salt and water. The pH scale measures acidity and basicity.",
                        "science-acids",
                        12.0,
                        "Science | Chapter: 2 | Acids Bases and Salts",
                    )
                ]
            return []

        def fake_answer(question, context_blocks, subject, class_level, answer_style="exam", recent_history=None):
            captured["contexts"] = context_blocks
            captured["subject"] = subject
            return ("Acids and bases explained.", "groq")

        try:
            rag._retrieve_context = fake_retrieve
            rag._rewrite_query_for_retrieval = lambda *args: (
                "Class 10 Science Acids Bases and Salts properties and pH",
                "Science",
            )
            rag._groq_answer = fake_answer
            answer, sources, answer_source = asyncio.run(
                rag.run_rag(Student(), "Hindi", "aml chhar samjhao", [])
            )
        finally:
            rag._retrieve_context = original_retrieve
            rag._rewrite_query_for_retrieval = original_rewrite
            rag._groq_answer = original_answer

        self.assertEqual(len(retrieval_queries), 2)
        self.assertEqual(captured["subject"], "Science")
        self.assertTrue(captured["contexts"])
        self.assertIn("Acids react with bases", captured["contexts"][0])
        self.assertTrue(sources)
        self.assertEqual(answer_source, "groq")
        self.assertIn("Acids", answer)

    def test_science_chapter_concept_uses_ai_fallback_when_retrieval_is_weak(self):
        class Student:
            class_level = "10"

        original_retrieve = rag._retrieve_context
        original_rewrite = rag._rewrite_query_for_retrieval
        original_answer = rag._groq_answer
        captured = {}

        def fake_answer(question, context_blocks, subject, class_level, answer_style="exam", recent_history=None):
            captured["question"] = question
            captured["contexts"] = context_blocks
            captured["subject"] = subject
            return (
                "| गुण | धातु | अधातु |\n"
                "| --- | --- | --- |\n"
                "| चमक | सामान्यतः चमकीले | सामान्यतः बिना चमक के |",
                "groq",
            )

        try:
            rag._retrieve_context = lambda **kwargs: []
            rag._rewrite_query_for_retrieval = lambda *args: None
            rag._groq_answer = fake_answer
            answer, sources, answer_source = asyncio.run(
                rag.run_rag(
                    Student(),
                    "Hindi",
                    "Class 10 Science Chapter 3 me dhatu aur adhatu ke physical properties ka comparison table banao",
                    [],
                )
            )
        finally:
            rag._retrieve_context = original_retrieve
            rag._rewrite_query_for_retrieval = original_rewrite
            rag._groq_answer = original_answer

        self.assertEqual(captured["subject"], "Science")
        self.assertEqual(captured["contexts"], [])
        self.assertIn("| गुण | धातु | अधातु |", answer)
        self.assertEqual(sources, [])
        self.assertEqual(answer_source, "groq")

    def test_language_chapter_still_requires_textbook_context(self):
        self.assertTrue(
            rag._requires_strict_textbook_grounding(
                "English",
                "Class 10 English Chapter 1-C A Great Moment For All Those Children",
            )
        )
        self.assertFalse(
            rag._requires_strict_textbook_grounding(
                "Science",
                "Class 10 Science Chapter 3 metals and non-metals",
            )
        )

    def test_query_rewriter_understands_hinglish_without_answering(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post
        captured_payload = {}

        class FakeResponse:
            status_code = 200

            def json(self):
                return {
                    "choices": [{
                        "message": {
                            "content": '{"query":"Class 10 Science Acids Bases and Salts explanation","subject":"Science"}'
                        }
                    }]
                }

        def fake_post(url, headers, json, timeout):
            captured_payload.update(json)
            return FakeResponse()

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = fake_post
        try:
            rewritten = rag._rewrite_query_for_retrieval(
                "aml chhar samjhao",
                "Hindi",
                "10",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        self.assertEqual(
            rewritten,
            ("Class 10 Science Acids Bases and Salts explanation", "Science"),
        )
        system_prompt = captured_payload["messages"][0]["content"]
        self.assertIn("Do not answer", system_prompt)
        self.assertIn("Return strict JSON only", system_prompt)

    def test_query_rewriter_rejects_subject_change(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post

        class FakeResponse:
            status_code = 200

            def json(self):
                return {
                    "choices": [{
                        "message": {
                            "content": '{"query":"Class 10 Science chapter 1","subject":"Science"}'
                        }
                    }]
                }

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = lambda *args, **kwargs: FakeResponse()
        try:
            rewritten = rag._rewrite_query_for_retrieval(
                "Class 10 English chapter 1",
                "Hindi",
                "10",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        self.assertIsNone(rewritten)

    def test_math_problem_bypasses_retrieval_context(self):
        class Student:
            class_level = "10"

        original_retrieve = rag._retrieve_context
        original_answer = rag._groq_answer
        calls = {"retrieved": False, "subject": None, "contexts": None}

        def fake_retrieve(**kwargs):
            calls["retrieved"] = True
            return [
                (
                    "पाठ 3.2 कन्यादान मां और बेटी के संबंध पर आधारित है।",
                    "hindi-lesson",
                    20.0,
                    "Hindi | Chapter: 3.2",
                )
            ]

        def fake_answer(question, context_blocks, subject, class_level, answer_style="exam", recent_history=None):
            calls["subject"] = subject
            calls["contexts"] = context_blocks
            return ("1. x = 4\n2. x = 4", "groq")

        try:
            rag._retrieve_context = fake_retrieve
            rag._groq_answer = fake_answer
            answer, sources, answer_source = asyncio.run(
                rag.run_rag(
                    Student(),
                    "Hindi",
                    "Solve 2 questions: 2x + 3 = 11 and 5x - 4 = 16",
                    [],
                )
            )
        finally:
            rag._retrieve_context = original_retrieve
            rag._groq_answer = original_answer

        self.assertFalse(calls["retrieved"])
        self.assertEqual(calls["subject"], "Math")
        self.assertEqual(calls["contexts"], [])
        self.assertEqual(sources, [])
        self.assertEqual(answer_source, "groq")
        self.assertIn("x = 4", answer)

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

    def test_english_reading_code_is_not_misclassified_as_math(self):
        question = "class 10 english chapter 1-C A Great Moment For All Those Children"

        self.assertEqual(rag._infer_subject("Hindi", question), "English")

    def test_answer_style_formats_are_distinct(self):
        self.assertIn("2-mark", rag._answer_format_for_style("English", "two").lower())
        self.assertIn("5-mark", rag._answer_format_for_style("English", "five").lower())
        self.assertIn("question 6", rag._answer_format_for_style("English", "qa").lower())
        self.assertIn("सारांश", rag._answer_format_for_style("Hindi", "summary"))
        self.assertLess(rag._max_tokens_for_style("two"), rag._max_tokens_for_style("exam"))

    def test_five_mark_style_requires_grounded_connected_answer(self):
        answer_format = rag._answer_format_for_style("English", "five")

        self.assertIn("120-170 word", answer_format)
        self.assertIn("connected paragraphs", answer_format)
        self.assertIn("specific details found in the textbook context", answer_format)
        self.assertIn("do not use a numbered template", answer_format.lower())

    def test_visual_request_types_are_detected(self):
        cases = {
            "Show this as a table": "table",
            "Create a Venn diagram": "venn",
            "Create a pie chart": "pie",
            "Prepare a bar graph": "bar",
            "Explain this with a flowchart diagram": "mermaid",
        }
        for prompt, expected in cases.items():
            with self.subTest(prompt=prompt):
                self.assertEqual(rag._requested_visual_type(prompt), expected)

    def test_markdown_table_requires_header_separator(self):
        valid = "| Day | Subject |\n| --- | --- |\n| Monday | Maths |"
        invalid = "Day | Subject\nMonday | Maths"

        self.assertTrue(rag._contains_requested_visual(valid, "table"))
        self.assertFalse(rag._contains_requested_visual(invalid, "table"))

    def test_two_mark_answer_is_coerced_to_compact_format(self):
        answer = rag._coerce_answer_to_style(
            "Answer as a 2-mark exam answer:\n\n1. First important point with context.\n\n2. Second important point.\n\n3. Extra point that should be removed.\n\nVocabulary: extra",
            "English",
            "two",
        )

        self.assertNotIn("2-Mark Answer", answer)
        self.assertIn("First important point", answer)
        self.assertIn("Second important point", answer)
        self.assertNotIn("1.", answer)
        self.assertNotIn("2.", answer)
        self.assertNotIn("Extra point", answer)

    def test_loose_numbers_are_removed_from_five_mark_paragraphs(self):
        answer = rag._coerce_answer_to_style(
            "**A Lesson**\n\n2. The opening paragraph explains the real event.\n\n3. The next paragraph develops its message.\n\n4. The lesson ends with hope.",
            "English",
            "five",
        )

        self.assertNotRegex(answer, r"(?m)^\s*[234][.)]")
        self.assertIn("The opening paragraph", answer)

    def test_followup_reference_is_contextualized_with_previous_chapter(self):
        history = [
            {
                "question": "class 10 hindi chapter 3.2 कन्यादान",
                "answer": "कन्यादान कविता मां और बेटी के संबंध पर आधारित है।",
                "subject": "Hindi",
            }
        ]

        question = chat._contextualize_followup_question(
            "give me 5 question and answers of this chapter",
            history,
        )

        self.assertIn("class 10 hindi chapter 3.2 कन्यादान", question)
        self.assertIn("Follow-up request", question)

    def test_reported_hinglish_prompts_resolve_or_request_clarification(self):
        english_history = [{"question": "Lesson 1 ko bataiye English ka", "answer": "Choose a reading.", "subject": "English"}]

        self.assertIn(
            "नाम या chapter/reading number",
            chat._clarification_for_prompt("Class 10 English poem का summary और theme बताइए", "English", []),
        )
        self.assertEqual(rag._extract_chapter_number("Lesson 1 ko bataiye English ka"), "1")
        self.assertEqual(rag._extract_chapter_number("Adhyay pahla ko bataiye"), "1")
        self.assertEqual(chat._subject_for_contextual_followup("Adhyay pahla ko bataiye", "General", english_history), "English")
        self.assertEqual(len(rag.get_unit_options("English", "Adhyay pahla ko bataiye", "10")), 3)
        self.assertIn("कौन-सा विषय", chat._clarification_for_prompt("Maths ka", "Math", english_history))
        self.assertEqual(rag._infer_subject("General", "Bahupad"), "Math")

    def test_hinglish_application_request_uses_hindi_school_format(self):
        requested = rag._requested_format_for_question("application likho principle ko", "General")

        self.assertIsNotNone(requested)
        self.assertIn("Hindi school format", requested)
        self.assertIn("सेवा में", requested)

    def test_prompt_language_detection_handles_english_hindi_and_hinglish(self):
        self.assertEqual(rag._detect_prompt_language("Explain photosynthesis"), "english")
        self.assertEqual(rag._detect_prompt_language("प्रकाश संश्लेषण समझाइए"), "hindi")
        self.assertEqual(rag._detect_prompt_language("photosynthesis kya hai"), "hindi")
        self.assertTrue(rag._is_english_prompt("Explain photosynthesis"))
        self.assertFalse(rag._is_english_prompt("photosynthesis kya hai"))

    def test_definition_request_gets_definition_format(self):
        requested = rag._requested_format_for_question("प्रकाश संश्लेषण किसे कहते हैं", "Science")

        self.assertIsNotNone(requested)
        self.assertIn("proper exam definition", requested)
        self.assertIn("2-4 lines", requested)

    def test_recent_history_keeps_last_two_student_questions(self):
        original_sessions = chat.in_memory_store["sessions"]
        chat.in_memory_store["sessions"] = [
            {"id": 1, "student_id": "s1", "question": "Q1", "answer": "A1", "subject": "Maths"},
            {"id": 2, "student_id": "s2", "question": "Other", "answer": "Other answer", "subject": "Hindi"},
            {"id": 3, "student_id": "s1", "question": "Q2", "answer": "A2", "subject": "Maths"},
            {"id": 4, "student_id": "s1", "question": "Q3", "answer": "A3", "subject": "Maths"},
        ]
        try:
            history = chat._recent_student_history("s1")
        finally:
            chat.in_memory_store["sessions"] = original_sessions

        self.assertEqual([item["question"] for item in history], ["Q2", "Q3"])

    def test_exact_repeat_question_is_removed_from_followup_history(self):
        original_sessions = chat.in_memory_store["sessions"]
        chat.in_memory_store["sessions"] = [
            {"id": 1, "student_id": "s1", "question": "class 10 hindi chapter 3.1 माटीवाली", "answer": "First answer", "subject": "Hindi"},
            {"id": 2, "student_id": "s1", "question": "कन्यादान समझाओ", "answer": "Second answer", "subject": "Hindi"},
            {"id": 3, "student_id": "s1", "question": " class 10 hindi chapter 3.1 माटीवाली ", "answer": "Repeated answer", "subject": "Hindi"},
        ]
        try:
            history = chat._history_for_question("s1", "class 10 hindi chapter 3.1 माटीवाली")
        finally:
            chat.in_memory_store["sessions"] = original_sessions

        self.assertEqual([item["question"] for item in history], ["कन्यादान समझाओ"])

    def test_groq_prompt_prioritizes_student_format_and_recent_history(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post
        captured_payload = {}

        class FakeResponse:
            status_code = 200

            def json(self):
                return {"choices": [{"message": {"content": "Step 1: solve carefully."}}]}

        def fake_post(url, headers, json, timeout):
            captured_payload.update(json)
            return FakeResponse()

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = fake_post
        try:
            answer, source = rag._groq_answer(
                question="Solve this step by step",
                context_blocks=["linear equation context"],
                subject="Maths",
                class_level="10",
                answer_style="two",
                recent_history=[{"question": "What is x?", "answer": "x is unknown."}],
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        prompt_text = "\n".join(message["content"] for message in captured_payload["messages"])
        self.assertEqual(source, "groq")
        self.assertIn("student's requested format or wording has priority", prompt_text)
        self.assertIn("Recent conversation context", prompt_text)
        self.assertIn("Previous Q1: What is x?", prompt_text)
        self.assertIn("for maths questions, solve carefully", prompt_text.lower())
        self.assertIn("2-3 maths questions together", prompt_text.lower())
        self.assertIn("Step 1", answer)

    def test_groq_prompt_uses_english_exam_format_for_english_question(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post
        captured_payload = {}

        class FakeResponse:
            status_code = 200

            def json(self):
                return {"choices": [{"message": {"content": "Photosynthesis is the process by which green plants prepare food."}}]}

        def fake_post(url, headers, json, timeout):
            captured_payload.update(json)
            return FakeResponse()

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = fake_post
        try:
            answer, source = rag._groq_answer(
                question="Explain photosynthesis",
                context_blocks=[],
                subject="Science",
                class_level="10",
                answer_style="exam",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        prompt_text = "\n".join(message["content"] for message in captured_payload["messages"])
        self.assertEqual(source, "groq")
        self.assertIn("Answer in clear English", prompt_text)
        self.assertIn("one connected paragraph of 2-3 sentences", prompt_text)
        self.assertIn("do not number headings or ordinary paragraphs", prompt_text)
        self.assertIn("board-exam-ready", prompt_text)
        self.assertIn("ask the student to write a clearer prompt", prompt_text)
        self.assertIn("GitHub-flavored Markdown table", prompt_text)
        self.assertIn("valid fenced Mermaid block", prompt_text)
        self.assertIn("fenced `venn` block", prompt_text)
        self.assertIn("A visual must supplement, not replace", prompt_text)
        self.assertIn("Photosynthesis", answer)

    def test_groq_general_question_uses_direct_format(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post
        captured_payload = {}

        class FakeResponse:
            status_code = 200

            def json(self):
                return {"choices": [{"message": {"content": "New Delhi."}}]}

        def fake_post(url, headers, json, timeout):
            captured_payload.update(json)
            return FakeResponse()

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = fake_post
        try:
            answer, source = rag._groq_answer(
                question="What is the capital of India?",
                context_blocks=[],
                subject="Hindi",
                class_level="10",
                answer_style="exam",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        prompt_text = "\n".join(message["content"] for message in captured_payload["messages"])
        self.assertEqual(source, "groq")
        self.assertEqual(answer, "New Delhi.")
        self.assertIn("Answer the question directly in 1-4 sentences", prompt_text)
        self.assertNotIn("**Exam Questions**", prompt_text)

    def test_requested_pie_chart_uses_exact_prompt_values(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post
        calls = []

        class FakeResponse:
            status_code = 200

            def __init__(self, content):
                self.content = content

            def json(self):
                return {"choices": [{"message": {"content": self.content}}]}

        def fake_post(url, headers, json, timeout):
            calls.append(json)
            return FakeResponse("Maths and Science receive the most study time.")

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = fake_post
        try:
            answer, source = rag._groq_answer(
                question="Create a pie chart: Maths 90 minutes, Science 90 minutes",
                context_blocks=[],
                subject="Math",
                class_level="10",
                answer_style="exam",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        self.assertEqual(source, "groq")
        self.assertEqual(len(calls), 1)
        self.assertIn("```mermaid", answer)
        self.assertIn("pie showData", answer)
        self.assertIn('"Maths" : 90', answer)
        self.assertIn('"Science" : 90', answer)
        self.assertIn("**Visual**", answer)

    def test_missing_requested_flowchart_is_repaired(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post
        calls = []

        class FakeResponse:
            status_code = 200

            def __init__(self, content):
                self.content = content

            def json(self):
                return {"choices": [{"message": {"content": self.content}}]}

        def fake_post(url, headers, json, timeout):
            calls.append(json)
            if len(calls) == 1:
                return FakeResponse("Water evaporates, condenses, and falls as rain.")
            return FakeResponse("```mermaid\nflowchart TD\n    A[\"Evaporation\"] --> B[\"Condensation\"]\n    B --> C[\"Rain\"]\n```")

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = fake_post
        try:
            answer, source = rag._groq_answer(
                question="Explain the water cycle with a flowchart diagram",
                context_blocks=[],
                subject="Science",
                class_level="10",
                answer_style="exam",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        self.assertEqual(source, "groq")
        self.assertEqual(len(calls), 2)
        self.assertIn("flowchart TD", answer)
        self.assertIn("**Visual**", answer)

    def test_groq_prompt_uses_hindi_exam_format_for_hinglish_question(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post
        captured_payload = {}

        class FakeResponse:
            status_code = 200

            def json(self):
                return {"choices": [{"message": {"content": "प्रकाश संश्लेषण वह प्रक्रिया है..."}}]}

        def fake_post(url, headers, json, timeout):
            captured_payload.update(json)
            return FakeResponse()

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = fake_post
        try:
            answer, source = rag._groq_answer(
                question="photosynthesis samjhao",
                context_blocks=[],
                subject="Science",
                class_level="10",
                answer_style="exam",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        prompt_text = "\n".join(message["content"] for message in captured_payload["messages"])
        self.assertEqual(source, "groq")
        self.assertIn("Use simple, correct Hindi", prompt_text)
        self.assertIn("हिंदी वर्तनी", prompt_text)
        self.assertIn("romanized Hindi", prompt_text)
        self.assertIn("प्रकाश संश्लेषण", answer)

    def test_essay_request_replaces_standard_exam_template(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post
        captured_payload = {}

        class FakeResponse:
            status_code = 200

            def json(self):
                return {"choices": [{"message": {"content": "The Cow\n\nThe cow is a useful domestic animal."}}]}

        def fake_post(url, headers, json, timeout):
            captured_payload.update(json)
            return FakeResponse()

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = fake_post
        try:
            answer, source = rag._groq_answer(
                question="write me an essay on cow",
                context_blocks=[],
                subject="English",
                class_level="10",
                answer_style="exam",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        user_prompt = captured_payload["messages"][1]["content"]
        self.assertEqual(source, "groq")
        self.assertIn("The student asked for an essay/paragraph", user_prompt)
        self.assertIn("Do not add summary, key points, Q&A, practice questions", user_prompt)
        self.assertNotIn("Exam-friendly Q&A", user_prompt)
        self.assertNotIn("Quick practice", user_prompt)
        self.assertIn("The Cow", answer)

    def test_fallback_text_does_not_show_fallback_label(self):
        original_api_key = rag.settings.groq_api_key
        original_post = rag.requests.post

        class FakeResponse:
            status_code = 500

            def json(self):
                return {}

        rag.settings.groq_api_key = "test-key"
        rag.requests.post = lambda *args, **kwargs: FakeResponse()
        try:
            answer, source = rag._groq_answer(
                question="Explain acid",
                context_blocks=["Acids turn blue litmus red."],
                subject="Science",
                class_level="10",
                answer_style="exam",
            )
        finally:
            rag.settings.groq_api_key = original_api_key
            rag.requests.post = original_post

        self.assertEqual(source, "fallback")
        self.assertNotIn("Fallback", answer)
        self.assertNotIn("fallback", answer.lower())

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
