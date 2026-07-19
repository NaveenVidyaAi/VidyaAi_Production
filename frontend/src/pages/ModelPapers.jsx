import PublicLayout from "../components/PublicLayout";
import { assessmentPapers } from "../data/assessmentPapers";
import Icon from "../components/Icon";

export default function ModelPapers() {
  const models = assessmentPapers.filter((paper) => paper.kind === "model");
  const previous = assessmentPapers.filter((paper) => paper.kind === "pyq");
  const schema = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "CGBSE Class 10 Model Papers and Previous-Year Papers",
    url: `${window.location.origin}/cgbse-class-10-model-papers`,
    hasPart: assessmentPapers.map((paper) => ({ "@type": "DigitalDocument", name: paper.title, encodingFormat: "application/pdf", url: new URL(paper.fileUrl, window.location.origin).href })),
  };

  const PaperGrid = ({ papers }) => <div className="paper-resource-grid">{papers.map((paper) => <article key={paper.file}><p>{paper.subject}</p><h3>{paper.title}</h3><span>{paper.medium} · PDF</span><a href={paper.fileUrl} download>Download paper <Icon name="download" size={17} /></a></article>)}</div>;

  return (
    <PublicLayout title="CGBSE Class 10 Model Papers & PYQs | VidyaAI" description="Download CGBSE Class 10 model papers and previous-year question papers for Science, Maths, Hindi, English, Sanskrit and Social Science." path="/cgbse-class-10-model-papers" schema={schema}>
      <section className="resource-hero public-section"><p className="public-eyebrow">FREE CLASS 10 PRACTICE RESOURCES</p><h1>CGBSE Class 10 model papers and previous-year papers</h1><p>Use subject-wise model papers to understand the expected format, then practise with available previous-year question papers. All listed files open as PDFs and can be saved for study or classroom use.</p></section>
      <section className="paper-resource-section public-section" aria-labelledby="model-title"><div className="public-section-heading"><p className="public-eyebrow">2025–26</p><h2 id="model-title">Class 10 model question papers</h2><p>Model papers are available for the six core subjects listed below.</p></div><PaperGrid papers={models} /></section>
      <section className="paper-resource-section public-section" aria-labelledby="pyq-title"><div className="public-section-heading"><p className="public-eyebrow">BOARD PRACTICE</p><h2 id="pyq-title">Previous-year question papers</h2><p>Review question patterns across years and practise within the time and marks shown in each source paper.</p></div><PaperGrid papers={previous} /></section>
      <section className="seo-resource-note public-section"><h2>How to use these papers effectively</h2><p>First attempt a paper without notes and within the permitted time. Mark uncertain answers, compare them with your textbook or teacher guidance, and revise the underlying chapter before trying another paper. These files support preparation; always follow the latest official CGBSE notice and syllabus for your examination year.</p></section>
    </PublicLayout>
  );
}
