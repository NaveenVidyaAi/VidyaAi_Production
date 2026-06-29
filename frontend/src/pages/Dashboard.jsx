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
    countdownTitle: "बोर्ड परीक्षा में",
    countdownUnit: "दिन",
    countdownNote: "हर दिन एक छोटा लक्ष्य पूरा करें।",
    examDateLabel: "Exam date",
    todayTargetTitle: "आज का लक्ष्य",
    targetProgress: (done, total) => `${done}/${total} पूरे`,
    streakTitle: "Study streak",
    streakUnit: "दिन",
    streakNote: "आज एक लक्ष्य पूरा करके streak बचाएं।",
    papersTitle: "Previous Year Papers",
    papersNote: "एक पेपर चुनें और VidyaAI से practice शुरू कराएं।",
    startPaper: "Practice",
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
    countdownTitle: "Board Exam In",
    countdownUnit: "days",
    countdownNote: "Finish one small target every day.",
    examDateLabel: "Exam date",
    todayTargetTitle: "Today's Target",
    targetProgress: (done, total) => `${done}/${total} done`,
    streakTitle: "Study streak",
    streakUnit: "days",
    streakNote: "Complete one target today to protect it.",
    papersTitle: "Previous Year Papers",
    papersNote: "Choose a paper and let VidyaAI start practice.",
    startPaper: "Practice",
  },
};

const dailyTargets = [
  [
    { id: "acid-base", hi: "विज्ञान: अम्ल-क्षार revise करें", en: "Science: revise Acid-Base" },
    { id: "hindi-3", hi: "हिंदी: अध्याय 3 से 3 प्रश्न करें", en: "Hindi: attempt 3 questions from Chapter 3" },
    { id: "math-formula", hi: "गणित: 10 सूत्र दोहराएं", en: "Math: revise 10 formulas" },
  ],
  [
    { id: "history", hi: "सामाजिक विज्ञान: इतिहास के 2 short answers", en: "Social Science: 2 history short answers" },
    { id: "science-diagram", hi: "विज्ञान: एक diagram practice करें", en: "Science: practice one diagram" },
    { id: "hindi-poem", hi: "हिंदी: एक कविता का सारांश लिखें", en: "Hindi: write one poem summary" },
  ],
  [
    { id: "math-paper", hi: "गणित: 15 मिनट previous questions", en: "Math: 15 minutes previous questions" },
    { id: "english-writing", hi: "English: writing section का एक प्रश्न", en: "English: one writing question" },
    { id: "weak-topic", hi: "अपना एक weak topic revise करें", en: "Revise one weak topic" },
  ],
];

const previousPapers = [
  { year: "2025", subject: "Hindi", title: "Hindi Board Paper", prompt: "Class 10 Hindi previous year paper 2025 से 5 important questions practice कराइए" },
  { year: "2024", subject: "Science", title: "Science Board Paper", prompt: "Class 10 Science previous year paper 2024 pattern से important questions पूछिए" },
  { year: "2024", subject: "Math", title: "Math Board Paper", prompt: "Class 10 Math previous year paper 2024 से 5 exam questions practice कराइए" },
  { year: "2023", subject: "Social Science", title: "Social Science Paper", prompt: "Class 10 Social Science previous year paper 2023 से revision test लीजिए" },
];

const subjects = [
  { id: "Hindi", hi: "हिंदी", en: "Hindi" },
  { id: "Science", hi: "विज्ञान", en: "Science" },
  { id: "Math", hi: "गणित", en: "Math" },
  { id: "Social Science", hi: "सामाजिक विज्ञान", en: "Social Science" },
  { id: "English", hi: "English", en: "English" },
  { id: "Sanskrit", hi: "संस्कृत", en: "Sanskrit" },
];

const subjectQuestionSamples = {
  Hindi: [
    { hi: "कक्षा 10 हिंदी अध्याय 3 का सारांश सरल भाषा में समझाइए", en: "Explain Class 10 Hindi Chapter 3 in simple language" },
    { hi: "कविता का केंद्रीय भाव और मुख्य बिंदु लिखिए", en: "Write the central idea and key points of the poem" },
    { hi: "इस अध्याय से 5 महत्वपूर्ण प्रश्नोत्तर दीजिए", en: "Give 5 important Q&A from this chapter" },
  ],
  Science: [
    { hi: "अम्ल, क्षार और लवण में अंतर उदाहरण सहित समझाइए", en: "Explain the difference between acids, bases, and salts with examples" },
    { hi: "प्रकाश के परावर्तन के नियम diagram के साथ बताइए", en: "Explain laws of reflection of light with a diagram" },
    { hi: "इस chapter से 2 अंक और 5 अंक के महत्वपूर्ण प्रश्न दीजिए", en: "Give important 2-mark and 5-mark questions from this chapter" },
  ],
  Math: [
    { hi: "द्विघात समीकरण का सूत्र उदाहरण सहित समझाइए", en: "Explain the quadratic formula with an example" },
    { hi: "x² - 5x + 6 = 0 के मूल step-by-step निकालिए", en: "Find the roots of x² - 5x + 6 = 0 step by step" },
    { hi: "समांतर श्रेणी के 5 practice questions answer सहित दीजिए", en: "Give 5 arithmetic progression practice questions with answers" },
  ],
  "Social Science": [
    { hi: "चंपारण सत्याग्रह को परीक्षा के लिए 5 अंकों में समझाइए", en: "Explain Champaran Satyagraha for a 5-mark exam answer" },
    { hi: "भारत के राष्ट्रपति की शक्तियां और कार्य लिखिए", en: "Write the powers and functions of the President of India" },
    { hi: "इस chapter के short notes और important dates दीजिए", en: "Give short notes and important dates from this chapter" },
  ],
  English: [
    { hi: "Class 10 English poem का summary और theme बताइए", en: "Give the summary and theme of this Class 10 English poem" },
    { hi: "Write a letter/application for board exam practice", en: "Write a letter/application for board exam practice" },
    { hi: "Give 5 important English grammar practice questions", en: "Give 5 important English grammar practice questions" },
  ],
  Sanskrit: [
    { hi: "संस्कृत पाठ का हिंदी अनुवाद और सारांश दीजिए", en: "Give Hindi translation and summary of the Sanskrit lesson" },
    { hi: "इस श्लोक का अर्थ और व्याकरण समझाइए", en: "Explain the meaning and grammar of this shloka" },
    { hi: "संस्कृत संधि/समास के 5 examples answer सहित दीजिए", en: "Give 5 Sanskrit sandhi/samas examples with answers" },
  ],
};

const answerStyles = [
  { id: "exam", hi: "परीक्षा-मित्र", en: "Exam-ready" },
  { id: "summary", hi: "सारांश", en: "Summary" },
  { id: "two", hi: "2 अंक", en: "2 marks" },
  { id: "five", hi: "5 अंक", en: "5 marks" },
  { id: "qa", hi: "प्रश्नोत्तर", en: "Q&A" },
];

const suggestionChips = [
  { hi: "अध्याय 3 सारांश", en: "Chapter 3 summary" },
  { hi: "मीरा बाई कविता", en: "Meera Bai poem" },
  { hi: "5 अंक प्रश्न", en: "5-mark question" },
  { hi: "परीक्षा टिप्स", en: "Exam tips" },
];

const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
};

const defaultExamDate = () => dateKey(addDays(new Date(), 47));

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [examDate, setExamDate] = useState(() => localStorage.getItem("vidyaai_exam_date") || defaultExamDate());
  const [completedTargets, setCompletedTargets] = useState(() => readJson(`vidyaai_targets_${dateKey()}`, []));
  const [streak, setStreak] = useState(() => readJson("vidyaai_streak", { count: 0, lastActive: "" }));
  const [selectedSubject, setSelectedSubject] = useState("Hindi");
  const [answerStyle, setAnswerStyle] = useState("exam");
  const windowRef = useRef(null);

  const t = translations[lang];
  const todayIndex = Math.floor(new Date().getTime() / 86400000) % dailyTargets.length;
  const todaysTargets = dailyTargets[todayIndex];
  const completedCount = todaysTargets.filter((item) => completedTargets.includes(item.id)).length;
  const daysToExam = Math.max(Math.ceil((new Date(examDate) - new Date()) / 86400000), 0);
  const askedQuestions = messages.filter((message) => message.role === "student");
  const recentQuestions = askedQuestions.slice(-4).reverse();
  const selectedSubjectSamples = subjectQuestionSamples[selectedSubject] || [];

  const inferSubject = (text) => {
    const q = (text || "").toLowerCase();
    if (q.includes("हिंदी") || q.includes("hindi")) return "Hindi";
    if (q.includes("गणित") || q.includes("math")) return "Math";
    if (q.includes("विज्ञान") || q.includes("science")) return "Science";
    if (q.includes("इतिहास") || q.includes("भूगोल") || q.includes("social")) return "Social Science";
    if (q.includes("english")) return "English";
    return "General";
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/auth/me");
        if (response?.data?.name) {
          setStudentName(response.data.name);
          setStudentProfile(response.data);
          if (response.data.exam_date) {
            const profileExamDate = dateKey(new Date(response.data.exam_date));
            setExamDate(profileExamDate);
            localStorage.setItem("vidyaai_exam_date", profileExamDate);
          }
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

  useEffect(() => {
    localStorage.setItem("vidyaai_exam_date", examDate);
  }, [examDate]);

  useEffect(() => {
    setCompletedTargets(readJson(`vidyaai_targets_${dateKey()}`, []));
  }, []);

  const recordStudyActivity = () => {
    const today = dateKey();
    if (streak.lastActive === today) return;

    const yesterday = dateKey(addDays(new Date(), -1));
    const nextStreak = {
      count: streak.lastActive === yesterday ? streak.count + 1 : 1,
      lastActive: today,
    };
    setStreak(nextStreak);
    localStorage.setItem("vidyaai_streak", JSON.stringify(nextStreak));
  };

  const toggleTarget = (targetId) => {
    setCompletedTargets((prev) => {
      const next = prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId];
      localStorage.setItem(`vidyaai_targets_${dateKey()}`, JSON.stringify(next));
      if (!prev.includes(targetId)) recordStudyActivity();
      return next;
    });
  };

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

  const askQuestion = async (currentQuestion, subjectOverride = null) => {
    if (!currentQuestion || isLoading) return;

    recordStudyActivity();
    setQuestion("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "student", text: currentQuestion }]);
    const outgoingSubject = subjectOverride || selectedSubject || inferSubject(currentQuestion);

    try {
      const response = await api.post("/chat/ask", {
        question: currentQuestion,
        subject: outgoingSubject,
        answer_style: answerStyle,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response?.data?.answer || t.welcomeMsg,
          sessionId: response?.data?.session_id,
          question: currentQuestion,
          subject: outgoingSubject,
          answerStyle,
          chapterOptions: response?.data?.chapter_options || [],
          feedback: null,
        },
      ]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await askQuestion(question.trim());
  };

  const handleChapterOption = async (option) => {
    const optionSubject = option.subject || selectedSubject || "Hindi";
    setSelectedSubject(optionSubject);
    await askQuestion(option.prompt || `class 10 ${optionSubject} chapter ${option.section}`, optionSubject);
  };

  const handlePaperPractice = async (paper) => {
    setSelectedSubject(paper.subject);
    await askQuestion(paper.prompt, paper.subject);
  };

  const handleFeedback = async (messageIndex, sessionId, understood) => {
    if (!sessionId) return;
    setMessages((prev) => prev.map((message, index) => (
      index === messageIndex ? { ...message, feedback: understood ? "up" : "down" } : message
    )));
    try {
      await api.post("/chat/feedback", { session_id: sessionId, understood });
    } catch {
      setMessages((prev) => prev.map((message, index) => (
        index === messageIndex ? { ...message, feedback: null } : message
      )));
    }
  };

  const handleRetry = async (message) => {
    const retryQuestion = message.question || [...messages].reverse().find((item) => item.role === "student")?.text;
    if (!retryQuestion) return;
    if (message.answerStyle) {
      setAnswerStyle(message.answerStyle);
    }
    await askQuestion(retryQuestion, message.subject || selectedSubject || inferSubject(retryQuestion));
  };

  return (
    <div className="page-shell dashboard-app-shell">
      <aside className="dashboard-left-nav">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden="true">वि</div>
          <div className="sidebar-brand-copy">
            <strong>VidyaAI</strong>
            <p>{t.sidebarTagline}</p>
          </div>
        </div>

        <button type="button" className="nav-action primary" onClick={handleNewChat}>{t.newChat}</button>
        {isAdmin && (
          <button type="button" className="nav-action nav-action-admin" onClick={() => navigate("/admin")}>Admin Panel</button>
        )}

        <div className="sidebar-section">
          <p>{t.quickPromptsTitle}</p>
          {t.quickPrompts.map((prompt, index) => (
            <button key={index} type="button" className="plain-list-button" onClick={() => setQuestion(prompt)}>{prompt}</button>
          ))}
        </div>

        {recentQuestions.length > 0 && (
          <div className="sidebar-section">
            <p>{t.recentChatsTitle}</p>
            {recentQuestions.map((message, index) => (
              <button key={`${message.text}-${index}`} type="button" className="recent-item active" onClick={() => setQuestion(message.text)}>
                {message.text}
              </button>
            ))}
          </div>
        )}

        <div className="sidebar-section papers-sidebar-section">
          <p>{t.papersTitle}</p>
          <div className="paper-list compact">
            {previousPapers.map((paper) => (
              <button key={`${paper.subject}-${paper.year}`} type="button" onClick={() => handlePaperPractice(paper)}>
                <span>{paper.year}</span>
                <strong>{paper.subject}</strong>
                <small>{t.startPaper}</small>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="dashboard-main-chat">
        <header className="dashboard-main-top">
          <div className="dashboard-title-block">
            <h1>{t.greeting(studentName)}</h1>
            <div className="student-tags">
              <span>कक्षा {studentProfile?.class_level || "10"}</span>
              <span>{studentProfile?.medium || "Hindi"} माध्यम</span>
            </div>
          </div>

          <div className="top-actions">
            <button type="button" className="icon-btn top-icon-btn" onClick={() => setLang((l) => l === "hi" ? "en" : "hi")} title="Switch Language">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span className="icon-btn-label">{lang === "hi" ? "EN" : "हिं"}</span>
            </button>

            <button type="button" className="icon-btn top-icon-btn" onClick={handleShare} title="Share Chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>

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

        <div className="answer-style-bar">
          <span>उत्तर शैली:</span>
          {answerStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              className={answerStyle === style.id ? "active" : ""}
              onClick={() => setAnswerStyle(style.id)}
            >
              {style[lang]}
            </button>
          ))}
        </div>

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
                <div className="assistant-card-title">
                  <div className="assistant-logo">वि</div>
                  <div>
                    <h2>VidyaAI</h2>
                    <p>{t.sidebarTagline}</p>
                  </div>
                </div>
              </div>
              <label className="chat-exam-date">
                {t.examDateLabel}
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value || defaultExamDate())}
                />
              </label>
            </div>

            <div ref={windowRef} className="dashboard-chatgpt-window">
              {messages.map((message, index) => (
                <div key={index} className={`dashboard-message-row ${message.role === "assistant" ? "assistant" : "student"}`}>
                  <div className="dashboard-message-stack">
                    <span className="message-label">{message.role === "assistant" ? t.assistantLabel : t.studentLabel}</span>
                    <div className={`dashboard-message-bubble ${message.role === "assistant" ? "assistant" : "student"}`}>
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                      {message.role === "assistant" && message.chapterOptions?.length > 0 && (
                        <div className="chapter-option-list">
                          {message.chapterOptions.map((option) => (
                            <button
                              key={option.section}
                              type="button"
                              onClick={() => handleChapterOption(option)}
                              disabled={isLoading}
                            >
                              <span>{option.section}</span>
                              {option.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === "assistant" && (
                      <div className="message-signs">
                        <button type="button" className="icon-btn" onClick={() => handleCopy(message.text)} title="Copy">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button type="button" className="icon-btn" onClick={() => handleRetry(message)} title="Retry">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
                        </button>
                        {message.sessionId && !message.chapterOptions?.length && (
                          <>
                            <button
                              type="button"
                              className={`icon-btn feedback-icon positive${message.feedback === "up" ? " active" : ""}`}
                              onClick={() => handleFeedback(index, message.sessionId, true)}
                              title="Good answer"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                            </button>
                            <button
                              type="button"
                              className={`icon-btn feedback-icon negative${message.feedback === "down" ? " active" : ""}`}
                              onClick={() => handleFeedback(index, message.sessionId, false)}
                              title="Needs improvement"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V3"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                            </button>
                          </>
                        )}
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

            <div className="suggestion-strip">
              {suggestionChips.map((chip) => (
                <button key={chip.en} type="button" onClick={() => setQuestion(chip[lang])}>
                  {chip[lang]}
                </button>
              ))}
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

        </div>
      </section>

      <aside className="dashboard-right-rail">
        <section className="right-section">
          <p className="rail-heading">{t.profileTitle}</p>
          <div className="profile-summary-card">
            <div className="profile-card-head">
              <div className="profile-avatar-large" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>{studentName}</h3>
            </div>
            <dl>
              <div><dt>{t.profileLabels.class}</dt><dd>{studentProfile?.class_level || "10"}</dd></div>
              <div><dt>{t.profileLabels.medium}</dt><dd>{studentProfile?.medium || "Hindi"}</dd></div>
              <div><dt>बोर्ड</dt><dd>CGBSE</dd></div>
            </dl>
          </div>
        </section>

        <section className="right-section">
          <p className="rail-heading">आज की गतिविधि</p>
          <div className="activity-grid">
            <div><strong>{askedQuestions.length}</strong><span>प्रश्न पूछे</span></div>
            <div><strong>{completedCount}</strong><span>लक्ष्य पूरे</span></div>
          </div>
          <div className="mini-stat-row">
            <span>{t.countdownTitle}</span>
            <strong>{daysToExam} {t.countdownUnit}</strong>
          </div>
          <div className="mini-stat-row">
            <span>{t.streakTitle}</span>
            <strong>{streak.count || 0} {t.streakUnit}</strong>
          </div>
        </section>

        <section className="right-section">
          <p className="rail-heading">विषय चुनें</p>
          <div className="subject-list">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                className={selectedSubject === subject.id ? "active" : ""}
                onClick={() => setSelectedSubject(subject.id)}
              >
                <span>{subject[lang]}</span>
                <small>{selectedSubject === subject.id ? "चुना गया" : "कक्षा 10"}</small>
              </button>
            ))}
          </div>

          <div className="question-sample-panel">
            <div className="sample-panel-head">
              <strong>{lang === "hi" ? "कैसे पूछें?" : "How to ask"}</strong>
              <span>{subjects.find((subject) => subject.id === selectedSubject)?.[lang] || selectedSubject}</span>
            </div>
            <div className="question-sample-list">
              {selectedSubjectSamples.map((sample) => (
                <button
                  key={sample.en}
                  type="button"
                  onClick={() => setQuestion(sample[lang])}
                >
                  {sample[lang]}
                </button>
              ))}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
