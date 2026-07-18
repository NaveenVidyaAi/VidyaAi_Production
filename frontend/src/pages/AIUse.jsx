import { Link } from "react-router-dom";
import LegalDocument from "../components/LegalDocument";
import { OFFICIAL_EMAIL } from "../components/PublicLayout";

const sections = [
  { id: "purpose", title: "Purpose of this policy" },
  { id: "how-ai-is-used", title: "How VidyaAI uses AI" },
  { id: "provider-processing", title: "AI provider processing" },
  { id: "review", title: "Accuracy and human review" },
  { id: "assessment", title: "Assessment and teacher use" },
  { id: "student-use", title: "Student responsibility" },
  { id: "prohibited", title: "Prohibited AI use" },
  { id: "improvement", title: "Review and product improvement" },
  { id: "reporting", title: "Reporting AI concerns" },
];

export default function AIUse() {
  return (
    <LegalDocument
      eyebrow="RESPONSIBLE TECHNOLOGY · VIDYAAI"
      title="Responsible AI Use Policy"
      summary="This policy explains where artificial intelligence is used in VidyaAI, what its limitations are, and the responsibilities shared by Gyanix, teachers and learners."
      icon="brain"
      sections={sections}
    >
      <section id="purpose">
        <h2>1. Purpose of this policy</h2>
        <p>VidyaAI uses generative artificial intelligence to support learning and teaching. This policy is intended to make that use understandable and to prevent AI output from being mistaken for verified human judgment or official educational material.</p>
      </section>

      <section id="how-ai-is-used">
        <h2>2. How VidyaAI uses AI</h2>
        <p>AI may be used to generate or assist with:</p>
        <ul>
          <li>answers and explanations for student questions;</li>
          <li>practice quizzes and question sets;</li>
          <li>curriculum plans, lesson plans and test-paper drafts;</li>
          <li>feedback based on learning activity and weak-topic signals;</li>
          <li>retrieval and summarisation of relevant curriculum, textbook and model-paper material;</li>
          <li>language-aware responses in Hindi and English.</li>
        </ul>
      </section>

      <section id="provider-processing">
        <h2>3. AI provider processing</h2>
        <p>VidyaAI currently uses Groq-hosted AI models for generation. Depending on the feature, relevant user-entered text, recent conversation context, selected class or subject, retrieved educational excerpts, teacher instructions and learning signals may be sent to that provider to produce a response.</p>
        <p>We do not deliberately add a user’s account email or name to an AI request, but anything a user types into a question, note or instruction may be included. Do not enter passwords, payment information, government identifiers, private health information or unnecessary personal details.</p>
        <p>See our <Link to="/privacy">Privacy Policy</Link> for a fuller description of information handling.</p>
      </section>

      <section id="review">
        <h2>4. Accuracy and human review</h2>
        <div className="legal-callout"><strong>AI can be wrong.</strong> It may generate incomplete, outdated, inconsistent or fabricated information, even when the answer sounds confident.</div>
        <p>Students should compare important answers with textbooks, official curriculum material and teacher guidance. Teachers should review generated plans, questions, answer keys, rubrics and explanations before distributing or relying on them.</p>
      </section>

      <section id="assessment">
        <h2>5. Assessment and teacher use</h2>
        <p>AI-generated question papers and curriculum plans are drafts for professional review. AI feedback about an answer is supportive guidance and must not be treated as an official board result, final grade, disciplinary finding or sole basis for an important educational decision.</p>
        <p>Teachers remain responsible for checking curriculum alignment, factual accuracy, mark allocation, accessibility, fairness and suitability for their learners.</p>
      </section>

      <section id="student-use">
        <h2>6. Student responsibility</h2>
        <p>VidyaAI should be used to understand concepts, practise skills and improve independent work. Students should follow the academic-integrity rules of their teacher, school and examination authority, and should disclose AI assistance when required.</p>
        <p>Submitting AI-generated work as entirely one’s own, using the service during a restricted examination, or using generated answers to deceive a teacher is not acceptable.</p>
      </section>

      <section id="prohibited">
        <h2>7. Prohibited AI use</h2>
        <p>Users must not use VidyaAI to create harmful or unlawful material; harass or exploit another person; impersonate a student or teacher; bypass assessment rules; expose confidential data; manipulate educational records; or make automated high-impact decisions about a learner.</p>
      </section>

      <section id="improvement">
        <h2>8. Review and product improvement</h2>
        <p>Conversations, responses and feedback may be stored and selected as candidates for authorised human review and product-improvement datasets. Some direct identifiers are minimised in the review workflow, but users should not assume that all free-text information is automatically anonymous.</p>
        <p>VidyaAI does not automatically retrain model weights from each conversation. Any reviewed use of interaction data is governed by internal approval workflows and the practices described in our Privacy Policy.</p>
      </section>

      <section id="reporting">
        <h2>9. Reporting AI concerns</h2>
        <p>If an AI response appears unsafe, discriminatory, seriously inaccurate, privacy-invasive or inappropriate for a student, stop relying on it and report the concern to <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>. Include the subject and enough non-sensitive context for us to investigate.</p>
      </section>
    </LegalDocument>
  );
}
