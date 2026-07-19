import unittest

import backend.routers.teacher as teacher_module

from backend.routers.teacher import (
    TestPaperRequest,
    _chapter_hint,
    _chapter_options,
    _default_paper_rules,
    _generate_structured_test_paper,
    _local_teacher_context,
    _normalize_paper_data,
    _paper_request_errors,
    _request_paper_completion,
    _paper_validation_errors,
    _structured_paper_token_budget,
    _validate_paper_data,
    _split_paper_content,
)


class TeacherPaperTests(unittest.TestCase):
    def setUp(self):
        self.payload = TestPaperRequest(
            class_level="10",
            subject="Science",
            syllabus="रासायनिक अभिक्रियाएँ",
            total_marks=5,
            question_count=2,
            duration_minutes=30,
            medium="Hindi",
        )

    def test_generated_paper_sections_are_split_for_independent_printing(self):
        content = """<!-- BLUEPRINT -->
# रूपरेखा
कुल अंक: 50
<!-- PAPER -->
# प्रश्नपत्र
प्रश्न 1. उत्तर दीजिए। (1)
<!-- ANSWER_KEY -->
# उत्तर कुंजी
1. नमूना उत्तर
"""
        parts = _split_paper_content(content)

        self.assertIn("रूपरेखा", parts["blueprint"])
        self.assertIn("प्रश्नपत्र", parts["paper_content"])
        self.assertNotIn("उत्तर कुंजी", parts["paper_content"])
        self.assertIn("नमूना उत्तर", parts["answer_key"])

    def test_structured_completion_uses_json_mode_without_markdown_conflict(self):
        captured = {}

        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"choices": [{"finish_reason": "stop", "message": {"content": "{}"}}]}

        original_post = teacher_module.requests.post

        def fake_post(*args, **kwargs):
            captured.update(kwargs["json"])
            return FakeResponse()

        teacher_module.requests.post = fake_post
        try:
            self.assertEqual(_request_paper_completion("JSON बनाइए", json_mode=True, max_tokens=14000), "{}")
        finally:
            teacher_module.requests.post = original_post

        self.assertEqual(captured["response_format"], {"type": "json_object"})
        self.assertEqual(captured["max_tokens"], 14000)
        system_prompt = captured["messages"][0]["content"]
        self.assertIn("valid JSON object", system_prompt)
        self.assertNotIn("Markdown only", system_prompt)

    def test_structured_completion_supports_model_override_and_json_object_mode(self):
        captured = {}

        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"choices": [{"finish_reason": "stop", "message": {"content": '{"instructions":[]}'}}]}

        original_post = teacher_module.requests.post
        original_paper_model = teacher_module.settings.groq_paper_model

        def fake_post(*args, **kwargs):
            captured.update(kwargs["json"])
            return FakeResponse()

        teacher_module.requests.post = fake_post
        teacher_module.settings.groq_paper_model = "openai/gpt-oss-20b"
        try:
            content = _request_paper_completion(
                "JSON बनाइए",
                json_mode=True,
                max_tokens=3900,
                model="openai/gpt-oss-120b",
            )
        finally:
            teacher_module.requests.post = original_post
            teacher_module.settings.groq_paper_model = original_paper_model

        self.assertEqual(content, '{"instructions":[]}')
        self.assertEqual(captured["model"], "openai/gpt-oss-120b")
        self.assertEqual(captured["reasoning_effort"], "low")
        self.assertEqual(captured["response_format"], {"type": "json_object"})

    def test_normalizer_applies_teacher_blueprint_and_consecutive_numbering(self):
        payload = TestPaperRequest(
            class_level="10",
            subject="Science",
            syllabus="अम्ल, क्षारक एवं लवण",
            total_marks=5,
            question_count=3,
            medium="Hindi",
            sections=[
                {
                    "name": "A",
                    "label_hi": "बहुविकल्पीय प्रश्न",
                    "type": "mcq",
                    "count": 1,
                    "marks_each": 1,
                    "word_limit": "",
                    "custom_questions": [{
                        "text_hi": "उदासीनीकरण अभिक्रिया का सही विकल्प चुनिए।",
                        "options_hi": ["लवण और जल", "केवल अम्ल", "केवल क्षारक", "केवल गैस"],
                        "or_text_hi": "",
                        "answer_hi": "लवण और जल",
                        "marking_points_hi": ["सही विकल्प — एक अंक"],
                    }],
                },
                {
                    "name": "B",
                    "label_hi": "लघु उत्तरीय प्रश्न",
                    "type": "short",
                    "count": 2,
                    "marks_each": 2,
                    "word_limit": "30",
                },
            ],
        )
        data = {
            "instructions": ["सभी प्रश्न हल कीजिए।", "उत्तर स्पष्ट लिखिए।"],
            "sections": [
                {
                    "name": "गलत-अ",
                    "label_hi": "गलत नाम",
                    "type": "short",
                    "marks_each": 9,
                    "word_limit": "90",
                    "questions": [{
                        "number": 8,
                        "text_hi": "मॉडल द्वारा बदला हुआ प्रश्न।",
                        "options_hi": ["गलत 1", "गलत 2", "गलत 3", "गलत 4"],
                        "answer_hi": "गलत उत्तर",
                    }],
                },
                {
                    "name": "गलत-ब",
                    "label_hi": "गलत नाम",
                    "type": "mcq",
                    "marks_each": 7,
                    "word_limit": "70",
                    "questions": [
                        {
                            "number": 3,
                            "text_hi": "अम्ल और क्षारक में एक अंतर लिखिए।",
                            "options_hi": ["क", "ख", "ग", "घ"],
                            "answer_hi": "अम्ल और क्षारक के गुण भिन्न होते हैं।",
                        },
                        {
                            "number": 1,
                            "text_hi": "लवण बनने की प्रक्रिया समझाइए।",
                            "options_hi": ["क", "ख", "ग", "घ"],
                            "answer_hi": "उदासीनीकरण से लवण बनता है।",
                        },
                    ],
                },
            ],
        }

        normalized = _normalize_paper_data(data, payload)

        self.assertIs(normalized, data)
        self.assertEqual(
            {key: normalized["sections"][0][key] for key in ("name", "label_hi", "type", "marks_each", "word_limit")},
            {"name": "A", "label_hi": "बहुविकल्पीय प्रश्न", "type": "mcq", "marks_each": 1, "word_limit": ""},
        )
        self.assertEqual(
            {key: normalized["sections"][1][key] for key in ("name", "label_hi", "type", "marks_each", "word_limit")},
            {"name": "B", "label_hi": "लघु उत्तरीय प्रश्न", "type": "short", "marks_each": 2, "word_limit": "30"},
        )
        questions = [question for section in normalized["sections"] for question in section["questions"]]
        self.assertEqual([question["number"] for question in questions], [1, 2, 3])
        locked_question = normalized["sections"][0]["questions"][0]
        self.assertEqual(locked_question["text_hi"], "उदासीनीकरण अभिक्रिया का सही विकल्प चुनिए।")
        self.assertEqual(locked_question["options_hi"], ["लवण और जल", "केवल अम्ल", "केवल क्षारक", "केवल गैस"])
        self.assertEqual(locked_question["answer_hi"], "लवण और जल")
        self.assertEqual(locked_question["marking_points_hi"], ["सही विकल्प — एक अंक"])
        self.assertTrue(all(question["options_hi"] == [] for question in normalized["sections"][1]["questions"]))

    def test_structured_token_budget_scales_for_full_papers(self):
        self.assertGreater(_structured_paper_token_budget(23), 0)
        self.assertLessEqual(_structured_paper_token_budget(23), 5000)
        self.assertLessEqual(_structured_paper_token_budget(100), 5000)

    def test_compact_paper_context_preserves_scope_labels_and_outer_edges(self):
        context = "\n\n".join([
            "[Evidence scope: official paper structure]\nBEGIN-PATTERN\n" + ("प्रारूप " * 250),
            "[Evidence scope: अध्याय 2 — अम्ल, क्षारक एवं लवण]\n" + ("पाठ्यसाक्ष्य " * 250) + "\nEND-CHAPTER",
        ])

        compact = teacher_module._compact_paper_context(context, max_chars=700)

        self.assertLessEqual(len(compact), 700)
        self.assertIn("[Evidence scope: official paper structure]", compact)
        self.assertIn("[Evidence scope: अध्याय 2 — अम्ल, क्षारक एवं लवण]", compact)
        self.assertIn("BEGIN-PATTERN", compact)
        self.assertIn("END-CHAPTER", compact)

    def test_structured_generation_retries_provider_413_with_smaller_request(self):
        payload = TestPaperRequest(
            class_level="10",
            subject="Science",
            syllabus="अम्ल, क्षारक एवं लवण",
            total_marks=23,
            question_count=23,
            duration_minutes=30,
            medium="Hindi",
            sections=[{
                "name": "A",
                "type": "short",
                "label_hi": "लघु उत्तरीय",
                "count": 23,
                "marks_each": 1,
                "word_limit": "30",
            }],
        )
        valid_data = {
            "instructions": ["सभी प्रश्न हल कीजिए।", "उत्तर स्पष्ट और क्रमबद्ध लिखिए।"],
            "sections": [{
                "name": "A",
                "label_hi": "लघु उत्तरीय",
                "type": "short",
                "marks_each": 1,
                "word_limit": "30",
                "questions": [
                    {
                        "number": number,
                        "text_hi": (
                            f"अम्ल, क्षारक और लवण से संबंधित वैज्ञानिक अवधारणा {number} को "
                            "उचित उदाहरण सहित स्पष्ट कीजिए।"
                        ),
                        "options_hi": [],
                        "or_text_hi": "",
                        "answer_hi": "यह पाठ्यक्रम के अनुरूप संक्षिप्त और तथ्यात्मक उत्तर है।",
                        "marking_points_hi": ["सही वैज्ञानिक तथ्य"],
                    }
                    for number in range(1, 24)
                ],
            }],
        }
        context = "\n\n".join([
            "[Evidence scope: official paper structure]\n" + ("प्रारूप साक्ष्य " * 1200),
            "[Evidence scope: अध्याय 2 — अम्ल, क्षारक एवं लवण]\n" + ("पाठ्यपुस्तक साक्ष्य " * 1200),
        ])
        calls = []
        original_completion = teacher_module._request_paper_completion
        original_api_key = teacher_module.settings.groq_api_key

        def fake_completion(prompt, *, json_mode=False, max_tokens=7000, response_schema=None, model=None):
            calls.append({
                "prompt": prompt,
                "json_mode": json_mode,
                "max_tokens": max_tokens,
                "response_schema": response_schema,
                "model": model,
            })
            if len(calls) == 1:
                response = teacher_module.requests.Response()
                response.status_code = 413
                raise teacher_module.requests.HTTPError("request too large", response=response)
            return teacher_module.json.dumps(valid_data, ensure_ascii=False)

        teacher_module._request_paper_completion = fake_completion
        teacher_module.settings.groq_api_key = "test-key"
        try:
            result = _generate_structured_test_paper(payload=payload, context=context)
        finally:
            teacher_module._request_paper_completion = original_completion
            teacher_module.settings.groq_api_key = original_api_key

        self.assertEqual(result, valid_data)
        self.assertEqual(len(calls), 2)
        self.assertTrue(all(call["json_mode"] for call in calls))
        self.assertTrue(all(call["response_schema"] is None for call in calls))
        self.assertEqual(calls[0]["model"], "openai/gpt-oss-20b")
        self.assertEqual(calls[1]["model"], "openai/gpt-oss-120b")
        self.assertLess(calls[1]["max_tokens"], calls[0]["max_tokens"])
        self.assertLess(len(calls[1]["prompt"]), len(calls[0]["prompt"]))

    def test_three_question_paper_uses_fallback_model_after_malformed_primary_json(self):
        payload = TestPaperRequest(
            class_level="10",
            subject="Science",
            selected_chapters=["science-2"],
            total_marks=5,
            question_count=3,
            duration_minutes=30,
            medium="Hindi",
            sections=[
                {"name": "A", "label_hi": "बहुविकल्पीय प्रश्न", "type": "mcq", "count": 1, "marks_each": 1, "word_limit": ""},
                {"name": "B", "label_hi": "अति लघु उत्तरीय प्रश्न", "type": "very_short", "count": 2, "marks_each": 2, "word_limit": "30"},
            ],
        )
        valid_data = {
            "instructions": ["सभी प्रश्न हल कीजिए।", "उत्तर क्रम से और स्पष्ट लिखिए।"],
            "sections": [
                {
                    "name": "A", "label_hi": "बहुविकल्पीय प्रश्न", "type": "mcq", "marks_each": 1, "word_limit": "",
                    "questions": [{
                        "number": 1, "text_hi": "अम्लीय विलयन में नीला लिटमस किस रंग का हो जाता है?",
                        "options_hi": ["लाल", "नीला", "हरा", "पीला"], "or_text_hi": "", "answer_hi": "लाल",
                        "marking_points_hi": ["सही विकल्प के लिए एक अंक"],
                    }],
                },
                {
                    "name": "B", "label_hi": "अति लघु उत्तरीय प्रश्न", "type": "very_short", "marks_each": 2, "word_limit": "30",
                    "questions": [
                        {"number": 2, "text_hi": "उदासीनीकरण अभिक्रिया से बनने वाले दो उत्पाद लिखिए।", "options_hi": [], "or_text_hi": "", "answer_hi": "लवण और जल।", "marking_points_hi": ["लवण", "जल"]},
                        {"number": 3, "text_hi": "दैनिक जीवन में क्षारक का एक उपयोग उदाहरण सहित लिखिए।", "options_hi": [], "or_text_hi": "", "answer_hi": "उचित उदाहरण सहित क्षारक का उपयोग।", "marking_points_hi": ["सही उपयोग", "उदाहरण"]},
                    ],
                },
            ],
        }
        calls = []
        original_completion = teacher_module._request_paper_completion
        original_api_key = teacher_module.settings.groq_api_key

        def fake_completion(prompt, *, json_mode=False, max_tokens=7000, response_schema=None, model=None):
            calls.append(model)
            if len(calls) == 1:
                return '{"instructions":["अधूरा"]}'
            return teacher_module.json.dumps(valid_data, ensure_ascii=False)

        teacher_module._request_paper_completion = fake_completion
        teacher_module.settings.groq_api_key = "test-key"
        try:
            result = _generate_structured_test_paper(payload=payload, context="अम्ल, क्षारक एवं लवण")
        finally:
            teacher_module._request_paper_completion = original_completion
            teacher_module.settings.groq_api_key = original_api_key

        self.assertEqual(result, valid_data)
        self.assertEqual(calls, ["openai/gpt-oss-20b", "openai/gpt-oss-120b"])

    def test_structured_validator_reports_string_section_without_crashing(self):
        errors = _validate_paper_data(
            {"instructions": ["सभी प्रश्न हल करें।", "उत्तर स्पष्ट लिखें।"], "sections": ["not-an-object"]},
            self.payload,
        )

        self.assertTrue(any("section" in error for error in errors))

    def test_unsplit_legacy_content_remains_printable(self):
        parts = _split_paper_content("# पुराना प्रश्नपत्र")

        self.assertEqual(parts["paper_content"], "# पुराना प्रश्नपत्र")
        self.assertEqual(parts["answer_key"], "")

    def test_local_context_reads_model_paper_and_curriculum(self):
        context, sources = _local_teacher_context("10", "Science", max_chars=3000)

        self.assertTrue(context)
        self.assertTrue(any("model-paper" in source for source in sources))

    def test_local_context_can_find_a_late_selected_curriculum_topic(self):
        context, _ = _local_teacher_context(
            "10", "Science", max_chars=11000, scope_terms=["ऊर्जा : स्वरूप एवं स्रोत"]
        )

        self.assertIn("स्वरूप", context)

    def test_chapter_hint_never_mistakes_class_or_marks_for_chapter(self):
        self.assertEqual(_chapter_hint("Class 10 Science chapter 1.2 important questions"), "1")
        self.assertEqual(_chapter_hint("कक्षा 10 विज्ञान अध्याय 12"), "12")
        self.assertIsNone(_chapter_hint("Class 10 Science 30 marks"))

    def test_chapter_options_are_official_ids_not_free_text(self):
        science = {option["id"]: option for option in _chapter_options("Science", "10")}
        math = {option["id"]: option for option in _chapter_options("Math", "10")}
        hindi = {option["id"]: option for option in _chapter_options("Hindi", "10")}
        english = {option["id"]: option for option in _chapter_options("English", "10")}
        social = {option["id"]: option for option in _chapter_options("Social Science", "10")}
        sanskrit = {option["id"]: option for option in _chapter_options("Sanskrit", "10")}

        self.assertEqual(len(science), 18)
        self.assertEqual(len(math), 16)
        self.assertEqual(len(hindi), 23)
        self.assertEqual(len(english), 15)
        self.assertEqual(len(social), 21)
        self.assertEqual(len(sanskrit), 21)
        self.assertEqual(science["science-2"]["chapter_hint"], "2")
        self.assertIn("अम्ल", science["science-2"]["label"])
        self.assertEqual(science["science-4"]["chapter_hint"], "4")
        self.assertEqual(math["math-7"]["label"], "आलेख")
        self.assertEqual(hindi["hindi-4-1"]["section_hint"], "4-1")
        self.assertEqual(english["english-5-b"]["section_hint"], "5-B")
        self.assertEqual(_chapter_options("Science", "9"), [])

    def test_validator_accepts_numbered_unique_hindi_paper_with_exact_marks(self):
        content = """<!-- BLUEPRINT -->
# रूपरेखा
दो प्रश्नों में कुल पाँच अंक निर्धारित हैं। प्रश्नपत्र की कठिनाई और पाठ्यक्रम सीमा की जाँच की गई है।
<!-- PAPER -->
# विद्यालय स्तरीय विज्ञान प्रश्नपत्र
समय: 30 मिनट | पूर्णांक: 5

## निर्देश
सभी प्रश्न हल करना अनिवार्य है। उत्तर स्पष्ट रूप से लिखिए।

प्रश्न 1. मैग्नीशियम के जलने पर बनने वाले पदार्थ का नाम लिखिए। [2 अंक]

प्रश्न 2. रासायनिक अभिक्रिया के दो लक्षण उदाहरण सहित समझाइए। [3 अंक]
<!-- ANSWER_KEY -->
# उत्तर कुंजी
1. मैग्नीशियम ऑक्साइड। सही उत्पाद और संतुलित समीकरण लिखने के लिए दो अंक प्रदान किए जाएँ।
2. रंग परिवर्तन और गैस उत्सर्जन उचित उदाहरण हैं। प्रत्येक सही लक्षण तथा उदाहरण के लिए निर्धारित अंक प्रदान किए जाएँ। उत्तर वैज्ञानिक रूप से सही और स्पष्ट होना चाहिए।
"""
        self.assertEqual(_paper_validation_errors(content, self.payload), [])

    def test_validator_rejects_repeated_questions_and_wrong_mark_total(self):
        repeated = "कौन सा पदार्थ अभिक्रिया में बनता है?"
        content = f"""<!-- BLUEPRINT -->
# रूपरेखा
यह गलत नमूना प्रश्नपत्र सत्यापन के लिए पर्याप्त पाठ रखता है।
<!-- PAPER -->
# विज्ञान प्रश्नपत्र
निर्देश: सभी प्रश्नों के उत्तर लिखिए और प्रत्येक उत्तर को स्पष्ट कीजिए।
प्रश्न 1. {repeated} [1 अंक]
प्रश्न 2. {repeated} [1 अंक]
{('अतिरिक्त विवरण ' * 40)}
<!-- ANSWER_KEY -->
# उत्तर कुंजी
यह उत्तर कुंजी केवल स्वचालित परीक्षण हेतु पर्याप्त लंबाई में लिखी गई है। सही उत्तरों के लिए निर्धारित अंक प्रदान किए जाएँ।
"""
        errors = _paper_validation_errors(content, self.payload)

        self.assertTrue(any("repeated" in error for error in errors))
        self.assertTrue(any("not 5" in error for error in errors))

    def test_structured_validator_locks_teacher_section_blueprint(self):
        payload = TestPaperRequest(
            class_level="10", subject="Science", syllabus="प्रकाश", total_marks=5,
            question_count=2, duration_minutes=30, medium="Hindi",
            sections=[{"name": "A", "type": "short", "label_hi": "लघु उत्तरीय", "count": 2, "marks_each": 2, "word_limit": "30"}],
        )
        data = {
            "instructions": ["सभी प्रश्न हल करें।", "उत्तर स्पष्ट लिखें।"],
            "sections": [{
                "name": "B", "label_hi": "लघु उत्तरीय", "type": "short", "marks_each": 2,
                "questions": [
                    {"number": 1, "text_hi": "प्रकाश के परावर्तन का नियम लिखिए।", "options_hi": [], "answer_hi": "नियम", "marking_points_hi": []},
                    {"number": 2, "text_hi": "समतल दर्पण में प्रतिबिंब समझाइए।", "options_hi": [], "answer_hi": "प्रतिबिंब", "marking_points_hi": []},
                ],
            }],
        }
        errors = _validate_paper_data(data, payload)

        self.assertTrue(any("name changed" in error for error in errors))
        self.assertTrue(any("not 5" in error for error in errors))

    def test_request_validator_rejects_more_custom_questions_than_slots(self):
        payload = TestPaperRequest(
            class_level="10", subject="Science", syllabus="प्रकाश", total_marks=5,
            question_count=1, medium="Hindi",
            sections=[{
                "name": "A", "type": "short", "count": 1, "marks_each": 5,
                "custom_questions": [
                    {"text_hi": "परावर्तन का नियम लिखिए।"},
                    {"text_hi": "अपवर्तन का नियम लिखिए।"},
                ],
            }],
        )

        self.assertTrue(any("शिक्षक प्रश्न कुल प्रश्नों से अधिक" in error for error in _paper_request_errors(payload)))

    def test_sectionless_three_question_blueprint_distributes_five_marks_exactly(self):
        payload = TestPaperRequest(
            class_level="10", subject="Science", syllabus="प्रकाश", total_marks=5,
            question_count=3, medium="Hindi", sections=[],
        )

        rules = _default_paper_rules(payload)

        self.assertEqual(sum(rule["count"] for rule in rules), 3)
        self.assertEqual(sum(rule["count"] * rule["marks_each"] for rule in rules), 5)
        self.assertEqual([(rule["count"], rule["marks_each"]) for rule in rules], [(1, 1), (2, 2)])
        self.assertEqual(_paper_request_errors(payload), [])

    def test_sectionless_blueprint_rejects_fewer_marks_than_questions(self):
        payload = TestPaperRequest(
            class_level="10", subject="Science", syllabus="प्रकाश", total_marks=5,
            question_count=6, medium="Hindi", sections=[],
        )

        self.assertTrue(any("कुल अंक" in error for error in _paper_request_errors(payload)))

    def test_structured_validator_preserves_entire_teacher_question(self):
        question_text = "प्रकाश के परावर्तन के दोनों नियम स्पष्ट भाषा में उदाहरण सहित लिखिए और उनका उपयोग समझाइए।"
        payload = TestPaperRequest(
            class_level="10", subject="Science", syllabus="प्रकाश", total_marks=5,
            question_count=1, medium="Hindi",
            sections=[{
                "name": "A", "type": "short", "label_hi": "लघु उत्तरीय", "count": 1, "marks_each": 5,
                "custom_questions": [{
                    "text_hi": question_text,
                    "or_text_hi": "अपवर्तन के नियम उदाहरण सहित लिखिए।",
                    "answer_hi": "आपतन कोण परावर्तन कोण के बराबर होता है।",
                    "marking_points_hi": ["सही नियम — एक अंक", "उदाहरण — एक अंक"],
                }],
            }],
        )
        data = {
            "instructions": ["सभी प्रश्न हल करें।", "उत्तर स्पष्ट लिखें।"],
            "sections": [{
                "name": "A", "label_hi": "लघु उत्तरीय", "type": "short", "marks_each": 5,
                "questions": [{
                    "number": 1, "text_hi": question_text, "options_hi": [],
                    "or_text_hi": "बदला हुआ वैकल्पिक प्रश्न।",
                    "answer_hi": "आपतन कोण परावर्तन कोण के बराबर होता है।",
                    "marking_points_hi": ["सही नियम — एक अंक", "उदाहरण — एक अंक"],
                }],
            }],
        }

        errors = _validate_paper_data(data, payload)

        self.assertTrue(any("teacher alternative was changed" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
