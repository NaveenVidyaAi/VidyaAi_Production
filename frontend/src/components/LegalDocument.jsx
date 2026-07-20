import PublicLayout from "./PublicLayout";
import Icon from "./Icon";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

export const POLICY_VERSION = "1.0.0";
export const POLICY_DATE = "18 July 2026";

export default function LegalDocument({ eyebrow, title, summary, icon = "document", sections, children }) {
  const { language } = usePublicLanguage();
  const isHindi = language === "hi";
  return (
    <PublicLayout title={title} description={summary}>
      <article className="legal-page">
        <header className="legal-hero">
          <div className="legal-hero-icon" aria-hidden="true"><Icon name={icon} size={27} /></div>
          <p className="public-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{summary}</p>
          <div className="legal-meta" aria-label={isHindi ? "नीति की जानकारी" : "Policy information"}>
            <span>{isHindi ? "संस्करण" : "Version"} {POLICY_VERSION}</span>
            <span>{isHindi ? "प्रभावी" : "Effective"} <time dateTime="2026-07-18">{isHindi ? "18 जुलाई 2026" : POLICY_DATE}</time></span>
          </div>
        </header>

        <div className="legal-layout">
          <aside className="legal-toc">
            <strong>{isHindi ? "इस पृष्ठ पर" : "On this page"}</strong>
            <nav aria-label={`${title} sections`}>
              {sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>
              ))}
            </nav>
          </aside>

          <div className="legal-content">{children}</div>
        </div>
      </article>
    </PublicLayout>
  );
}
