import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BrandMark from "./BrandMark";
import Icon from "./Icon";
import SeoHead from "./SeoHead";

export const OFFICIAL_EMAIL = "GyanixAiSolutions@gmail.com";

const navigation = [
  { to: "/cgbse-class-10-model-papers", label: "Papers" },
  { to: "/cgbse-teacher-tools", label: "Teacher tools" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/ai-use", label: "AI Use" },
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

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("public-main")?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="public-site">
      <SeoHead title={title} description={description} path={path || location.pathname} schema={schema} robots={robots} />
      <a className="public-skip-link" href="#public-main">Skip to main content</a>

      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand-link" aria-label="VidyaAI home">
            <BrandMark compact tagline="by Gyanix AI Solutions" taglineElement="span" />
          </Link>

          <nav className="public-nav" aria-label="Company and legal navigation">
            {navigation.map((item) => <PublicLink key={item.to} to={item.to}>{item.label}</PublicLink>)}
          </nav>

          <Link className="public-app-link" to="/login">
            Open VidyaAI <Icon name="arrowRight" size={17} />
          </Link>
        </div>
      </header>

      <main id="public-main" className="public-main" tabIndex="-1">{children}</main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="public-footer-brand">
            <BrandMark compact tagline="A Gyanix AI Solutions product" taglineElement="span" />
            <p>Responsible AI tools designed to make learning clearer, more useful and more accessible.</p>
          </div>

          <div className="public-footer-column">
            <strong>Resources</strong>
            <Link to="/cgbse-class-10-model-papers">Class 10 papers</Link>
            <Link to="/cgbse-teacher-tools">Teacher tools</Link>
          </div>

          <div className="public-footer-column">
            <strong>Company</strong>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
            <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>
          </div>

          <div className="public-footer-column">
            <strong>Legal</strong>
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/ai-use">Responsible AI Use</Link>
          </div>
        </div>
        <div className="public-footer-bottom">
          <span>© {new Date().getFullYear()} Gyanix AI Solutions. All rights reserved.</span>
          <span>VidyaAI is an independent educational technology product.</span>
        </div>
      </footer>
    </div>
  );
}
