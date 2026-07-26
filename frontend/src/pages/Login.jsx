import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();
  const enter = reduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } };
  const stagger = {
    animate: { transition: { staggerChildren: reduceMotion ? 0 : 0.09, delayChildren: reduceMotion ? 0 : 0.12 } },
  };
  const staggerItem = reduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.42, ease: "easeOut" } };

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
      if ((response.data.role || role) === "student") {
        localStorage.setItem("vidyaai_student_lang", "hi");
        localStorage.setItem("vidyaai_student_answer_style", "default");
      }
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
        <motion.span className="register-orb register-orb-one" animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, -14, 0], scale: [1, 1.05, 1] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} />
        <motion.span className="register-orb register-orb-two" animate={reduceMotion ? undefined : { x: [0, -16, 0], y: [0, 20, 0], scale: [1, 0.96, 1] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }} />
        <motion.span className="register-orb register-orb-three" animate={reduceMotion ? undefined : { y: [0, -12, 0], opacity: [0.55, 0.8, 0.55] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
        <span className="register-grid" />
      </div>

      <motion.header className="register-topbar" {...enter}>
        <div className="register-brand"><BrandMark compact tagline="आपका स्मार्ट पढ़ाई साथी" /></div>
        <p>
          VidyaAI पर नए हैं?
          <Link to="/register">अकाउंट बनाएँ <Icon name="arrowRight" size={16} /></Link>
        </p>
      </motion.header>

      <main className="register-layout">
        <motion.section className="register-story login-motion-story" aria-labelledby="login-story-title" {...enter} variants={stagger}>
          <div className="register-kicker"><Icon name="sparkle" size={17} /><span>WELCOME BACK TO VIDYAAI</span></div>
          <h1 id="login-story-title">अपनी तैयारी वहीं से <span>आगे बढ़ाएँ।</span></h1>
          <p className="register-story-copy">
            आपके notes, learning context और teaching tools तैयार हैं। अपनी भूमिका चुनें और अपने workspace में वापस आएँ।
          </p>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={role} className="register-role-preview" aria-live="polite" initial={reduceMotion ? false : { opacity: 0, x: role === "teacher" ? 18 : -18 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: role === "teacher" ? -12 : 12 }} transition={{ duration: 0.24, ease: "easeOut" }}>
              <motion.div className="register-preview-icon" aria-hidden="true" initial={reduceMotion ? false : { rotate: -8, scale: 0.86 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}><Icon name={role === "teacher" ? "teacher" : "student"} size={25} /></motion.div>
              <div>
                <small>{role === "teacher" ? "TEACHER WORKSPACE" : "STUDENT WORKSPACE"}</small>
                <strong>{role === "teacher" ? "आज की कक्षा के लिए सब कुछ तैयार रखें" : "अपनी पढ़ाई की लय फिर से पाएँ"}</strong>
                <span>{role === "teacher" ? "Lesson planning, assessments और AI teaching support वहीं से जारी रखें।" : "Personalised answers, revision और PYQ practice वहीं से जारी रखें।"}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.div className="register-benefits" aria-label="VidyaAI login benefits" variants={stagger} initial="initial" animate="animate">
            <motion.div variants={staggerItem}><span><Icon name="check" size={17} /></span><p><strong>Your context</strong><small>प्रोफाइल के अनुसार अनुभव</small></p></motion.div>
            <motion.div variants={staggerItem}><span><Icon name="shield" size={17} /></span><p><strong>Secure access</strong><small>सुरक्षित workspace login</small></p></motion.div>
            <motion.div variants={staggerItem}><span><Icon name="sparkle" size={17} /></span><p><strong>Resume instantly</strong><small>बिना किसी अतिरिक्त setup</small></p></motion.div>
          </motion.div>
        </motion.section>

        <motion.section className="register-glass-card login-glass-card" aria-labelledby="login-form-title" {...enter} transition={{ ...enter.transition, delay: reduceMotion ? 0 : 0.12 }}>
          <div className="register-card-head">
            <span className="register-step">WELCOME BACK</span>
            <h2 id="login-form-title">अपने workspace में लॉगिन करें</h2>
            <p>अपनी भूमिका और अकाउंट की जानकारी भरें।</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form login-form" aria-busy={loading}>
            <fieldset className="register-role-fieldset">
              <legend id="login-role-label">मैं VidyaAI का उपयोग करता/करती हूँ</legend>
              <div className="register-role-selector" role="radiogroup" aria-labelledby="login-role-label">
                <motion.button type="button" role="radio" aria-checked={role === "student"} className={role === "student" ? "active" : ""} onClick={() => selectRole("student")} whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                  <span aria-hidden="true"><Icon name="student" size={21} /></span><strong>Student</strong><small>Learn & practise</small><i aria-hidden="true"><Icon name="check" size={14} /></i>
                </motion.button>
                <motion.button type="button" role="radio" aria-checked={role === "teacher"} className={role === "teacher" ? "active" : ""} onClick={() => selectRole("teacher")} whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                  <span aria-hidden="true"><Icon name="teacher" size={21} /></span><strong>Teacher</strong><small>Plan & teach</small><i aria-hidden="true"><Icon name="check" size={14} /></i>
                </motion.button>
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

            <AnimatePresence>{error && <motion.p className="register-error" role="alert" initial={reduceMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>}</AnimatePresence>
            <motion.button type="submit" className="register-submit" disabled={loading} whileHover={loading || reduceMotion ? undefined : { y: -2, scale: 1.01 }} whileTap={loading || reduceMotion ? undefined : { scale: 0.985 }}>
              {loading && <span className="register-submit-loader" aria-hidden="true" />}
              <span>{loading ? "लॉगिन हो रहा है…" : "सुरक्षित लॉगिन"}</span>
              {!loading && <Icon name="arrowRight" size={18} />}
            </motion.button>
            <p className="register-consent"><Icon name="shield" size={15} /> आपकी login जानकारी सुरक्षित रूप से भेजी जाती है।</p>
          </form>

          <p className="register-mobile-login">नया अकाउंट बनाना है? <Link to="/register">रजिस्टर करें</Link></p>
        </motion.section>
      </main>

      <CompanyLegalFooter className="auth-public-footer" />
    </div>
  );
}
