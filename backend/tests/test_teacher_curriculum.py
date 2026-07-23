import unittest
import json

import backend.routers.teacher as teacher_module

from backend.routers.teacher import (
    AITeacherRequest,
    CurriculumRequest,
    _curriculum_items,
    _curriculum_validation_errors,
    _generate_curriculum_plan,
    _generate_ai_teacher_lesson,
    _structured_curriculum_fallback,
)


class TeacherCurriculumTests(unittest.TestCase):
    def setUp(self):
        self.payload = CurriculumRequest(
            class_level="10",
            subject="Science",
            duration_weeks=8,
            periods_per_week=5,
            chapters="अम्ल, क्षारक एवं लवण",
            learning_goals="अवधारणात्मक समझ; प्रयोग और परीक्षा तैयारी",
            medium="Hindi",
        )

    def test_chapter_parser_preserves_commas_inside_official_title(self):
        chapters, goals = _curriculum_items(self.payload)

        self.assertEqual(chapters, ["अम्ल, क्षारक एवं लवण"])
        self.assertEqual(goals, ["अवधारणात्मक समझ", "प्रयोग और परीक्षा तैयारी"])

    def test_blank_class_10_scope_uses_official_chapter_map(self):
        payload = self.payload.model_copy(update={"chapters": ""})

        chapters, _ = _curriculum_items(payload)

        self.assertEqual(len(chapters), 18)
        self.assertTrue(chapters[0].startswith("1."))
        self.assertTrue(any("अम्ल" in chapter for chapter in chapters))

    def test_structured_fallback_is_complete_hindi_week_plan(self):
        content = _structured_curriculum_fallback(self.payload)

        self.assertEqual(_curriculum_validation_errors(content, self.payload), [])
        self.assertNotIn("Add textbook-aligned details", content)
        self.assertNotIn("AI generation is temporarily unavailable", content)
        self.assertIn("| 8 |", content)
        self.assertIn("कुल नियोजित पीरियड", content)
        self.assertIn("| 10 | Science | 8 सप्ताह | 5 | Hindi | 40 |", content)
        self.assertIn("शिक्षक चेकलिस्ट", content)

    def test_valid_ai_curriculum_is_returned_from_primary_model(self):
        expected = _structured_curriculum_fallback(self.payload)
        calls = []
        original_completion = teacher_module._request_paper_completion
        original_api_key = teacher_module.settings.groq_api_key

        def fake_completion(prompt, *, json_mode=False, max_tokens=7000, response_schema=None, model=None):
            calls.append({"model": model, "prompt": prompt, "max_tokens": max_tokens})
            return expected

        teacher_module._request_paper_completion = fake_completion
        teacher_module.settings.groq_api_key = "test-key"
        try:
            content, mode = _generate_curriculum_plan(payload=self.payload, context="आधिकारिक पाठ्यक्रम साक्ष्य")
        finally:
            teacher_module._request_paper_completion = original_completion
            teacher_module.settings.groq_api_key = original_api_key

        self.assertEqual(content, expected)
        self.assertEqual(mode, "ai")
        self.assertEqual([call["model"] for call in calls], ["openai/gpt-oss-20b"])
        self.assertIn("exactly 8 weeks", calls[0]["prompt"])
        self.assertIn("exactly 5", calls[0]["prompt"])

    def test_invalid_provider_outputs_switch_models_then_use_complete_fallback(self):
        calls = []
        original_completion = teacher_module._request_paper_completion
        original_api_key = teacher_module.settings.groq_api_key

        def fake_completion(prompt, *, json_mode=False, max_tokens=7000, response_schema=None, model=None):
            calls.append(model)
            return "# अधूरी योजना\n\nसप्ताह की जानकारी बाद में जोड़ें।"

        teacher_module._request_paper_completion = fake_completion
        teacher_module.settings.groq_api_key = "test-key"
        try:
            content, mode = _generate_curriculum_plan(payload=self.payload, context="आधिकारिक पाठ्यक्रम साक्ष्य")
        finally:
            teacher_module._request_paper_completion = original_completion
            teacher_module.settings.groq_api_key = original_api_key

        self.assertEqual(calls, ["openai/gpt-oss-20b", "openai/gpt-oss-120b"])
        self.assertEqual(mode, "structured_fallback")
        self.assertEqual(_curriculum_validation_errors(content, self.payload), [])
        self.assertIn("| 1 |", content)
        self.assertIn("| 8 |", content)

    def test_curriculum_validator_rejects_old_placeholder(self):
        old_fallback = (
            "# Class 10 Science Curriculum Plan\n\n"
            "> AI generation is temporarily unavailable.\n\n"
            "## Week-wise plan\n\n- Add textbook-aligned details here."
        )

        errors = _curriculum_validation_errors(old_fallback, self.payload)

        self.assertTrue(any("placeholder" in error for error in errors))
        self.assertTrue(any("week table" in error for error in errors))

    def test_ai_teacher_builds_valid_grounded_scenes(self):
        payload = AITeacherRequest(
            class_level="10",
            subject="Science",
            chapter_id="science-2",
            chapter_or_topic="2: अम्ल, क्षारक एवं लवण",
            medium="Hindi",
        )
        original_post = teacher_module.requests.post
        original_key = teacher_module.settings.groq_api_key

        class FakeResponse:
            status_code = 200

            def json(self):
                return {"choices": [{"message": {"content": json.dumps({
                    "title": "अम्ल, क्षारक एवं लवण",
                    "objective": "विद्यार्थी अम्ल और क्षारक में अंतर बताएँगे।",
                    "duration_minutes": 6,
                    "scenes": [
                        {"title": f"भाग {index}", "narration": "आज हम सत्यापित पाठ्यपुस्तक संदर्भ से अम्ल और क्षारक को सरल उदाहरण के साथ समझेंगे।", "board_lines": ["अम्ल एवं क्षारक", f"मुख्य बिंदु {index}"], "teacher_action": "explain"}
                        for index in range(1, 4)
                    ],
                    "check_question": "अम्ल और क्षारक में एक अंतर क्या है?",
                    "check_answer": "उनके गुण अलग होते हैं।",
                }, ensure_ascii=False)}}]}

        teacher_module.settings.groq_api_key = "test-key"
        teacher_module.requests.post = lambda *args, **kwargs: FakeResponse()
        try:
            lesson = _generate_ai_teacher_lesson(payload, "Verified chapter evidence")
        finally:
            teacher_module.requests.post = original_post
            teacher_module.settings.groq_api_key = original_key

        self.assertEqual(len(lesson["scenes"]), 3)
        self.assertEqual(lesson["duration_minutes"], 6)
        self.assertIn("अम्ल", lesson["title"])

    def test_ai_teacher_retries_with_fallback_model(self):
        payload = AITeacherRequest(
            class_level="10",
            subject="Science",
            chapter_id="science-2",
            chapter_or_topic="2: अम्ल, क्षारक एवं लवण",
            medium="Hindi",
        )
        original_post = teacher_module.requests.post
        original_key = teacher_module.settings.groq_api_key
        calls = []

        class FakeResponse:
            def __init__(self, status_code):
                self.status_code = status_code

            def json(self):
                if self.status_code != 200:
                    return {"error": {"message": "temporary provider error"}}
                return {"choices": [{"message": {"content": json.dumps({
                    "title": "अम्ल और क्षारक",
                    "objective": "विद्यार्थी मुख्य अंतर समझेंगे।",
                    "duration_minutes": 5,
                    "scenes": [
                        {"title": f"भाग {index}", "narration": "सत्यापित पाठ्यपुस्तक संदर्भ से इस अवधारणा को एक सरल उदाहरण के साथ ध्यानपूर्वक समझते हैं।", "board_lines": [f"मुख्य बिंदु {index}"], "teacher_action": "explain"}
                        for index in range(1, 4)
                    ],
                }, ensure_ascii=False)}}]}

        def fake_post(*args, **kwargs):
            calls.append(kwargs["json"]["model"])
            return FakeResponse(500 if len(calls) == 1 else 200)

        teacher_module.settings.groq_api_key = "test-key"
        teacher_module.requests.post = fake_post
        try:
            lesson = _generate_ai_teacher_lesson(payload, "Verified chapter evidence")
        finally:
            teacher_module.requests.post = original_post
            teacher_module.settings.groq_api_key = original_key

        self.assertEqual(len(calls), 2)
        self.assertNotEqual(calls[0], calls[1])
        self.assertEqual(len(lesson["scenes"]), 3)


if __name__ == "__main__":
    unittest.main()
