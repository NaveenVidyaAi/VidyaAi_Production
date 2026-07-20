import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BrandMark from "./BrandMark";
import Icon from "./Icon";
import SeoHead from "./SeoHead";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

export const OFFICIAL_EMAIL = "GyanixAiSolutions@gmail.com";

const navigation = [
  { to: "/cgbse-teacher-tools", en: "Teacher tools", hi: "शिक्षक टूल्स" },
  { to: "/about", en: "About", hi: "परिचय" },
  { to: "/contact", en: "Contact", hi: "संपर्क" },
  { to: "/terms", en: "Terms", hi: "शर्तें" },
  { to: "/privacy", en: "Privacy", hi: "गोपनीयता" },
  { to: "/ai-use", en: "AI Use", hi: "AI उपयोग" },
];

function PublicLink({ to, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => `public-nav-link${isActive ? " active" : ""}`}>
      {children}
    </NavLink>
  );
}

export default function PublicLayout({
  children,
  title = "Gyanix AI Solutions",
  description = "Learn about Gyanix AI Solutions, VidyaAI and our responsible approach to educational AI.",
  path,
  schema,
  robots,
}) {
  const location = useLocation();
  const { language, toggleLanguage } = usePublicLanguage();
  const isHindi = language === "hi";

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("public-main")?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="public-site">
      <SeoHead title={title} description={description} path={path || location.pathname} schema={schema} robots={robots} language={language} />
      <a className="public-skip-link" href="#public-main">{isHindi ? "मुख्य सामग्री पर जाएँ" : "Skip to main content"}</a>

      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand-link" aria-label="VidyaAI home">
            <BrandMark compact tagline="by Gyanix AI Solutions" taglineElement="span" />
          </Link>

          <nav className="public-nav" aria-label="Company and legal navigation">
            {navigation.map((item) => <PublicLink key={item.to} to={item.to}>{item[language]}</PublicLink>)}
            <button
              type="button"
              className={`public-language-switch ${language}`}
              onClick={toggleLanguage}
              aria-label={language === "en" ? "हिंदी में बदलें" : "Switch to English"}
              title={language === "en" ? "हिंदी में बदलें" : "Switch to English"}
            >
              <span lang="hi">हि</span><span lang="en">EN</span>
            </button>
          </nav>

          <Link className="public-app-link" to="/login">
            {isHindi ? "VidyaAI खोलें" : "Open VidyaAI"} <Icon name="arrowRight" size={17} />
          </Link>
        </div>
      </header>

      <main id="public-main" className="public-main" tabIndex="-1">{children}</main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="public-footer-brand">
            <BrandMark compact tagline="A Gyanix AI Solutions product" taglineElement="span" />
            <p>{isHindi ? "सीखने को अधिक स्पष्ट, उपयोगी और सुलभ बनाने के लिए जिम्मेदार AI टूल्स।" : "Responsible AI tools designed to make learning clearer, more useful and more accessible."}</p>
          </div>

          <div className="public-footer-column">
            <strong>{isHindi ? "संसाधन" : "Resources"}</strong>
            <Link to="/cgbse-teacher-tools">{isHindi ? "शिक्षक टूल्स" : "Teacher tools"}</Link>
            <Link to="/login">{isHindi ? "विद्यार्थी कार्यक्षेत्र" : "Student workspace"}</Link>
          </div>

          <div className="public-footer-column">
            <strong>{isHindi ? "कंपनी" : "Company"}</strong>
            <Link to="/about">{isHindi ? "हमारे बारे में" : "About us"}</Link>
            <Link to="/contact">{isHindi ? "संपर्क" : "Contact"}</Link>
            <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>
          </div>

          <div className="public-footer-column">
            <strong>{isHindi ? "कानूनी" : "Legal"}</strong>
            <Link to="/terms">{isHindi ? "नियम और शर्तें" : "Terms & Conditions"}</Link>
            <Link to="/privacy">{isHindi ? "गोपनीयता नीति" : "Privacy Policy"}</Link>
            <Link to="/ai-use">{isHindi ? "जिम्मेदार AI उपयोग" : "Responsible AI Use"}</Link>
          </div>
        </div>
        <div className="public-footer-bottom">
          <span>© {new Date().getFullYear()} Gyanix AI Solutions. {isHindi ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}</span>
          <span>{isHindi ? "VidyaAI एक स्वतंत्र शैक्षिक प्रौद्योगिकी उत्पाद है।" : "VidyaAI is an independent educational technology product."}</span>
        </div>
      </footer>
    </div>
  );
}
