export default function BrandMark({ compact = false, tone = "student", tagline = "आपका स्मार्ट पढ़ाई साथी", taglineElement = "h2" }) {
  const TaglineElement = taglineElement;
  return (
    <div className={`brand-lockup brand-lockup-${tone}${compact ? " compact" : ""}`}>
      <div className={`brand-mark${compact ? " small" : ""}`} aria-hidden="true">
        <span>वि</span>
      </div>
      <div className="brand-copy">
        <p>VidyaAI</p>
        <TaglineElement className="brand-tagline">{tagline}</TaglineElement>
      </div>
    </div>
  );
}
