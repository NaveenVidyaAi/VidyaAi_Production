import unittest

from backend.services.learning_loop import normalized_question_hash, private_student_key, quality_score, redact_personal_data


class LearningLoopTests(unittest.TestCase):
    def test_student_identifier_is_not_stored_raw(self):
        self.assertNotEqual(private_student_key("student@example.com"), "student@example.com")
        self.assertEqual(len(private_student_key("student@example.com")), 64)

    def test_normalized_questions_share_a_hash(self):
        self.assertEqual(
            normalized_question_hash("  Acid   base KYA hai? "),
            normalized_question_hash("acid base kya hai?"),
        )

    def test_email_and_indian_phone_are_redacted(self):
        cleaned = redact_personal_data("mail me at child@example.com or call +91 9876543210")
        self.assertNotIn("child@example.com", cleaned)
        self.assertNotIn("9876543210", cleaned)
        self.assertIn("[EMAIL]", cleaned)
        self.assertIn("[PHONE]", cleaned)

    def test_grounding_and_positive_feedback_raise_quality(self):
        plain = quality_score(answer="A" * 100, source_type="groq", sources=[])
        grounded = quality_score(answer="A" * 100, source_type="rag", sources=["Science Chapter 2"])
        validated = quality_score(answer="A" * 100, source_type="rag", sources=["Science Chapter 2"], positive=1)
        self.assertLess(plain, grounded)
        self.assertLess(grounded, validated)

    def test_negative_feedback_dominates_positive_signal(self):
        accepted = quality_score(answer="A" * 100, source_type="rag", sources=["book"], positive=2)
        rejected = quality_score(answer="A" * 100, source_type="rag", sources=["book"], positive=2, negative=1)
        self.assertLess(rejected, accepted)
        self.assertLess(rejected, 0.75)


if __name__ == "__main__":
    unittest.main()
