import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import Icon from "../components/Icon";

const capabilities = [
  ["brain", "Curriculum-aware answers", "Ask questions in Hindi or English and receive explanations supported by the CGBSE learning material available to VidyaAI."],
  ["document", "Model papers and PYQs", "Open subject-wise Class 10 model papers and previous-year question papers for focused board-exam practice."],
  ["code", "Teacher planning tools", "Draft editable curriculum plans, lesson plans and printable question papers, then review and adapt them for your classroom."],
];

export default function Home() {
  const origin = window.location.origin;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Gyanix AI Solutions",
      url: `${origin}/about`,
      logo: `${origin}/brand/gyanix-ai-solutions-logo.png`,
      founder: { "@type": "Person", name: "Naveen Chandrawanshi" },
      email: "GyanixAiSolutions@gmail.com",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "VidyaAI",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: `${origin}/`,
      description: "A bilingual, curriculum-aware AI learning and teaching workspace for CGBSE Class 10 students and educators.",
      creator: { "@type": "Organization", name: "Gyanix AI Solutions" },
    },
  ];

  return (
    <PublicLayout
      title="CGBSE Class 10 AI Learning Assistant | VidyaAI"
      description="Study CGBSE Class 10 in Hindi or English with curriculum-aware AI help, model papers and PYQs. Teachers can create editable lessons and question papers."
      path="/"
      schema={schema}
    >
      <section className="seo-home-hero public-section" aria-labelledby="home-title">
        <div>
          <p className="public-eyebrow">CGBSE CLASS 10 · STUDENTS & TEACHERS</p>
          <h1 id="home-title">CGBSE learning support that understands your curriculum.</h1>
          <p className="seo-home-lead">VidyaAI brings curriculum-aware explanations, Hindi and English learning support, authentic practice resources and teacher planning tools into one focused workspace.</p>
          <div className="public-hero-actions">
            <Link className="public-primary-button" to="/login">Open VidyaAI <Icon name="arrowRight" size={18} /></Link>
            <Link className="public-secondary-button" to="/cgbse-class-10-model-papers">Browse free model papers</Link>
          </div>
          <p className="seo-trust-note"><Icon name="shield" size={18} /> AI output is designed for learning support and should be checked against official CGBSE material and teacher guidance.</p>
        </div>
        <div className="seo-hero-card" aria-label="VidyaAI learning workflow">
          <span className="seo-hero-mark" aria-hidden="true">वि</span>
          <p>Ask in your language</p><strong>समझें · अभ्यास करें · पढ़ाएँ</strong>
          <ul><li>Curriculum-grounded support</li><li>Class 10 model papers and PYQs</li><li>Editable resources for teachers</li></ul>
        </div>
      </section>

      <section className="seo-capabilities public-section" aria-labelledby="capabilities-title">
        <div className="public-section-heading"><p className="public-eyebrow">ONE EDUCATION WORKSPACE</p><h2 id="capabilities-title">How VidyaAI supports CGBSE preparation</h2><p>Every feature is organised around practical study and classroom workflows—not generic chat alone.</p></div>
        <div className="seo-card-grid">
          {capabilities.map(([icon, title, copy]) => <article key={title}><span aria-hidden="true"><Icon name={icon} size={23} /></span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="seo-split public-section" aria-labelledby="students-title">
        <div><p className="public-eyebrow">FOR STUDENTS</p><h2 id="students-title">Move from a question to real understanding</h2><p>Students can ask subject questions, revise weak concepts and practise with board-style material. VidyaAI retrieves relevant educational context before generating an answer, helping responses stay connected to the selected class and subject.</p><p>The workspace also makes previous papers easier to discover. Instead of searching through scattered files, learners can open the available Class 10 Science, Mathematics, Hindi, English, Sanskrit and Social Science papers from a single library.</p><Link className="public-text-link" to="/cgbse-class-10-model-papers">Explore Class 10 papers <Icon name="arrowRight" size={16} /></Link></div>
        <div><p className="public-eyebrow">FOR TEACHERS</p><h2>Prepare resources you can review and edit</h2><p>Teachers can create curriculum plans, lesson plans and question-paper drafts using selected chapters, question sections, mark allocations and their own instructions. Generated papers remain editable so teachers keep control over wording, difficulty and classroom suitability.</p><p>VidyaAI is an assistant, not an examination authority. Teachers should verify factual accuracy, syllabus alignment, fairness and answer keys before using generated material with learners.</p><Link className="public-text-link" to="/cgbse-teacher-tools">See teacher tools <Icon name="arrowRight" size={16} /></Link></div>
      </section>

      <section className="seo-grounding public-section" aria-labelledby="grounding-title">
        <div><p className="public-eyebrow">BUILT FOR RESPONSIBLE USE</p><h2 id="grounding-title">What “curriculum-aware” means</h2></div>
        <div><p>VidyaAI uses retrieval-augmented generation: it searches the educational sources available in its knowledge base and supplies relevant excerpts to the AI model as context. This is intended to make answers more useful for the chosen CGBSE subject and workflow.</p><p>No generative system is perfectly accurate. Important answers must still be compared with official textbooks, curriculum documents, model papers and teacher guidance. We explain these limits openly in our <Link to="/ai-use">Responsible AI Use Policy</Link>.</p></div>
      </section>

      <section className="public-cta public-section"><div><p className="public-eyebrow">START WITH VIDYAAI</p><h2>Learn, practise or prepare your next class.</h2></div><Link className="public-primary-button" to="/login">Continue to sign in <Icon name="arrowRight" size={18} /></Link></section>
    </PublicLayout>
  );
}
