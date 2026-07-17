import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import BrandMark from "../components/BrandMark";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", new URLSearchParams({ username: email, password, role }));
      localStorage.setItem("vidyaai_token", response.data.access_token);
      localStorage.setItem("vidyaai_role", response.data.role || role);
      navigate((response.data.role || role) === "teacher" ? "/teacher" : "/dashboard");
    } catch (err) {
      setError("Login failed. Please check credentials.");
    }
  };

  return (
    <div className="page-shell auth-shell">
      <section className="auth-showcase">
        <div className="brand-badge">विद्याAI</div>
        <BrandMark />
        <h1>पढ़ाई अब होगी आसान, साफ और छात्र-मित्र</h1>
        <p>
          हिंदी में समझो, अध्याय अनुसार पढ़ो, और परीक्षा के लिए तुरंत उपयोगी उत्तर पाओ।
        </p>
        <div className="auth-feature-list">
          <div>
            <strong>स्पष्ट उत्तर</strong>
            <span>सारांश, मुख्य बिंदु और प्रश्नोत्तर</span>
          </div>
          <div>
            <strong>कक्षा 10 केंद्रित</strong>
            <span>अध्याय आधारित हिंदी-अनुकूल पढ़ाई</span>
          </div>
          <div>
            <strong>तेज पुनरावृत्ति</strong>
            <span>परीक्षा से पहले quick revision style output</span>
          </div>
        </div>
      </section>

      <div className="auth-card light-card">
        <div className="auth-logo-row">
          <BrandMark compact />
          <div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>लॉगिन करें</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>आप VidyaAI का उपयोग कैसे करेंगे?</label>
          <div className="role-selector" role="radiogroup" aria-label="Account role">
            <button type="button" className={role === "student" ? "active" : ""} onClick={() => setRole("student")}>
              <span aria-hidden="true">🎓</span>
              <strong>Student</strong>
              <small>Learn and practise</small>
            </button>
            <button type="button" className={role === "teacher" ? "active" : ""} onClick={() => setRole("teacher")}>
              <span aria-hidden="true">📘</span>
              <strong>Teacher</strong>
              <small>Plan and teach</small>
            </button>
          </div>
          <label>ईमेल</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={role === "teacher" ? "teacher@example.com" : "student@example.com"} required />
          <label>पासवर्ड</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="अपना पासवर्ड लिखें" required />
          <button type="submit">लॉगिन</button>
          {error && <p className="error">{error}</p>}
        </form>

        <p className="auth-switch-text">
          नया अकाउंट बनाना है? <Link to="/register">रजिस्टर करें</Link>
        </p>
      </div>
    </div>
  );
}
