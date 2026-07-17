import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import BrandMark from "../components/BrandMark";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", class_level: "10", medium: "Hindi", role: "student" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Try again.");
    }
  };

  return (
    <div className="page-shell auth-shell">
      <section className="auth-showcase auth-showcase-register">
        <div className="brand-badge">विद्याAI</div>
        <BrandMark />
        <h1>अपनी पढ़ाई की प्रोफाइल बनाइए</h1>
        <p>
          रजिस्टर करने के बाद उत्तर आपकी कक्षा, माध्यम और सीखने की जरूरत के हिसाब से और बेहतर मिलेंगे।
        </p>
        <div className="auth-feature-list two-col">
          <div>
            <strong>व्यक्तिगत उत्तर</strong>
            <span>कक्षा और माध्यम के अनुसार</span>
          </div>
          <div>
            <strong>अध्याय आधारित तैयारी</strong>
            <span>सारांश, प्रश्नोत्तर और अभ्यास</span>
          </div>
          <div>
            <strong>हल्का डिज़ाइन</strong>
            <span>आँखों के लिए आरामदायक interface</span>
          </div>
          <div>
            <strong>परीक्षा पर फोकस</strong>
            <span>2 अंक, 5 अंक और quick revision style</span>
          </div>
        </div>
      </section>

      <div className="auth-card light-card register-card">
        <div className="auth-logo-row">
          <BrandMark compact />
          <div>
            <p className="eyebrow">CREATE ACCOUNT</p>
            <h2>रजिस्टर करें</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form auth-grid-form">
          <div className="role-selector span-two" role="radiogroup" aria-label="Account role">
            <button type="button" className={form.role === "student" ? "active" : ""} onClick={() => setForm({ ...form, role: "student" })}>
              <span aria-hidden="true">🎓</span><strong>Student</strong><small>Learn and practise</small>
            </button>
            <button type="button" className={form.role === "teacher" ? "active" : ""} onClick={() => setForm({ ...form, role: "teacher" })}>
              <span aria-hidden="true">📘</span><strong>Teacher</strong><small>Plan and teach</small>
            </button>
          </div>
          <label>नाम</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="अपना नाम लिखें" required />
          <label>ईमेल</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="student@example.com" required />
          <label>पासवर्ड</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="मजबूत पासवर्ड चुनें" required />
          <label>{form.role === "teacher" ? "मुख्य कक्षा" : "कक्षा"}</label>
          <select name="class_level" value={form.class_level} onChange={handleChange}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((level) => (
              <option key={level} value={String(level)}>{level}</option>
            ))}
          </select>
          <label>माध्यम</label>
          <select name="medium" value={form.medium} onChange={handleChange}>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
          </select>
          <button type="submit" className="span-two">रजिस्टर करें</button>
          {error && <p className="error">{error}</p>}
        </form>

        <p className="auth-switch-text">
          पहले से अकाउंट है? <Link to="/login">लॉगिन करें</Link>
        </p>
      </div>
    </div>
  );
}
