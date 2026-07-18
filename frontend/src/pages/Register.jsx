import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import BrandMark from "../components/BrandMark";
import CompanyLegalFooter from "../components/CompanyLegalFooter";
import Icon from "../components/Icon";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", class_level: "10", medium: "Hindi", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const selectRole = (role) => {
    setForm((current) => ({ ...current, role }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.detail || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`register-experience register-role-${form.role}`}>
      <div className="register-ambient" aria-hidden="true">
        <span className="register-orb register-orb-one" />
        <span className="register-orb register-orb-two" />
        <span className="register-orb register-orb-three" />
        <span className="register-grid" />
      </div>

      <header className="register-topbar">
        <div className="register-brand"><BrandMark compact tagline="आपका स्मार्ट पढ़ाई साथी" /></div>
        <p>
          पहले से अकाउंट है?
          <Link to="/login">लॉगिन करें <Icon name="arrowRight" size={16} /></Link>
        </p>
      </header>

      <main className="register-layout">
        <section className="register-story" aria-labelledby="register-story-title">
          <div className="register-kicker"><Icon name="sparkle" size={17} /><span>AI-POWERED LEARNING SPACE</span></div>
          <h1 id="register-story-title">सीखने और सिखाने की <span>बेहतर शुरुआत।</span></h1>
          <p className="register-story-copy">
            अपनी कक्षा, माध्यम और भूमिका चुनें। VidyaAI आपके लिए उसी पल एक व्यक्तिगत workspace तैयार कर देगा।
          </p>

          <div className="register-role-preview" aria-live="polite">
            <div className="register-preview-icon" aria-hidden="true"><Icon name={form.role === "teacher" ? "teacher" : "student"} size={25} /></div>
            <div>
              <small>{form.role === "teacher" ? "TEACHER WORKSPACE" : "STUDENT WORKSPACE"}</small>
              <strong>{form.role === "teacher" ? "योजना बनाएँ, पढ़ाएँ और प्रगति समझें" : "समझें, अभ्यास करें और आत्मविश्वास बढ़ाएँ"}</strong>
              <span>{form.role === "teacher" ? "AI lesson tools, curriculum planning और PYQ library एक जगह।" : "आपकी कक्षा और माध्यम के अनुसार उत्तर, revision और PYQ support।"}</span>
            </div>
          </div>

          <div className="register-benefits" aria-label="VidyaAI benefits">
            <div><span><Icon name="check" size={17} /></span><p><strong>Personalised</strong><small>आपकी प्रोफाइल के अनुसार</small></p></div>
            <div><span><Icon name="shield" size={17} /></span><p><strong>Simple & secure</strong><small>तेज और सुरक्षित शुरुआत</small></p></div>
            <div><span><Icon name="sparkle" size={17} /></span><p><strong>Ready instantly</strong><small>कोई जटिल setup नहीं</small></p></div>
          </div>
        </section>

        <section className="register-glass-card" aria-labelledby="register-form-title">
          <div className="register-card-head">
            <span className="register-step">ONE SIMPLE STEP</span>
            <h2 id="register-form-title">अपना VidyaAI अकाउंट बनाएँ</h2>
            <p>शुरू करने में एक मिनट से भी कम समय लगेगा।</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form" aria-busy={loading}>
            <fieldset className="register-role-fieldset">
              <legend id="register-role-label">मैं VidyaAI का उपयोग करूँगा/करूँगी</legend>
              <div className="register-role-selector" role="radiogroup" aria-labelledby="register-role-label">
                <button type="button" role="radio" aria-checked={form.role === "student"} className={form.role === "student" ? "active" : ""} onClick={() => selectRole("student")}>
                  <span aria-hidden="true"><Icon name="student" size={21} /></span><strong>Student</strong><small>Learn & practise</small><i aria-hidden="true"><Icon name="check" size={14} /></i>
                </button>
                <button type="button" role="radio" aria-checked={form.role === "teacher"} className={form.role === "teacher" ? "active" : ""} onClick={() => selectRole("teacher")}>
                  <span aria-hidden="true"><Icon name="teacher" size={21} /></span><strong>Teacher</strong><small>Plan & teach</small><i aria-hidden="true"><Icon name="check" size={14} /></i>
                </button>
              </div>
            </fieldset>

            <div className="register-form-grid">
              <div className="register-field">
                <label htmlFor="register-name">पूरा नाम</label>
                <input id="register-name" name="name" value={form.name} onChange={handleChange} autoComplete="name" placeholder="अपना नाम लिखें" required />
              </div>
              <div className="register-field">
                <label htmlFor="register-email">ईमेल एड्रेस</label>
                <input id="register-email" name="email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
              <div className="register-field register-field-wide">
                <label htmlFor="register-password">पासवर्ड</label>
                <div className="register-password-field">
                  <input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" aria-describedby="register-password-help" value={form.password} onChange={handleChange} placeholder="एक सुरक्षित पासवर्ड चुनें" required />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}><Icon name={showPassword ? "eyeOff" : "eye"} size={19} /></button>
                </div>
                <small id="register-password-help">ऐसा पासवर्ड चुनें जिसे केवल आप जानते हों।</small>
              </div>
              <div className="register-field">
                <label htmlFor="register-class">{form.role === "teacher" ? "मुख्य कक्षा" : "आपकी कक्षा"}</label>
                <select id="register-class" name="class_level" value={form.class_level} onChange={handleChange}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((level) => (
                    <option key={level} value={String(level)}>कक्षा {level}</option>
                  ))}
                </select>
              </div>
              <div className="register-field">
                <label htmlFor="register-medium">पढ़ाई का माध्यम</label>
                <select id="register-medium" name="medium" value={form.medium} onChange={handleChange}>
                  <option value="Hindi">हिंदी</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            {error && <p className="register-error" role="alert">{error}</p>}
            <button type="submit" className="register-submit" disabled={loading}>
              {loading && <span className="register-submit-loader" aria-hidden="true" />}
              <span>{loading ? "अकाउंट बन रहा है…" : "मेरा अकाउंट बनाएँ"}</span>
              {!loading && <Icon name="arrowRight" size={18} />}
            </button>
            <p className="register-consent"><Icon name="shield" size={15} /> जारी रखकर आप हमारी <Link to="/terms">शर्तों</Link>, <Link to="/privacy">Privacy Policy</Link> और <Link to="/ai-use">AI Use Policy</Link> से सहमत होते हैं।</p>
          </form>

          <p className="register-mobile-login">पहले से अकाउंट है? <Link to="/login">लॉगिन करें</Link></p>
        </section>
      </main>

      <CompanyLegalFooter className="auth-public-footer" />
    </div>
  );
}
