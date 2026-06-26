import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import api from "../api/client";
import BrandMark from "../components/BrandMark";

const translations = {
  hi: {
    greeting: (name) => `नमस्ते, ${name}`,
    guestNote: "Guest mode में personalization सीमित है।",
    classInfo: (cls, medium) => `कक्षा ${cls} • ${medium} माध्यम`,
    newChat: "+ नई चैट",
    chapterLib: "अध्याय लाइब्रेरी",
    quickPromptsTitle: "त्वरित प्रश्न",
    recentChatsTitle: "हाल की चैट",
    answerSection: "उत्तर सेक्शन",
    answerSubtext: "स्पष्ट, छात्र-मित्र और परीक्षा में काम आने वाला आउटपुट",
    placeholder: "उदाहरण: कक्षा 10 हिंदी अध्याय 3 समझाइए",
    submit: "भेजें",
    loading: "सोच रहा हूँ...",
    assistantLabel: "VidyaAI उत्तर",
    studentLabel: "आपका प्रश्न",
    profileTitle: "प्रोफाइल",
    tipsTitle: "अच्छा प्रश्न कैसे पूछें",
    tips: ["अध्याय संख्या या नाम जरूर लिखें", "उत्तर प्रकार बताएं: 2 अंक, 5 अंक, सारांश", "जरूरत हो तो किताब की पंक्ति भी जोड़ें"],
    profileLabels: { name: "नाम", class: "कक्षा", medium: "माध्यम", status: "स्थिति", guest: "Guest", loggedIn: "Logged in" },
    sidebarTagline: "छात्रों के लिए सरल, हल्का और उपयोगी सीखने का अनुभव",
    brandTagline: "लोगो, प्रोफाइल और आउटपुट अब एक ही light theme में हैं।",
    welcomeMsg: "नमस्ते! मैं VidyaAI हूँ। आप अध्याय, कविता, प्रश्नोत्तर या परीक्षा तैयारी से जुड़ा कोई भी सवाल पूछ सकते हैं।",
    newChatMsg: "नई चैट शुरू हो गई है। अपना अध्याय, कविता या प्रश्न लिखिए।",
    loginRequired: "कृपया personalized उत्तर पाने के लिए लॉगिन करें।",
    serviceError: "सेवा अभी व्यस्त है। कृपया कुछ सेकंड बाद फिर प्रयास करें।",
    guestName: "अतिथि विद्यार्थी",
    studyCards: (cls, medium) => [
      { title: "उत्तर शैली", value: "परीक्षा-मित्र", note: "सारांश, मुख्य बिंदु, प्रश्नोत्तर" },
      { title: "माध्यम", value: medium || "Hindi", note: "सरल भाषा, साफ व्याख्या" },
      { title: "कक्षा", value: cls ? `कक्षा ${cls}` : "कक्षा 10", note: "अध्याय आधारित तैयारी" },
    ],
    quickPrompts: ["कक्षा 10 हिंदी अध्याय 3 समझाइए", "2 अंकों के लिए उत्तर लिखिए", "मुख्य बिंदु और प्रश्नोत्तर दीजिए"],
    recentChats: ["कक्षा 10 हिंदी अध्याय 3", "विज्ञान: अम्ल और क्षार", "इतिहास त्वरित पुनरावृत्ति", "गणित महत्वपूर्ण प्रश्न"],
    adminPanelTitle: "एडमिन एनालिटिक्स",
    adminPanelSubtitle: "उपयोग, अध्ययन और सिस्टम स्केलिंग के मुख्य संकेतक",
  },
  en: {
    greeting: (name) => `Hello, ${name}`,
    guestNote: "Personalization is limited in Guest mode.",
    classInfo: (cls, medium) => `Class ${cls} • ${medium} Medium`,
    newChat: "+ New Chat",
    chapterLib: "Chapter Library",
    quickPromptsTitle: "Quick Prompts",
    recentChatsTitle: "Recent Chats",
    answerSection: "Answer Section",
    answerSubtext: "Clear, student-friendly output useful in exams",
    placeholder: "E.g.: Explain Class 10 Hindi Chapter 3",
    submit: "Send",
    loading: "Thinking...",
    assistantLabel: "VidyaAI Answer",
    studentLabel: "Your Question",
    profileTitle: "Profile",
    tipsTitle: "How to ask a good question",
    tips: ["Always mention chapter number or name", "Specify answer type: 2 marks, 5 marks, summary", "Add a line from the book if needed"],
    profileLabels: { name: "Name", class: "Class", medium: "Medium", status: "Status", guest: "Guest", loggedIn: "Logged in" },
    sidebarTagline: "Simple, light, and useful learning experience for students",
    brandTagline: "Logo, profile, and output now in one light student-first theme.",
    welcomeMsg: "Hello! I am VidyaAI. You can ask any question related to chapters, poems, Q&A, or exam preparation.",
    newChatMsg: "New chat started. Write your chapter, poem, or question.",
    loginRequired: "Please login to get personalized answers.",
    serviceError: "Service is busy right now. Please try again in a few seconds.",
    guestName: "Guest Student",
    studyCards: (cls, medium) => [
      { title: "Answer Style", value: "Exam-Ready", note: "Summary, key points, Q&A" },
      { title: "Medium", value: medium || "Hindi", note: "Simple language, clear explanation" },
      { title: "Class", value: cls ? `Class ${cls}` : "Class 10", note: "Chapter-based preparation" },
    ],
    quickPrompts: ["Explain Class 10 Hindi Chapter 3", "Write answer for 2 marks", "Give key points and Q&A"],
    recentChats: ["Class 10 Hindi Ch. 3", "Science: Acids & Bases", "History Quick Revision", "Maths Important Questions"],
    adminPanelTitle: "Admin Analytics",
    adminPanelSubtitle: "Key usage, study and scaling metrics",
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("hi");
  const [studentName, setStudentName] = useState("विद्यार्थी");
  const [studentProfile, setStudentProfile] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(() => [
    { role: "assistant", text: translations.hi.welcomeMsg },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [showProfile, setShowProfile] = useState(true);
  const windowRef = useRef(null);

  const t = translations[lang];

  const inferSubject = (text) => {
    const q = (text || "").toLowerCase();
    if (q.includes("हिंदी") || q.includes("hindi")) return "Hindi";
    if (q.includes("गणित") || q.includes("math")) return "Math";
    if (q.includes("विज्ञान") || q.includes("science")) return "Science";
    if (q.includes("इतिहास") || q.includes("भूगोल") || q.includes("social")) return "Social Science";
    if (q.includes("english")) return "English";
    return "General";
  };

  const studyCards = t.studyCards(studentProfile?.class_level, studentProfile?.medium);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/auth/me");
        if (response?.data?.name) {
          setStudentName(response.data.name);
          setStudentProfile(response.data);
          setIsGuest(false);
          setIsAdmin(Boolean(response.data.is_admin));
        }
      } catch {
        setStudentName(t.guestName);
        setStudentProfile(null);
        setIsGuest(true);
        setIsAdmin(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadAdminStats() {
      if (!isAdmin) {
        setAdminStats(null);
        return;
      }
      try {
        const response = await api.get("/admin/dashboard");
        setAdminStats(response.data);
      } catch {
        setAdminStats(null);
      }
    }
    loadAdminStats();
  }, [isAdmin]);

  useEffect(() => {
    if (!windowRef.current) return;
    windowRef.current.scrollTop = windowRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleNewChat = () => {
    setMessages([{ role: "assistant", text: t.newChatMsg }]);
    setQuestion("");
  };

  const handleShare = async () => {
    const transcript = messages.map((m) => `${m.role === "assistant" ? "VidyaAI" : studentName}: ${m.text}`).join("\n\n");
    if (navigator.share) {
      try { await navigator.share({ title: "VidyaAI Chat", text: transcript }); } catch {}
    } else {
      await handleCopy(transcript);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vidyaai_token");
    setStudentProfile(null);
    setStudentName("अतिथि विद्यार्थी");
    setIsGuest(true);
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion || isLoading) return;

    setQuestion("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "student", text: currentQuestion }]);

    try {
      const response = await api.post("/chat/ask", {
        question: currentQuestion,
        subject: inferSubject(currentQuestion),
      });

      setMessages((prev) => [...prev, { role: "assistant", text: response?.data?.answer || t.welcomeMsg }]);
    } catch (err) {
      const status = err?.response?.status;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: status === 401 ? t.loginRequired : t.serviceError },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell dashboard-app-shell">
      <aside className="dashboard-left-nav">
        <div className="sidebar-brand">
          <BrandMark compact />
          <p>{t.sidebarTagline}</p>
        </div>

        <button type="button" className="nav-action primary" onClick={handleNewChat}>{t.newChat}</button>
        <button type="button" className="nav-action">{t.chapterLib}</button>
        {isAdmin && (
          <button type="button" className="nav-action nav-action-admin" onClick={() => navigate("/admin")}>⚙ Admin Panel</button>
        )}

        <div className="sidebar-section">
          <p>{t.quickPromptsTitle}</p>
          {t.quickPrompts.map((prompt, index) => (
            <button key={index} type="button" className="recent-item" onClick={() => setQuestion(prompt)}>{prompt}</button>
          ))}
        </div>

        <div className="recent-list">
          <p>{t.recentChatsTitle}</p>
          {t.recentChats.map((chat, index) => (
            <button key={index} type="button" className="recent-item">{chat}</button>
          ))}
        </div>
      </aside>

      <section className="dashboard-main-chat">
        <header className="dashboard-main-top">
          <div className="dashboard-title-block">
            <span className="section-pill">Student Dashboard</span>
            <h1>{t.greeting(studentName)}</h1>
            <p>{isGuest ? t.guestNote : t.classInfo(studentProfile?.class_level || "10", studentProfile?.medium || "Hindi")}</p>
          </div>

          <div className="top-actions">
            {/* Language toggle */}
            <button type="button" className="icon-btn top-icon-btn" onClick={() => setLang((l) => l === "hi" ? "en" : "hi")} title="Switch Language">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span className="icon-btn-label">{lang === "hi" ? "EN" : "हिं"}</span>
            </button>

            {/* Share chat */}
            <button type="button" className="icon-btn top-icon-btn" onClick={handleShare} title="Share Chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>

            {/* Profile toggle */}
            <button type="button" className={`icon-btn top-icon-btn ${showProfile ? "active" : ""}`} onClick={() => setShowProfile((prev) => !prev)} title={t.profileTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>

            {/* Login / Logout */}
            {isGuest ? (
              <button type="button" className="icon-btn top-icon-btn" onClick={() => navigate("/login")} title="Login">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </button>
            ) : (
              <button type="button" className="icon-btn top-icon-btn" onClick={handleLogout} title="Logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            )}
          </div>
        </header>

        <section className="dashboard-overview">
          {studyCards.map((card) => (
            <article key={card.title} className="overview-card">
              <p>{card.title}</p>
              <strong>{card.value}</strong>
              <span>{card.note}</span>
            </article>
          ))}
        </section>

        {isAdmin && adminStats?.summary && (
          <section className="dashboard-overview" aria-label="admin-analytics">
            <article className="overview-card">
              <p>{t.adminPanelTitle}</p>
              <strong>{adminStats.summary.total_users}</strong>
              <span>{t.adminPanelSubtitle}</span>
            </article>
            <article className="overview-card">
              <p>Total Questions</p>
              <strong>{adminStats.summary.total_questions}</strong>
              <span>24h: {adminStats.summary.questions_24h}</span>
            </article>
            <article className="overview-card">
              <p>Active Users (24h)</p>
              <strong>{adminStats.summary.active_users_24h}</strong>
              <span>Avg Q/User: {adminStats.summary.avg_questions_per_user}</span>
            </article>
            <article className="overview-card">
              <p>Cache Performance</p>
              <strong>{adminStats.summary.cache_hits_total}</strong>
              <span>Entries: {adminStats.summary.cache_entries}</span>
            </article>
          </section>
        )}

        <div className="dashboard-chat-stage">
          <div className="dashboard-chat-panel">
            <div className="chat-panel-header">
              <div>
                <h2>{t.answerSection}</h2>
                <p>{t.answerSubtext}</p>
              </div>
              <span className="answer-badge">Hindi Friendly</span>
            </div>

            <div ref={windowRef} className="dashboard-chatgpt-window">
              {messages.map((message, index) => (
                <div key={index} className={`dashboard-message-row ${message.role === "assistant" ? "assistant" : "student"}`}>
                  <div className="dashboard-message-stack">
                    <span className="message-label">{message.role === "assistant" ? t.assistantLabel : t.studentLabel}</span>
                    <div className={`dashboard-message-bubble ${message.role === "assistant" ? "assistant" : "student"}`}>
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                    {message.role === "assistant" && (
                      <div className="message-signs">
                        <button type="button" className="icon-btn" onClick={() => handleCopy(message.text)} title="Copy">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button type="button" className="icon-btn" title="Regenerate">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></svg>
                        </button>
                        <button type="button" className="icon-btn" title="Good answer">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                        </button>
                        <button type="button" className="icon-btn" title="Needs improvement">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="dashboard-message-row assistant">
                  <div className="dashboard-message-stack">
                    <div className="dashboard-message-bubble assistant typing-bubble">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form className="dashboard-chatgpt-form sticky-input" onSubmit={handleSubmit}>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t.placeholder}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? t.loading : t.submit}
              </button>
            </form>
          </div>

          {showProfile && (
            <aside className="profile-rail">
              <div className="profile-card profile-brand-card">
                <BrandMark compact />
                <p>{t.brandTagline}</p>
              </div>

              <div className="profile-card">
                <h3>{t.profileTitle}</h3>
                <ul className="profile-list">
                  <li><span>{t.profileLabels.name}</span><strong>{studentName}</strong></li>
                  <li><span>{t.profileLabels.class}</span><strong>{studentProfile?.class_level || "10"}</strong></li>
                  <li><span>{t.profileLabels.medium}</span><strong>{studentProfile?.medium || "Hindi"}</strong></li>
                  <li><span>{t.profileLabels.status}</span><strong>{isGuest ? t.profileLabels.guest : t.profileLabels.loggedIn}</strong></li>
                </ul>
              </div>

              <div className="profile-card">
                <h3>{t.tipsTitle}</h3>
                <ul className="tips-list">
                  {t.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
