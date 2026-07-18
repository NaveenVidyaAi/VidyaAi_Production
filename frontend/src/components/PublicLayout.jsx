import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BrandMark from "./BrandMark";
import Icon from "./Icon";

export const OFFICIAL_EMAIL = "GyanixAiSolutions@gmail.com";

const navigation = [
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
}) {
  const location = useLocation();

  useEffect(() => {
    const previousTitle = document.title;
    const existingDescription = document.querySelector('meta[name="description"]');
    const previousDescription = existingDescription?.getAttribute("content") || "";
    const descriptionTag = existingDescription || document.createElement("meta");
    if (!existingDescription) {
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    document.title = `${title} | VidyaAI`;
    descriptionTag.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (existingDescription) descriptionTag.setAttribute("content", previousDescription);
      else descriptionTag.remove();
    };
  }, [description, title]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("public-main")?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="public-site">
      <a className="public-skip-link" href="#public-main">Skip to main content</a>

      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/about" className="public-brand-link" aria-label="VidyaAI by Gyanix AI Solutions — About">
            <BrandMark compact tagline="by Gyanix AI Solutions" taglineElement="span" />
          </Link>

          <nav className="public-nav" aria-label="Company and legal navigation">
            {navigation.map((item) => <PublicLink key={item.to} to={item.to}>{item.label}</PublicLink>)}
          </nav>

          <Link className="public-app-link" to="/">
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
