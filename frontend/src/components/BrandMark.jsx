export default function BrandMark({ compact = false }) {
  return (
    <div className={`brand-lockup${compact ? " compact" : ""}`}>
      <div className={`brand-mark${compact ? " small" : ""}`} aria-hidden="true">
        <span>वि</span>
      </div>
      <div className="brand-copy">
        <p>VidyaAI</p>
        <h2>आपका स्मार्ट पढ़ाई साथी</h2>
      </div>
    </div>
  );
}