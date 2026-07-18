import { Link } from "react-router-dom";

const companyAndLegalLinks = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/ai-use", label: "AI Use" },
];

export default function CompanyLegalFooter({ className = "" }) {
  return (
    <footer className={`company-legal-footer ${className}`.trim()}>
      <span>VidyaAI by Gyanix AI Solutions</span>
      <nav aria-label="Company and legal links">
        {companyAndLegalLinks.map((item) => (
          <Link key={item.to} to={item.to}>{item.label}</Link>
        ))}
      </nav>
    </footer>
  );
}
