import { createContext, useContext, useEffect, useState } from "react";

const PublicLanguageContext = createContext(null);

export function PublicLanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("vidyaai_public_lang") || "en");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((current) => {
      const next = current === "en" ? "hi" : "en";
      localStorage.setItem("vidyaai_public_lang", next);
      return next;
    });
  };

  return <PublicLanguageContext.Provider value={{ language, toggleLanguage }}>{children}</PublicLanguageContext.Provider>;
}

export function usePublicLanguage() {
  const context = useContext(PublicLanguageContext);
  if (!context) throw new Error("usePublicLanguage must be used within PublicLanguageProvider");
  return context;
}
