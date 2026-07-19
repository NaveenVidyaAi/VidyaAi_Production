import unittest

import backend.routers.teacher as teacher_module

from backend.routers.teacher import (
    CurriculumRequest,
    _curriculum_items,
    _curriculum_validation_errors,
    _generate_curriculum_plan,
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


if __name__ == "__main__":
    unittest.main()
