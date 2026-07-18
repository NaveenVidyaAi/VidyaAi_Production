import { Link } from "react-router-dom";
import LegalDocument from "../components/LegalDocument";
import { OFFICIAL_EMAIL } from "../components/PublicLayout";

const sections = [
  { id: "agreement", title: "Agreement to these terms" },
  { id: "eligibility", title: "Eligibility and younger users" },
  { id: "accounts", title: "Accounts and access" },
  { id: "service", title: "What VidyaAI provides" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "content", title: "Content and intellectual property" },
  { id: "privacy", title: "Privacy and learning data" },
  { id: "availability", title: "Availability and termination" },
  { id: "disclaimers", title: "Disclaimers and liability" },
  { id: "law", title: "Governing law and disputes" },
  { id: "changes", title: "Changes and contact" },
];

export default function Terms() {
  return (
    <LegalDocument
      eyebrow="LEGAL · GYANIX AI SOLUTIONS"
      title="Terms & Conditions"
      summary="These terms explain the rules for accessing and using VidyaAI, an educational technology product of Gyanix AI Solutions."
      sections={sections}
    >
      <section id="agreement">
        <h2>1. Agreement to these terms</h2>
        <p>By accessing or using VidyaAI, you agree to these Terms & Conditions, our <Link to="/privacy">Privacy Policy</Link> and our <Link to="/ai-use">Responsible AI Use Policy</Link>. If you do not agree, please do not use the service.</p>
        <p>“VidyaAI”, “Gyanix”, “we”, “us” and “our” refer to Gyanix AI Solutions and the VidyaAI product. “You” refers to the person using the service or the parent, guardian, teacher, school or organisation authorising that use.</p>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility and younger users</h2>
        <p>VidyaAI is designed for students and educators. Users under 18 should use the service with the knowledge and supervision of a parent, lawful guardian, teacher or authorised school, as applicable.</p>
        <p>A parent or guardian who believes a child has provided personal information without appropriate permission may contact us at <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>. We may restrict access while reviewing an age, safety or consent concern.</p>
      </section>

      <section id="accounts">
        <h2>3. Accounts and access</h2>
        <p>You must provide accurate information, select the appropriate student or teacher role, and avoid impersonating another person. You are responsible for activity performed through your browser session and for keeping any access credentials or devices under your control.</p>
        <p>Do not share access tokens, attempt to obtain another user’s information, claim a professional or teacher role you do not hold, or use automated methods to access the service without written permission.</p>
      </section>

      <section id="service">
        <h2>4. What VidyaAI provides</h2>
        <p>VidyaAI provides AI-assisted explanations, study support, quizzes, model-paper access, curriculum and lesson planning, question-paper creation and related educational tools. Features may change as the product improves.</p>
        <div className="legal-callout"><strong>Important:</strong> AI-generated material is assistance, not an official board publication, certified answer, professional assessment or guaranteed examination result. Teachers and learners must review important output before relying on it.</div>
        <p>VidyaAI is an independent educational technology product. Unless expressly stated otherwise, it is not affiliated with, sponsored by or endorsed by CGBSE or any government authority.</p>
      </section>

      <section id="acceptable-use">
        <h2>5. Acceptable use</h2>
        <p>You may use VidyaAI for lawful learning, teaching, lesson preparation and educational administration. You must not:</p>
        <ul>
          <li>use the service for cheating, impersonation, fraud or academic misconduct;</li>
          <li>upload or submit unlawful, abusive, discriminatory, sexually exploitative or harmful material;</li>
          <li>attempt to bypass security, probe systems, scrape content at scale or disrupt availability;</li>
          <li>submit passwords, payment-card details, government identifiers or unnecessary sensitive information in prompts;</li>
          <li>copy, resell or commercially redistribute the platform or generated resources in a way that violates applicable rights;</li>
          <li>use AI output as the sole basis for a high-impact decision about a student.</li>
        </ul>
      </section>

      <section id="content">
        <h2>6. Content and intellectual property</h2>
        <p>Gyanix AI Solutions owns or licenses the VidyaAI software, interface, branding and original product content. Educational documents, textbooks, board materials and third-party resources remain subject to the rights of their respective owners.</p>
        <p>You retain responsibility for information and material you submit. You give us permission to process it only as needed to operate, secure, evaluate and improve the service as described in the Privacy Policy.</p>
        <p>AI output may resemble material generated for other users and may not qualify for exclusive ownership. You are responsible for checking whether your intended use requires attribution, permission or additional review.</p>
      </section>

      <section id="privacy">
        <h2>7. Privacy and learning data</h2>
        <p>Use of VidyaAI involves processing account/profile information, prompts, responses, quiz activity, feedback and technical records. Some relevant prompt and learning context is processed by an external AI provider. Our <Link to="/privacy">Privacy Policy</Link> explains these practices in detail.</p>
        <p>Please avoid entering personal or confidential information that is not needed for your educational request.</p>
      </section>

      <section id="availability">
        <h2>8. Availability and termination</h2>
        <p>We may update, limit, suspend or discontinue features for maintenance, safety, legal, operational or product reasons. We do not promise uninterrupted availability or that every feature will remain unchanged.</p>
        <p>We may restrict access when these terms are violated, when use creates risk for other users or the service, or when required by law. You may stop using VidyaAI at any time and may request deletion of eligible personal data by contacting us.</p>
      </section>

      <section id="disclaimers">
        <h2>9. Disclaimers and liability</h2>
        <p>VidyaAI is provided on an “as available” basis. AI systems can misunderstand questions, omit context, generate outdated material or provide incorrect answers. Educational results depend on many factors and are not guaranteed.</p>
        <p>To the maximum extent permitted by applicable law, Gyanix AI Solutions will not be responsible for indirect, incidental or consequential loss arising from reliance on generated output, service interruption, unauthorised use, or material supplied by third parties. Nothing in these terms excludes rights or liability that cannot legally be excluded.</p>
      </section>

      <section id="law">
        <h2>10. Governing law and disputes</h2>
        <p>These terms are governed by the laws of India. Before beginning formal proceedings, please contact us so we can attempt to resolve the concern in good faith. Any dispute will be handled by a court or authority with lawful jurisdiction in India.</p>
      </section>

      <section id="changes">
        <h2>11. Changes and contact</h2>
        <p>We may revise these terms when the service or applicable requirements change. The version and effective date at the top identify the terms currently published. Material changes will be communicated through the website or product where reasonably possible.</p>
        <p>Questions about these terms may be sent to <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>.</p>
      </section>
    </LegalDocument>
  );
}
