import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import BrandMark from "../components/BrandMark";
import CompanyLegalFooter from "../components/CompanyLegalFooter";
import Icon from "../components/Icon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const selectRole = (nextRole) => {
    setRole(nextRole);
    if (error) setError("");
  };

  const updateEmail = (event) => {
    setEmail(event.target.value);
    if (error) setError("");
  };

  const updatePassword = (event) => {
    setPassword(event.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", new URLSearchParams({ username: email, password, role }));
      localStorage.setItem("vidyaai_token", response.data.access_token);
      localStorage.setItem("vidyaai_role", response.data.role || role);
      navigate((response.data.role || role) === "teacher" ? "/teacher" : "/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`register-experience login-experience register-role-${role}`}>
      <div className="register-ambient" aria-hidden="true">
        <span className="register-orb register-orb-one" />
        <span className="register-orb register-orb-two" />
        <span className="register-orb register-orb-three" />
        <span className="register-grid" />
      </div>

      <header className="register-topbar">
        <div className="register-brand"><BrandMark compact tagline="आपका स्मार्ट पढ़ाई साथी" /></div>
        <p>
          VidyaAI पर नए हैं?
          <Link to="/register">अकाउंट बनाएँ <Icon name="arrowRight" size={16} /></Link>
        </p>
      </header>

      <main className="register-layout">
        <section className="register-story" aria-labelledby="login-story-title">
          <div className="register-kicker"><Icon name="sparkle" size={17} /><span>WELCOME BACK TO VIDYAAI</span></div>
          <h1 id="login-story-title">अपनी तैयारी वहीं से <span>आगे बढ़ाएँ।</span></h1>
          <p className="register-story-copy">
            आपके notes, learning context और teaching tools तैयार हैं। अपनी भूमिका चुनें और अपने workspace में वापस आएँ।
          </p>

          <div className="register-role-preview" aria-live="polite">
            <div className="register-preview-icon" aria-hidden="true"><Icon name={role === "teacher" ? "teacher" : "student"} size={25} /></div>
            <div>
              <small>{role === "teacher" ? "TEACHER WORKSPACE" : "STUDENT WORKSPACE"}</small>
              <strong>{role === "teacher" ? "आज की कक्षा के लिए सब कुछ तैयार रखें" : "अपनी पढ़ाई की लय फिर से पाएँ"}</strong>
              <span>{role === "teacher" ? "Lesson planning, assessments और AI teaching support वहीं से जारी रखें।" : "Personalised answers, revision और PYQ practice वहीं से जारी रखें।"}</span>
            </div>
          </div>

          <div className="register-benefits" aria-label="VidyaAI login benefits">
            <div><span><Icon name="check" size={17} /></span><p><strong>Your context</strong><small>प्रोफाइल के अनुसार अनुभव</small></p></div>
            <div><span><Icon name="shield" size={17} /></span><p><strong>Secure access</strong><small>सुरक्षित workspace login</small></p></div>
            <div><span><Icon name="sparkle" size={17} /></span><p><strong>Resume instantly</strong><small>बिना किसी अतिरिक्त setup</small></p></div>
          </div>
        </section>

        <section className="register-glass-card login-glass-card" aria-labelledby="login-form-title">
          <div className="register-card-head">
            <span className="register-step">WELCOME BACK</span>
            <h2 id="login-form-title">अपने workspace में लॉगिन करें</h2>
            <p>अपनी भूमिका और अकाउंट की जानकारी भरें।</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form login-form" aria-busy={loading}>
            <fieldset className="register-role-fieldset">
              <legend id="login-role-label">मैं VidyaAI का उपयोग करता/करती हूँ</legend>
              <div className="register-role-selector" role="radiogroup" aria-labelledby="login-role-label">
                <button type="button" role="radio" aria-checked={role === "student"} className={role === "student" ? "active" : ""} onClick={() => selectRole("student")}>
                  <span aria-hidden="true"><Icon name="student" size={21} /></span><strong>Student</strong><small>Learn & practise</small><i aria-hidden="true"><Icon name="check" size={14} /></i>
                </button>
                <button type="button" role="radio" aria-checked={role === "teacher"} className={role === "teacher" ? "active" : ""} onClick={() => selectRole("teacher")}>
                  <span aria-hidden="true"><Icon name="teacher" size={21} /></span><strong>Teacher</strong><small>Plan & teach</small><i aria-hidden="true"><Icon name="check" size={14} /></i>
                </button>
              </div>
            </fieldset>

            <div className="register-field">
              <label htmlFor="login-email">ईमेल एड्रेस</label>
              <input id="login-email" value={email} onChange={updateEmail} type="email" inputMode="email" autoComplete="email" placeholder={role === "teacher" ? "teacher@example.com" : "student@example.com"} required />
            </div>
            <div className="register-field">
              <label htmlFor="login-password">पासवर्ड</label>
              <div className="register-password-field">
                <input id="login-password" value={password} onChange={updatePassword} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="अपना पासवर्ड लिखें" required />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}><Icon name={showPassword ? "eyeOff" : "eye"} size={19} /></button>
              </div>
            </div>

            {error && <p className="register-error" role="alert">{error}</p>}
            <button type="submit" className="register-submit" disabled={loading}>
              {loading && <span className="register-submit-loader" aria-hidden="true" />}
              <span>{loading ? "लॉगिन हो रहा है…" : "सुरक्षित लॉगिन"}</span>
              {!loading && <Icon name="arrowRight" size={18} />}
            </button>
            <p className="register-consent"><Icon name="shield" size={15} /> आपकी login जानकारी सुरक्षित रूप से भेजी जाती है।</p>
          </form>

          <p className="register-mobile-login">नया अकाउंट बनाना है? <Link to="/register">रजिस्टर करें</Link></p>
        </section>
      </main>

      <CompanyLegalFooter className="auth-public-footer" />
    </div>
  );
}
