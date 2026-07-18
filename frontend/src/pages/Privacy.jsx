import { Link } from "react-router-dom";
import LegalDocument from "../components/LegalDocument";
import { OFFICIAL_EMAIL } from "../components/PublicLayout";

const sections = [
  { id: "scope", title: "Scope and responsibility" },
  { id: "collection", title: "Information we process" },
  { id: "use", title: "How information is used" },
  { id: "ai-providers", title: "AI and service providers" },
  { id: "review", title: "Admin review and improvement" },
  { id: "browser-storage", title: "Browser storage and cookies" },
  { id: "children", title: "Children and parental involvement" },
  { id: "retention", title: "Retention and deletion" },
  { id: "security", title: "Security" },
  { id: "rights", title: "Your choices and rights" },
  { id: "transfers", title: "Processing locations" },
  { id: "updates", title: "Updates and contact" },
];

export default function Privacy() {
  return (
    <LegalDocument
      eyebrow="PRIVACY · GYANIX AI SOLUTIONS"
      title="Privacy Policy"
      summary="This policy describes the personal and learning information processed when students, teachers and administrators use VidyaAI."
      icon="lock"
      sections={sections}
    >
      <section id="scope">
        <h2>1. Scope and responsibility</h2>
        <p>This Privacy Policy applies to VidyaAI, a product operated by Gyanix AI Solutions. It covers the public website, student and teacher workspaces, administrative tools, support communications and the AI-assisted features described below.</p>
        <p>Gyanix AI Solutions is responsible for deciding why and how information is processed for VidyaAI. Privacy questions and requests may be sent to <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>.</p>
      </section>

      <section id="collection">
        <h2>2. Information we process</h2>
        <h3>Information you provide</h3>
        <ul>
          <li>profile and access details such as name, email address, selected role, class and learning medium;</li>
          <li>questions, prompts, teacher instructions, syllabus details, notes and other text entered into VidyaAI;</li>
          <li>quiz answers, feedback, selected subjects, learning preferences and support messages;</li>
          <li>information included voluntarily in any message sent to our official email address.</li>
        </ul>

        <h3>Learning and usage records</h3>
        <ul>
          <li>AI answers and cited sources associated with a question;</li>
          <li>quiz questions, selected answers, correct answers, scores, completion status and timestamps;</li>
          <li>subjects, topics, weak-topic signals, streaks, targets and estimated learning insights;</li>
          <li>teacher-generated curriculum, lesson and assessment resources saved in the browser;</li>
          <li>feedback records and operational metadata used to investigate quality.</li>
        </ul>

        <h3>Technical information</h3>
        <p>Our servers and network software may process IP address, request path, timestamps, browser/device information, error details and related security logs. We do not currently use advertising trackers, payment collection, precise location, microphone or camera features.</p>
      </section>

      <section id="use">
        <h2>3. How information is used</h2>
        <p>We use information to:</p>
        <ul>
          <li>provide student, teacher and administrator features;</li>
          <li>generate responses, quizzes, lesson plans, curriculum plans and assessment drafts;</li>
          <li>retrieve relevant educational material and maintain conversation context;</li>
          <li>calculate quiz progress, weak-topic indicators and learning insights;</li>
          <li>maintain, troubleshoot, protect and understand the service;</li>
          <li>respond to support, privacy and product-feedback requests;</li>
          <li>review quality and create human-reviewed product-improvement candidates;</li>
          <li>comply with applicable legal obligations and lawful requests.</li>
        </ul>
      </section>

      <section id="ai-providers">
        <h2>4. AI and service providers</h2>
        <p>VidyaAI currently uses Groq-hosted AI models. Relevant prompt text, selected subject or class, retrieved educational excerpts, recent conversation context, teacher instructions and certain learning signals may be sent to Groq to produce a requested result.</p>
        <p>We do not deliberately attach account names or email addresses to AI prompts, but personal information typed inside a question, note or instruction may be transmitted as part of that text. Please avoid entering information that is unnecessary for the educational request.</p>
        <p>We also rely on hosting, database, networking and software providers to operate VidyaAI. Those providers process information on our behalf or under their own applicable terms. We may disclose information when required by law, to respond to a valid legal process, or to protect users and the service.</p>
      </section>

      <section id="review">
        <h2>5. Admin review and product improvement</h2>
        <p>Authorised VidyaAI administrators can access operational and learning information such as profile details, recent questions, subjects, quiz metrics, feedback and weak-topic signals for support, moderation, analytics and product-quality work.</p>
        <p>Stored conversations may be copied into a candidate review workflow. Some identifiers, including the internal student identifier and common email or mobile-number patterns, are minimised in that workflow; however, free text may still contain information supplied by the user. Approved administrators may also export reviewed examples or question-and-answer records for improvement work.</p>
        <div className="legal-callout"><strong>No automatic model retraining:</strong> A conversation does not automatically change AI model weights. Interaction records may instead become candidates for authorised human review and controlled improvement workflows.</div>
      </section>

      <section id="browser-storage">
        <h2>6. Browser storage and cookies</h2>
        <p>The current VidyaAI application does not use advertising cookies. It uses browser local storage to keep an access token, selected role, language and study preferences, and—in the teacher workspace—a limited history of generated resources.</p>
        <p>Logging out removes the current access token and role, but some preferences or locally saved resources may remain on that device until you clear VidyaAI site data in the browser. Clearing site data can remove this information and may sign you out.</p>
      </section>

      <section id="children">
        <h2>7. Children and parental involvement</h2>
        <p>VidyaAI is designed for school education and may be used by people under 18. A parent, lawful guardian, teacher or authorised school should supervise use and ensure that any permission required by applicable law has been obtained.</p>
        <p>We do not currently use targeted advertising or behavioural advertising directed at children. Parents or guardians may contact us to ask what information is associated with a child, request correction or deletion where applicable, or raise a safety concern.</p>
        <p>An in-product age-verification and parental-consent workflow is not currently available. If verifiable parental consent is required for a child’s use, contact <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> before the child uses the service.</p>
      </section>

      <section id="retention">
        <h2>8. Retention and deletion</h2>
        <p>We keep information for as long as reasonably needed to provide VidyaAI, maintain learning history, protect the service, investigate issues, improve quality and meet legal requirements. Different records may therefore be retained for different periods.</p>
        <p>VidyaAI does not currently provide a self-service privacy dashboard or automated retention scheduler. Eligible access, correction and deletion requests are handled through our official email. Some information may remain temporarily in backups, security records, reviewed improvement datasets or records that must be retained by law.</p>
      </section>

      <section id="security">
        <h2>9. Security</h2>
        <p>We use technical and organisational measures intended to limit unauthorised access, alteration and disclosure, including access restrictions for administrative functions and separation of application services. No website, transmission or storage system can be guaranteed completely secure.</p>
        <p>Never send passwords, payment-card data, Aadhaar details or other unnecessary sensitive information through a VidyaAI prompt or ordinary email. If you believe data or an account has been exposed, contact us promptly.</p>
      </section>

      <section id="rights">
        <h2>10. Your choices and rights</h2>
        <p>Subject to applicable law, you may ask us to provide information about personal data we process, correct inaccurate information, erase eligible information, withdraw consent for future processing, or address a grievance.</p>
        <p>Send a request from the email address associated with your use to <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> with the subject “VidyaAI Privacy Request”. We may ask for reasonable information to verify identity and authority, especially for a request made for a child.</p>
      </section>

      <section id="transfers">
        <h2>11. Processing locations</h2>
        <p>VidyaAI and its providers may process information on servers located in India or other countries, depending on service infrastructure. Where applicable, we will handle cross-border processing in accordance with legal restrictions and provider commitments.</p>
      </section>

      <section id="updates">
        <h2>12. Updates and contact</h2>
        <p>We may update this policy when VidyaAI features, providers or legal obligations change. The version and effective date at the top identify the currently published policy, and earlier versions should be retained for reference.</p>
        <p>For privacy questions, data requests or grievances, email <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>. For other enquiries, use our <Link to="/contact">Contact page</Link>.</p>
      </section>
    </LegalDocument>
  );
}
