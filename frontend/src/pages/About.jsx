import { Link } from "react-router-dom";
import PublicLayout, { OFFICIAL_EMAIL } from "../components/PublicLayout";
import Icon from "../components/Icon";

const principles = [
  { icon: "brain", title: "Human-centred AI", copy: "Technology should strengthen understanding and judgment, not replace the people who teach and learn." },
  { icon: "shield", title: "Responsible by design", copy: "Clear limitations, careful data practices and human review belong inside the product—not in the fine print." },
  { icon: "code", title: "Built for real use", copy: "We focus on dependable software that turns modern AI into practical, accessible everyday workflows." },
];

export default function About() {
  return (
    <PublicLayout
      title="About Gyanix AI Solutions & VidyaAI"
      description="Meet Gyanix AI Solutions, learn about VidyaAI, and discover the applied-AI vision of founder and CEO Naveen Chandrawanshi."
    >
      <section className="about-hero public-section" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <p className="public-eyebrow">ABOUT GYANIX AI SOLUTIONS</p>
          <h1 id="about-title">Practical intelligence.<br /><span>Meaningful impact.</span></h1>
          <p>Gyanix AI Solutions builds thoughtful AI-powered products that simplify complex work and help people make better use of information. VidyaAI is our education-focused product, created to make high-quality learning support more accessible to students and teachers.</p>
          <div className="public-hero-actions">
            <Link className="public-primary-button" to="/contact">Talk to us <Icon name="arrowRight" size={18} /></Link>
            <a className="public-secondary-button" href={`mailto:${OFFICIAL_EMAIL}`}><Icon name="mail" size={18} /> {OFFICIAL_EMAIL}</a>
          </div>
        </div>
        <div className="company-logo-card" aria-label="Gyanix AI Solutions official logo">
          <img src="/brand/gyanix-ai-solutions-logo.png" alt="Gyanix AI Solutions" width="1024" height="1024" />
          <p><span>Company</span><strong>Gyanix AI Solutions</strong></p>
        </div>
      </section>

      <section className="product-story public-section" aria-labelledby="vidyaai-story-title">
        <div className="product-story-label">
          <span aria-hidden="true">वि</span>
          <p>OUR EDUCATION PRODUCT</p>
        </div>
        <div>
          <h2 id="vidyaai-story-title">Meet VidyaAI</h2>
          <p>VidyaAI is an AI learning and teaching workspace designed around the needs of CGBSE students and educators. It brings curriculum-aware assistance, bilingual learning support, practice resources, model papers and teacher planning tools into one focused experience.</p>
          <p>Our goal is not to replace teachers or traditional learning. It is to give every learner clearer explanations, more useful practice and a better way to continue learning—while giving teachers dependable tools they can review and adapt.</p>
        </div>
      </section>

      <section className="founder-section public-section" aria-labelledby="founder-title">
        <div className="founder-photo-wrap">
          <div className="founder-photo-accent" aria-hidden="true" />
          <img src="/brand/naveen-chandrawanshi-founder.jpeg" alt="Naveen Chandrawanshi, Founder and CEO of Gyanix AI Solutions" width="472" height="590" loading="lazy" />
        </div>
        <div className="founder-copy">
          <p className="public-eyebrow">FOUNDER & CEO</p>
          <h2 id="founder-title">Naveen Chandrawanshi</h2>
          <h3>Senior Software Engineer · Applied AI Builder</h3>
          <p>Naveen works at the intersection of software engineering and applied artificial intelligence. His focus includes generative AI, retrieval-augmented systems, multilingual experiences and production software that turns advanced technology into simple, reliable tools.</p>
          <p>He founded Gyanix AI Solutions with a belief that useful AI should be understandable, responsible and built around genuine human needs. VidyaAI carries that belief into education.</p>
          <blockquote>
            <Icon name="quote" size={27} />
            <p>“AI should not replace human potential; it should remove the barriers that keep people from reaching it.”</p>
            <cite>— Naveen Chandrawanshi</cite>
          </blockquote>
        </div>
      </section>

      <section className="principles-section public-section" aria-labelledby="principles-title">
        <div className="public-section-heading">
          <p className="public-eyebrow">HOW WE BUILD</p>
          <h2 id="principles-title">Principles behind our products</h2>
        </div>
        <div className="principles-grid">
          {principles.map((principle) => (
            <article key={principle.title}>
              <span aria-hidden="true"><Icon name={principle.icon} size={23} /></span>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-cta public-section">
        <div><p className="public-eyebrow">LET'S BUILD SOMETHING USEFUL</p><h2>Have a question about Gyanix or VidyaAI?</h2></div>
        <Link className="public-primary-button" to="/contact">Contact us <Icon name="arrowRight" size={18} /></Link>
      </section>
    </PublicLayout>
  );
}
