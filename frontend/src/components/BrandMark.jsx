export default function BrandMark({ compact = false, tone = "student", tagline = "आपका स्मार्ट पढ़ाई साथी" }) {
  return (
    <div className={`brand-lockup brand-lockup-${tone}${compact ? " compact" : ""}`}>
      <div className={`brand-mark${compact ? " small" : ""}`} aria-hidden="true">
        <span>वि</span>
      </div>
      <div className="brand-copy">
        <p>VidyaAI</p>
        <h2>{tagline}</h2>
      </div>
    </div>
  );
}
