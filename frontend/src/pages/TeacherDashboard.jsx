import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import BrandMark from "../components/BrandMark";
import Icon from "../components/Icon";
import RichMarkdown from "../components/RichMarkdown";
import { assessmentPapers } from "../data/assessmentPapers";

const subjects = ["Hindi", "English", "Math", "Science", "Social Science", "Sanskrit"];

const copy = {
  en: {
    nav: { home: "Overview", curriculum: "Curriculum Creator", paper: "Test & Paper Creator", lesson: "How to Teach", chat: "AI Chat", pyq: "PYQ Library" },
    shared: "Teaching resources",
    ask: "Ask VidyaAI",
    chatWelcome: "Ask about a concept, lesson strategy, classroom activity, or student doubt.",
    chatPlaceholder: "Ask VidyaAI for teaching support…",
    send: "Send",
    thinking: "Thinking…",
    you: "You",
    assistant: "VidyaAI",
    newChat: "New chat",
    papersTitle: "Previous Year Papers",
    papersNote: "Open or download CGBSE papers without leaving the teacher workspace.",
    allSubjects: "All subjects",
    open: "Open",
    download: "Download",
    streak: "active days",
    roleBadge: "Teacher Copilot",
    kicker: "VIDYAAI FOR TEACHERS",
    brandTagline: "Your AI teaching companion",
    logout: "Logout",
    subject: "Subject",
    classLabel: "Class",
    medium: "Medium",
    hero: { kicker: "Good preparation creates a great classroom", title: "What would you like to prepare today?", text: "Plan your syllabus, build an assessment, prepare tomorrow's lesson, or ask VidyaAI from one focused workspace.", stat: "AI teacher tools", statNote: "including Chat & PYQ" },
    cards: {
      curriculum: { title: "Curriculum Creator", text: "Build a week-wise scope, outcomes, activities, assessments, and revision plan.", action: "Plan curriculum" },
      paper: { title: "Test & Paper Creator", text: "Set marks, questions, duration, difficulty, syllabus, answer key, and marking scheme.", action: "Create a paper" },
      lesson: { title: "How to Teach", text: "Learn the topic before class and receive a minute-by-minute teaching strategy.", action: "Prepare a lesson" },
    },
    recent: { title: "Recent resources", note: "Resources are kept in this browser for quick access.", empty: "Your generated curricula, papers, and teaching guides will appear here.", curriculum: "Curriculum", paper: "Test paper", lesson: "Teaching guide" },
    insights: { title: "Teacher pulse", note: "Your preparation activity", resources: "Resources", activeDays: "Active days", curricula: "Curricula", papers: "Papers", recent: "Recent activity", noRecent: "Create your first resource to start the activity timeline.", quick: "Quick create", lastActive: "Last active" },
    homeChat: { kicker: "TEACHER COPILOT", title: "Plan with VidyaAI without leaving your dashboard", note: "Ask a teaching question now, or open the full chat for a longer conversation.", open: "Open full chat" },
    curriculumForm: { title: "Curriculum details", note: "Give the planning boundaries; VidyaAI will organize the sequence.", weeks: "Duration (weeks)", periods: "Periods per week", teachingMedium: "Teaching medium", chapters: "Chapters or syllabus", chaptersPlaceholder: "Example: Chapters 1–6, or paste the chapter list", goals: "Learning goals", goalsPlaceholder: "What should students know or be able to do?", loading: "Building curriculum…", action: "Create curriculum plan" },
    paperForm: { title: "Paper blueprint", note: "Marks and question count are validated in the generation prompt.", marks: "Total marks", questions: "Number of questions", duration: "Duration (minutes)", difficulty: "Difficulty", type: "Paper type", syllabus: "Syllabus / chapters", syllabusPlaceholder: "Example: Acids, Bases and Salts; Metals and Non-metals", instructions: "Additional instructions", instructionsPlaceholder: "Optional: include diagrams, competency-based questions, internal choice…", loading: "Setting the paper…", action: "Create question paper" },
    lessonForm: { title: "Prepare tomorrow's lesson", note: "VidyaAI explains the topic first, then turns it into a teachable classroom sequence.", duration: "Lesson duration", readiness: "Student readiness", topic: "Chapter or topic", topicPlaceholder: "Example: Class 10 Science Chapter 2 — Acids, Bases and Salts", notes: "What should VidyaAI consider?", notesPlaceholder: "Optional: students struggle with equations; no lab available; need a bilingual explanation…", loading: "Preparing your lesson…", action: "Create teaching guide" },
    options: { hindi: "Hindi", english: "English", bilingual: "Bilingual", easy: "Easy", balanced: "Balanced", challenging: "Challenging", unit: "Unit test", term: "Term exam", practice: "Practice paper", worksheet: "Worksheet", mixed: "Mixed classroom", foundation: "Needs foundation", advanced: "Advanced", general: "General" },
    result: { error: "Could not create resource", errorNote: "VidyaAI could not create this resource. Please try again.", loading: "VidyaAI is preparing a classroom-ready resource…", loadingNote: "Checking structure, teaching flow, and curriculum context.", empty: "Your generated resource will appear here", emptyNote: "Complete the form and VidyaAI will create an editable, copyable, print-ready draft.", generated: "Generated resource", copy: "Copy", print: "Print / PDF", sources: "Textbook context used" },
    papersCount: (count) => `Class 10 · ${count} papers`,
    setLabel: "Set",
    subjectNames: { Hindi: "Hindi", English: "English", Math: "Math", Science: "Science", "Social Science": "Social Science", Sanskrit: "Sanskrit" },
  },
  hi: {
    nav: { home: "अवलोकन", curriculum: "पाठ्यक्रम निर्माता", paper: "टेस्ट एवं पेपर", lesson: "कैसे पढ़ाएँ", chat: "AI चैट", pyq: "PYQ लाइब्रेरी" },
    shared: "शिक्षण संसाधन",
    ask: "VidyaAI से पूछें",
    chatWelcome: "किसी अवधारणा, पाठ योजना, कक्षा गतिविधि या विद्यार्थी के संदेह के बारे में पूछें।",
    chatPlaceholder: "शिक्षण सहायता के लिए VidyaAI से पूछें…",
    send: "भेजें",
    thinking: "सोच रहा है…",
    you: "आप",
    assistant: "VidyaAI",
    newChat: "नई चैट",
    papersTitle: "पिछले वर्षों के प्रश्नपत्र",
    papersNote: "शिक्षक कार्यक्षेत्र छोड़े बिना CGBSE पेपर खोलें या डाउनलोड करें।",
    allSubjects: "सभी विषय",
    open: "खोलें",
    download: "डाउनलोड",
    streak: "सक्रिय दिन",
    roleBadge: "शिक्षक कोपायलट",
    kicker: "शिक्षकों के लिए VIDYAAI",
    brandTagline: "आपका AI शिक्षण साथी",
    logout: "लॉग आउट",
    subject: "विषय",
    classLabel: "कक्षा",
    medium: "माध्यम",
    hero: { kicker: "अच्छी तैयारी से बनती है बेहतरीन कक्षा", title: "आज आप क्या तैयार करना चाहेंगे?", text: "एक ही कार्यक्षेत्र में पाठ्यक्रम बनाएँ, मूल्यांकन तैयार करें, कल का पाठ समझें या VidyaAI से पूछें।", stat: "AI शिक्षक टूल", statNote: "चैट और PYQ सहित" },
    cards: {
      curriculum: { title: "पाठ्यक्रम निर्माता", text: "सप्ताहवार विषय, परिणाम, गतिविधियाँ, मूल्यांकन और पुनरावृत्ति योजना बनाएँ।", action: "पाठ्यक्रम बनाएँ" },
      paper: { title: "टेस्ट एवं पेपर निर्माता", text: "अंक, प्रश्न, समय, कठिनाई, पाठ्यक्रम, उत्तर कुंजी और अंक योजना तय करें।", action: "पेपर बनाएँ" },
      lesson: { title: "कैसे पढ़ाएँ", text: "कक्षा से पहले विषय समझें और मिनट-दर-मिनट शिक्षण रणनीति पाएँ।", action: "पाठ तैयार करें" },
    },
    recent: { title: "हाल के संसाधन", note: "त्वरित उपयोग के लिए संसाधन इस ब्राउज़र में सुरक्षित रहते हैं।", empty: "आपके बनाए पाठ्यक्रम, पेपर और शिक्षण मार्गदर्शिकाएँ यहाँ दिखाई देंगी।", curriculum: "पाठ्यक्रम", paper: "टेस्ट पेपर", lesson: "शिक्षण मार्गदर्शिका" },
    insights: { title: "शिक्षक प्रगति", note: "आपकी तैयारी की गतिविधि", resources: "संसाधन", activeDays: "सक्रिय दिन", curricula: "पाठ्यक्रम", papers: "पेपर", recent: "हाल की गतिविधि", noRecent: "गतिविधि टाइमलाइन शुरू करने के लिए पहला संसाधन बनाएँ।", quick: "त्वरित निर्माण", lastActive: "अंतिम सक्रियता" },
    homeChat: { kicker: "शिक्षक कोपायलट", title: "डैशबोर्ड छोड़े बिना VidyaAI के साथ योजना बनाएँ", note: "अभी शिक्षण से जुड़ा प्रश्न पूछें या लंबी बातचीत के लिए पूरी चैट खोलें।", open: "पूरी चैट खोलें" },
    curriculumForm: { title: "पाठ्यक्रम विवरण", note: "योजना की सीमाएँ दें; VidyaAI क्रम को व्यवस्थित करेगा।", weeks: "अवधि (सप्ताह)", periods: "प्रति सप्ताह पीरियड", teachingMedium: "शिक्षण माध्यम", chapters: "अध्याय या पाठ्यक्रम", chaptersPlaceholder: "उदाहरण: अध्याय 1–6, या अध्याय सूची यहाँ लिखें", goals: "सीखने के लक्ष्य", goalsPlaceholder: "विद्यार्थियों को क्या जानना या कर पाना चाहिए?", loading: "पाठ्यक्रम बन रहा है…", action: "पाठ्यक्रम योजना बनाएँ" },
    paperForm: { title: "प्रश्नपत्र रूपरेखा", note: "अंक और प्रश्न संख्या को निर्माण के दौरान जाँचा जाता है।", marks: "कुल अंक", questions: "प्रश्नों की संख्या", duration: "अवधि (मिनट)", difficulty: "कठिनाई", type: "पेपर का प्रकार", syllabus: "पाठ्यक्रम / अध्याय", syllabusPlaceholder: "उदाहरण: अम्ल, क्षार और लवण; धातु और अधातु", instructions: "अतिरिक्त निर्देश", instructionsPlaceholder: "वैकल्पिक: चित्र, योग्यता-आधारित प्रश्न, आंतरिक विकल्प…", loading: "पेपर बन रहा है…", action: "प्रश्नपत्र बनाएँ" },
    lessonForm: { title: "कल का पाठ तैयार करें", note: "VidyaAI पहले विषय समझाता है, फिर उसे पढ़ाने योग्य कक्षा क्रम में बदलता है।", duration: "पाठ की अवधि", readiness: "विद्यार्थियों की तैयारी", topic: "अध्याय या विषय", topicPlaceholder: "उदाहरण: कक्षा 10 विज्ञान अध्याय 2 — अम्ल, क्षार और लवण", notes: "VidyaAI किन बातों का ध्यान रखे?", notesPlaceholder: "वैकल्पिक: विद्यार्थियों को समीकरण कठिन लगते हैं; लैब उपलब्ध नहीं है…", loading: "पाठ तैयार हो रहा है…", action: "शिक्षण मार्गदर्शिका बनाएँ" },
    options: { hindi: "हिंदी", english: "अंग्रेज़ी", bilingual: "द्विभाषी", easy: "सरल", balanced: "संतुलित", challenging: "कठिन", unit: "इकाई परीक्षा", term: "सत्र परीक्षा", practice: "अभ्यास पेपर", worksheet: "वर्कशीट", mixed: "मिश्रित कक्षा", foundation: "आधार की आवश्यकता", advanced: "उन्नत", general: "सामान्य" },
    result: { error: "संसाधन नहीं बन सका", errorNote: "VidyaAI अभी यह संसाधन नहीं बना सका। कृपया फिर प्रयास करें।", loading: "VidyaAI कक्षा के लिए संसाधन तैयार कर रहा है…", loadingNote: "संरचना, शिक्षण क्रम और पाठ्यक्रम संदर्भ की जाँच हो रही है।", empty: "आपका बनाया संसाधन यहाँ दिखाई देगा", emptyNote: "फॉर्म पूरा करें और VidyaAI संपादन, कॉपी और प्रिंट के लिए तैयार ड्राफ्ट बनाएगा।", generated: "तैयार संसाधन", copy: "कॉपी", print: "प्रिंट / PDF", sources: "प्रयुक्त पाठ्यपुस्तक संदर्भ" },
    papersCount: (count) => `कक्षा 10 · ${count} पेपर`,
    setLabel: "सेट",
    subjectNames: { Hindi: "हिंदी", English: "अंग्रेज़ी", Math: "गणित", Science: "विज्ञान", "Social Science": "सामाजिक विज्ञान", Sanskrit: "संस्कृत" },
  },
};

const toolMeta = {
  en: {
    home: { title: "Teacher Workspace", subtitle: "Plan lessons, build assessments, and prepare confidently for every class." },
    curriculum: { title: "Curriculum Creator", subtitle: "Turn learning goals and chapters into a practical week-wise teaching roadmap." },
    paper: { title: "Test & Paper Creator", subtitle: "Create a balanced, printable paper with an answer key and marking scheme." },
    lesson: { title: "How to Teach", subtitle: "Understand the topic, anticipate misconceptions, and walk into class with a clear plan." },
    chat: { title: "AI Chat", subtitle: "Get curriculum-grounded teaching support inside your workspace." },
    pyq: { title: "PYQ Library", subtitle: "Browse previous board papers for classroom and assessment planning." },
  },
  hi: {
    home: { title: "शिक्षक कार्यक्षेत्र", subtitle: "पाठ की योजना बनाएँ, मूल्यांकन तैयार करें और हर कक्षा के लिए आत्मविश्वास से तैयारी करें।" },
    curriculum: { title: "पाठ्यक्रम निर्माता", subtitle: "सीखने के लक्ष्यों और अध्यायों को सप्ताहवार शिक्षण योजना में बदलें।" },
    paper: { title: "टेस्ट एवं पेपर निर्माता", subtitle: "उत्तर कुंजी और अंक योजना के साथ संतुलित प्रश्नपत्र बनाएँ।" },
    lesson: { title: "कैसे पढ़ाएँ", subtitle: "विषय समझें, सामान्य भ्रम पहचानें और स्पष्ट योजना के साथ कक्षा में जाएँ।" },
    chat: { title: "AI चैट", subtitle: "अपने कार्यक्षेत्र में पाठ्यक्रम-आधारित शिक्षण सहायता पाएँ।" },
    pyq: { title: "PYQ लाइब्रेरी", subtitle: "कक्षा और मूल्यांकन योजना के लिए पुराने बोर्ड प्रश्नपत्र देखें।" },
  },
};

const initialCurriculum = { class_level: "10", subject: "Science", duration_weeks: 16, periods_per_week: 5, chapters: "", learning_goals: "", medium: "Hindi" };
const initialPaper = { class_level: "10", subject: "Science", syllabus: "", total_marks: 50, question_count: 20, duration_minutes: 90, difficulty: "balanced", paper_type: "unit_test", medium: "Hindi", instructions: "" };
const initialLesson = { class_level: "10", subject: "Science", chapter_or_topic: "", lesson_minutes: 45, medium: "Hindi", student_level: "mixed", teacher_notes: "" };

function Field({ label, children, wide = false }) {
  return <label className={wide ? "teacher-field wide" : "teacher-field"}><span>{label}</span>{children}</label>;
}

function FireIcon() {
  const gradientId = useId();
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <defs><linearGradient id={gradientId} x1="7" x2="17" y1="21" y2="2"><stop stopColor="#facc15" /><stop offset=".48" stopColor="#fb923c" /><stop offset="1" stopColor="#ef4444" /></linearGradient></defs>
      <path fill={`url(#${gradientId})`} d="M13.3 2.2c.4 2.5-.2 4.1-1.3 5.6-.9 1.2-2 2.4-2.1 4.3 0 1.1.5 2.1 1.5 2.8-.1-1.5.5-2.6 1.5-3.7.9 1 1.8 2.3 1.8 4 0 2.1-1.7 3.8-3.8 3.8-2.8 0-5-2.2-5-5 0-2.2 1-4.1 2.7-5.9 1.4-1.5 2.3-3.2 1.9-5.2 4 1.7 7.6 5.6 7.6 10.3 0 4.7-3.8 8.5-8.5 8.5S1.7 18 1.7 13.3c0-2.9 1.4-5.4 3.7-7.2-.6 1.2-.9 2.3-.8 3.4.3-1.6 1.2-2.9 2.4-4.1 1.8-1.8 3.4-3.2 6.3-3.2Z" />
    </svg>
  );
}

function TeacherProfile({ profile, logout, t, compact = false }) {
  return (
    <div className={`teacher-header-profile${compact ? " compact" : ""}`}>
      <span>{profile.name?.charAt(0)?.toUpperCase() || "T"}</span>
      <div><strong>{profile.name}</strong><small>{profile.email}</small></div>
      <button type="button" onClick={logout} title={t.logout} aria-label={t.logout}><Icon name="logout" size={18} /></button>
    </div>
  );
}

function TeacherHeaderControls({ profile, logout, t, lang, streak, onToggleLanguage, mobile = false, onOpenChat }) {
  return (
    <div className={mobile ? "teacher-mobile-controls" : "teacher-header-actions"}>
      {!mobile && <button type="button" className="teacher-ask-action" onClick={onOpenChat}>{t.ask}</button>}
      <span className="teacher-streak" title={t.streak}><b><FireIcon /></b><strong>{streak.count || 0}</strong><small>{t.streak}</small></span>
      <button type="button" className={`teacher-language-switch ${lang}`} onClick={onToggleLanguage} aria-label={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"}><span>अ</span><span>A</span></button>
      <TeacherProfile profile={profile} logout={logout} t={t} compact={mobile} />
    </div>
  );
}

function TeacherInsightsRail({ recent, streak, t, lang, onOpenTool, onOpenRecent }) {
  const curriculumCount = recent.filter((item) => item.type === "curriculum").length;
  const paperCount = recent.filter((item) => item.type === "paper").length;
  const quickActions = [
    ["curriculum", "curriculum"],
    ["paper", "paper"],
    ["lesson", "lesson"],
  ];

  return (
    <aside className="teacher-insights-rail" aria-label={t.insights.title}>
      <section className="teacher-insight-card teacher-pulse-card">
        <header><div><span>{t.insights.note}</span><h2>{t.insights.title}</h2></div><i aria-hidden="true"><Icon name="sparkle" size={18} /></i></header>
        <div className="teacher-pulse-grid">
          <div><strong>{recent.length}</strong><span>{t.insights.resources}</span></div>
          <div><strong>{streak.count || 0}</strong><span>{t.insights.activeDays}</span></div>
          <div><strong>{curriculumCount}</strong><span>{t.insights.curricula}</span></div>
          <div><strong>{paperCount}</strong><span>{t.insights.papers}</span></div>
        </div>
        {streak.lastActive && <p><FireIcon /> {t.insights.lastActive}: {new Date(`${streak.lastActive}T00:00:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" })}</p>}
      </section>

      <section className="teacher-insight-card teacher-activity-card">
        <div className="teacher-insight-heading"><h2>{t.insights.recent}</h2><span>{recent.length}</span></div>
        {recent.length ? (
          <div className="teacher-activity-list">
            {recent.slice(0, 4).map((item) => (
              <button key={item.createdAt} type="button" onClick={() => onOpenRecent(item)}>
                <i aria-hidden="true"><Icon name={item.type === "curriculum" ? "curriculum" : item.type === "paper" ? "paper" : "lesson"} size={17} /></i>
                <span><strong>{t.recent[item.type] || t.recent.curriculum}</strong><small>{item.title}</small><time>{new Date(item.createdAt).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" })}</time></span>
              </button>
            ))}
          </div>
        ) : <p className="teacher-activity-empty">{t.insights.noRecent}</p>}
      </section>

      <section className="teacher-insight-card teacher-quick-card">
        <h2>{t.insights.quick}</h2>
        <div>{quickActions.map(([tool, icon]) => <button key={tool} type="button" onClick={() => onOpenTool(tool)}><span><Icon name={icon} size={17} /></span>{t.cards[tool].title}<Icon name="arrowRight" size={15} /></button>)}</div>
      </section>
    </aside>
  );
}

function TeacherChat({ compact = false, t, lang, question, setQuestion, subject, setSubject, loading, messages, onSubmit, onClear, onOpenFull }) {
  const prompts = lang === "hi"
    ? ["कक्षा 10 में प्रकाश का परावर्तन कैसे पढ़ाएँ?", "अम्ल और क्षार के लिए कक्षा गतिविधि बनाएँ।", "कमजोर विद्यार्थियों के लिए भिन्न समझाएँ।"]
    : ["How should I teach reflection of light in Class 10?", "Create a classroom activity for acids and bases.", "Explain fractions for struggling learners."];
  return (
    <section className={`teacher-chat-panel${compact ? " compact" : ""}`}>
      <div className="teacher-chat-toolbar">
        <div><strong>{compact ? t.homeChat.title : t.nav.chat}</strong><span>{compact ? t.homeChat.note : t.chatWelcome}</span></div>
        {!compact && <label><span>{t.subject}</span><select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="General">{t.options.general}</option>{subjects.map((item) => <option key={item} value={item}>{t.subjectNames[item]}</option>)}</select></label>}
        {compact ? <button type="button" onClick={onOpenFull}>{t.homeChat.open} <Icon name="arrowRight" size={17} /></button> : <button type="button" onClick={onClear}>{t.newChat}</button>}
      </div>
      <div className="teacher-chat-window" aria-live="polite">
        {!messages.length && !loading && (
          <div className="teacher-chat-welcome"><span><Icon name="sparkle" size={30} /></span>{!compact && <h2>{t.ask}</h2>}<p>{t.chatWelcome}</p><div>{prompts.slice(0, compact ? 2 : 3).map((prompt) => <button key={prompt} type="button" onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div></div>
        )}
        {messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`teacher-chat-message ${message.role}`}>
            <span>{message.role === "teacher" ? t.you : t.assistant}</span>
            <div><RichMarkdown>{message.content}</RichMarkdown>{message.sources?.length > 0 && <footer>{message.sources.map((source) => <small key={source}>{source}</small>)}</footer>}</div>
          </article>
        ))}
        {loading && <div className="teacher-chat-loading"><div className="teacher-loader" /><span>{t.thinking}</span></div>}
      </div>
      <form className="teacher-chat-form" onSubmit={onSubmit}>
        <textarea rows={compact ? 1 : 2} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.chatPlaceholder} aria-label={t.chatPlaceholder} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
        <button type="submit" disabled={loading || !question.trim()} aria-label={t.send}><span className="teacher-send-label">{loading ? t.thinking : t.send}</span><Icon name="send" size={18} /></button>
      </form>
    </section>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState("home");
  const [lang, setLang] = useState(() => localStorage.getItem("vidyaai_teacher_lang") || "en");
  const [profile, setProfile] = useState({ name: "Teacher", email: "" });
  const [curriculum, setCurriculum] = useState(initialCurriculum);
  const [paper, setPaper] = useState(initialPaper);
  const [lesson, setLesson] = useState(initialLesson);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatSubject, setChatSubject] = useState("General");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [pyqSubject, setPyqSubject] = useState("All");
  const [streak, setStreak] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vidyaai_streak") || "{\"count\":0,\"lastActive\":\"\"}"); } catch { return { count: 0, lastActive: "" }; }
  });

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => {
      if (data.role !== "teacher") {
        navigate("/dashboard", { replace: true });
        return;
      }
      setProfile(data);
    }).catch(() => navigate("/login", { replace: true }));
  }, [navigate]);

  const recentKey = useMemo(() => `vidyaai_teacher_recent_${profile.email || "local"}`, [profile.email]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(recentKey) || "[]")); } catch { setRecent([]); }
  }, [recentKey]);

  const saveRecent = (entry) => {
    const next = [entry, ...recent.filter((item) => item.createdAt !== entry.createdAt)].slice(0, 8);
    setRecent(next);
    localStorage.setItem(recentKey, JSON.stringify(next));
  };

  const recordActivity = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (streak.lastActive === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const next = { count: streak.lastActive === yesterday ? (streak.count || 0) + 1 : 1, lastActive: today };
    setStreak(next);
    localStorage.setItem("vidyaai_streak", JSON.stringify(next));
  };

  const askChat = async (event) => {
    event.preventDefault();
    const question = chatQuestion.trim();
    if (!question || chatLoading) return;
    setChatQuestion("");
    setChatMessages((items) => [...items, { role: "teacher", content: question }]);
    setChatLoading(true);
    recordActivity();
    try {
      const response = await api.post("/chat/ask", { question, subject: chatSubject, answer_style: "detailed" });
      setChatMessages((items) => [...items, { role: "assistant", content: response.data.answer, sources: response.data.sources || [] }]);
    } catch (err) {
      setChatMessages((items) => [...items, { role: "error", content: err?.response?.data?.detail || "VidyaAI could not answer right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const runTool = async (endpoint, payload, title, type) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await api.post(endpoint, payload);
      const entry = { title, type, content: response.data.content, sources: response.data.sources || [], createdAt: new Date().toISOString() };
      setResult(entry);
      saveRecent(entry);
    } catch (err) {
      setError(err?.response?.data?.detail || copy[lang].result.errorNote);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("vidyaai_token");
    localStorage.removeItem("vidyaai_role");
    navigate("/login");
  };

  const copyResult = async () => {
    if (!result?.content) return;
    try { await navigator.clipboard.writeText(result.content); } catch {}
  };

  const openTool = (tool) => {
    setActiveTool(tool);
    setResult(null);
    setError("");
  };

  const toggleLanguage = () => setLang((current) => {
    const next = current === "hi" ? "en" : "hi";
    localStorage.setItem("vidyaai_teacher_lang", next);
    return next;
  });

  const t = copy[lang];
  const meta = toolMeta[lang][activeTool] || toolMeta[lang].home;
  const visiblePapers = pyqSubject === "All" ? assessmentPapers : assessmentPapers.filter((paper) => paper.subject === pyqSubject);
  const pyqSubjects = [...new Set(assessmentPapers.map((paper) => paper.subject))];

  return (
    <div className="teacher-shell">
      <a className="skip-link" href="#teacher-main">{lang === "hi" ? "मुख्य सामग्री पर जाएँ" : "Skip to main content"}</a>
      <aside className="teacher-sidebar">
        <div className="teacher-sidebar-head">
          <BrandMark compact tone="teacher" tagline={t.brandTagline} />
          <TeacherHeaderControls mobile profile={profile} logout={logout} t={t} lang={lang} streak={streak} onToggleLanguage={toggleLanguage} onOpenChat={() => openTool("chat")} />
        </div>
        <div className="teacher-role-badge">{t.roleBadge}</div>
        <nav>
          {[
            ["home", "home"],
            ["curriculum", "curriculum"],
            ["paper", "paper"],
            ["lesson", "lesson"],
          ].map(([id, icon]) => (
            <button key={id} type="button" className={activeTool === id ? "active" : ""} aria-current={activeTool === id ? "page" : undefined} onClick={() => openTool(id)}><span><Icon name={icon} size={17} /></span>{t.nav[id]}</button>
          ))}
        </nav>
        <div className="teacher-shared-tools">
          <p>{t.shared}</p>
          <button type="button" className={activeTool === "chat" ? "active" : ""} aria-current={activeTool === "chat" ? "page" : undefined} onClick={() => openTool("chat")}><span className="teacher-shared-icon"><Icon name="chat" size={17} /></span>{t.nav.chat}<Icon name="arrowRight" size={16} /></button>
          <button type="button" className={activeTool === "pyq" ? "active" : ""} aria-current={activeTool === "pyq" ? "page" : undefined} onClick={() => openTool("pyq")}><span className="teacher-shared-icon"><Icon name="library" size={17} /></span>{t.nav.pyq}<Icon name="arrowRight" size={16} /></button>
        </div>
      </aside>

      <main className="teacher-main" id="teacher-main" tabIndex="-1">
        <header className="teacher-header">
          <div><span className="teacher-kicker">{t.kicker}</span><h1>{meta.title}</h1><p>{meta.subtitle}</p></div>
          <TeacherHeaderControls profile={profile} logout={logout} t={t} lang={lang} streak={streak} onToggleLanguage={toggleLanguage} onOpenChat={() => openTool("chat")} />
        </header>

        {activeTool === "home" && (
          <>
            <section className="teacher-hero">
              <div><span>{t.hero.kicker}</span><h2>{t.hero.title}</h2><p>{t.hero.text}</p></div>
              <div className="teacher-hero-stat"><strong>5</strong><span>{t.hero.stat}</span><small>{t.hero.statNote}</small></div>
            </section>
            <div className="teacher-home-chat-heading"><span>{t.homeChat.kicker}</span></div>
            <TeacherChat compact t={t} lang={lang} question={chatQuestion} setQuestion={setChatQuestion} subject={chatSubject} setSubject={setChatSubject} loading={chatLoading} messages={chatMessages} onSubmit={askChat} onClear={() => setChatMessages([])} onOpenFull={() => openTool("chat")} />
            <section className="teacher-tool-grid">
              {[["curriculum", "curriculum-card"], ["paper", "paper-card"], ["lesson", "lesson-card"]].map(([id, className]) => (
                <article key={id} className={`teacher-tool-card ${className}`}><div className="teacher-tool-icon"><Icon name={id === "curriculum" ? "curriculum" : id === "paper" ? "paper" : "lesson"} size={22} /></div><h3>{t.cards[id].title}</h3><p>{t.cards[id].text}</p><button type="button" onClick={() => openTool(id)}>{t.cards[id].action}<Icon name="arrowRight" size={17} /></button></article>
              ))}
            </section>
            <section className="teacher-recent-panel">
              <div className="teacher-section-head"><div><h2>{t.recent.title}</h2><p>{t.recent.note}</p></div></div>
              {recent.length ? <div className="teacher-recent-list">{recent.slice(0, 5).map((item) => <button key={item.createdAt} type="button" onClick={() => { setResult(item); setActiveTool(item.type); }}><span>{t.recent[item.type] || t.recent.curriculum}</span><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}</small></button>)}</div> : <div className="teacher-empty">{t.recent.empty}</div>}
            </section>
          </>
        )}

        {activeTool === "curriculum" && (
          <section className="teacher-workspace">
            <form onSubmit={(e) => { e.preventDefault(); runTool("/teacher/curriculum", curriculum, `${curriculum.class_level} ${curriculum.subject} curriculum`, "curriculum"); }} className="teacher-generator-form">
              <div className="teacher-form-title"><span>01</span><div><h2>{t.curriculumForm.title}</h2><p>{t.curriculumForm.note}</p></div></div>
              <div className="teacher-form-grid">
                <Field label={t.classLabel}><select value={curriculum.class_level} onChange={(e) => setCurriculum({ ...curriculum, class_level: e.target.value })}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></Field>
                <Field label={t.subject}><select value={curriculum.subject} onChange={(e) => setCurriculum({ ...curriculum, subject: e.target.value })}>{subjects.map((item) => <option key={item} value={item}>{t.subjectNames[item]}</option>)}</select></Field>
                <Field label={t.curriculumForm.weeks}><input type="number" min="1" max="52" value={curriculum.duration_weeks} onChange={(e) => setCurriculum({ ...curriculum, duration_weeks: Number(e.target.value) })} /></Field>
                <Field label={t.curriculumForm.periods}><input type="number" min="1" max="12" value={curriculum.periods_per_week} onChange={(e) => setCurriculum({ ...curriculum, periods_per_week: Number(e.target.value) })} /></Field>
                <Field label={t.curriculumForm.teachingMedium}><select value={curriculum.medium} onChange={(e) => setCurriculum({ ...curriculum, medium: e.target.value })}><option value="Hindi">{t.options.hindi}</option><option value="English">{t.options.english}</option><option value="Bilingual">{t.options.bilingual}</option></select></Field>
                <Field label={t.curriculumForm.chapters} wide><textarea rows="4" value={curriculum.chapters} onChange={(e) => setCurriculum({ ...curriculum, chapters: e.target.value })} placeholder={t.curriculumForm.chaptersPlaceholder} /></Field>
                <Field label={t.curriculumForm.goals} wide><textarea rows="3" value={curriculum.learning_goals} onChange={(e) => setCurriculum({ ...curriculum, learning_goals: e.target.value })} placeholder={t.curriculumForm.goalsPlaceholder} /></Field>
              </div>
              <button className="teacher-generate" type="submit" disabled={loading}>{loading ? t.curriculumForm.loading : t.curriculumForm.action}</button>
            </form>
            {renderResult(result, error, loading, copyResult, t)}
          </section>
        )}

        {activeTool === "paper" && (
          <section className="teacher-workspace">
            <form onSubmit={(e) => { e.preventDefault(); runTool("/teacher/test-paper", paper, `${paper.class_level} ${paper.subject} ${paper.total_marks}-mark paper`, "paper"); }} className="teacher-generator-form">
              <div className="teacher-form-title"><span>02</span><div><h2>{t.paperForm.title}</h2><p>{t.paperForm.note}</p></div></div>
              <div className="teacher-form-grid">
                <Field label={t.classLabel}><select value={paper.class_level} onChange={(e) => setPaper({ ...paper, class_level: e.target.value })}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></Field>
                <Field label={t.subject}><select value={paper.subject} onChange={(e) => setPaper({ ...paper, subject: e.target.value })}>{subjects.map((item) => <option key={item} value={item}>{t.subjectNames[item]}</option>)}</select></Field>
                <Field label={t.paperForm.marks}><input type="number" min="5" max="200" value={paper.total_marks} onChange={(e) => setPaper({ ...paper, total_marks: Number(e.target.value) })} /></Field>
                <Field label={t.paperForm.questions}><input type="number" min="1" max="100" value={paper.question_count} onChange={(e) => setPaper({ ...paper, question_count: Number(e.target.value) })} /></Field>
                <Field label={t.paperForm.duration}><input type="number" min="10" max="360" value={paper.duration_minutes} onChange={(e) => setPaper({ ...paper, duration_minutes: Number(e.target.value) })} /></Field>
                <Field label={t.paperForm.difficulty}><select value={paper.difficulty} onChange={(e) => setPaper({ ...paper, difficulty: e.target.value })}><option value="easy">{t.options.easy}</option><option value="balanced">{t.options.balanced}</option><option value="challenging">{t.options.challenging}</option></select></Field>
                <Field label={t.paperForm.type}><select value={paper.paper_type} onChange={(e) => setPaper({ ...paper, paper_type: e.target.value })}><option value="unit_test">{t.options.unit}</option><option value="term_exam">{t.options.term}</option><option value="practice">{t.options.practice}</option><option value="worksheet">{t.options.worksheet}</option></select></Field>
                <Field label={t.medium}><select value={paper.medium} onChange={(e) => setPaper({ ...paper, medium: e.target.value })}><option value="Hindi">{t.options.hindi}</option><option value="English">{t.options.english}</option><option value="Bilingual">{t.options.bilingual}</option></select></Field>
                <Field label={t.paperForm.syllabus} wide><textarea required rows="4" value={paper.syllabus} onChange={(e) => setPaper({ ...paper, syllabus: e.target.value })} placeholder={t.paperForm.syllabusPlaceholder} /></Field>
                <Field label={t.paperForm.instructions} wide><textarea rows="3" value={paper.instructions} onChange={(e) => setPaper({ ...paper, instructions: e.target.value })} placeholder={t.paperForm.instructionsPlaceholder} /></Field>
              </div>
              <button className="teacher-generate" type="submit" disabled={loading}>{loading ? t.paperForm.loading : t.paperForm.action}</button>
            </form>
            {renderResult(result, error, loading, copyResult, t)}
          </section>
        )}

        {activeTool === "lesson" && (
          <section className="teacher-workspace">
            <form onSubmit={(e) => { e.preventDefault(); runTool("/teacher/lesson-guide", lesson, `${lesson.class_level} ${lesson.subject}: ${lesson.chapter_or_topic}`, "lesson"); }} className="teacher-generator-form">
              <div className="teacher-form-title"><span>03</span><div><h2>{t.lessonForm.title}</h2><p>{t.lessonForm.note}</p></div></div>
              <div className="teacher-form-grid">
                <Field label={t.classLabel}><select value={lesson.class_level} onChange={(e) => setLesson({ ...lesson, class_level: e.target.value })}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></Field>
                <Field label={t.subject}><select value={lesson.subject} onChange={(e) => setLesson({ ...lesson, subject: e.target.value })}>{subjects.map((item) => <option key={item} value={item}>{t.subjectNames[item]}</option>)}</select></Field>
                <Field label={t.lessonForm.duration}><input type="number" min="15" max="180" value={lesson.lesson_minutes} onChange={(e) => setLesson({ ...lesson, lesson_minutes: Number(e.target.value) })} /></Field>
                <Field label={t.lessonForm.readiness}><select value={lesson.student_level} onChange={(e) => setLesson({ ...lesson, student_level: e.target.value })}><option value="mixed">{t.options.mixed}</option><option value="foundation">{t.options.foundation}</option><option value="advanced">{t.options.advanced}</option></select></Field>
                <Field label={t.medium}><select value={lesson.medium} onChange={(e) => setLesson({ ...lesson, medium: e.target.value })}><option value="Hindi">{t.options.hindi}</option><option value="English">{t.options.english}</option><option value="Bilingual">{t.options.bilingual}</option></select></Field>
                <Field label={t.lessonForm.topic} wide><input required value={lesson.chapter_or_topic} onChange={(e) => setLesson({ ...lesson, chapter_or_topic: e.target.value })} placeholder={t.lessonForm.topicPlaceholder} /></Field>
                <Field label={t.lessonForm.notes} wide><textarea rows="3" value={lesson.teacher_notes} onChange={(e) => setLesson({ ...lesson, teacher_notes: e.target.value })} placeholder={t.lessonForm.notesPlaceholder} /></Field>
              </div>
              <button className="teacher-generate" type="submit" disabled={loading}>{loading ? t.lessonForm.loading : t.lessonForm.action}</button>
            </form>
            {renderResult(result, error, loading, copyResult, t)}
          </section>
        )}

        {activeTool === "chat" && (
          <TeacherChat t={t} lang={lang} question={chatQuestion} setQuestion={setChatQuestion} subject={chatSubject} setSubject={setChatSubject} loading={chatLoading} messages={chatMessages} onSubmit={askChat} onClear={() => setChatMessages([])} onOpenFull={() => openTool("chat")} />
        )}

        {activeTool === "pyq" && (
          <section className="teacher-pyq-panel">
            <div className="teacher-pyq-head"><div><h2>{t.papersTitle}</h2><p>{t.papersNote}</p></div><span>{t.papersCount(visiblePapers.length)}</span></div>
            <div className="teacher-pyq-filters" role="tablist" aria-label="PYQ subject">
              <button type="button" className={pyqSubject === "All" ? "active" : ""} onClick={() => setPyqSubject("All")}>{t.allSubjects}</button>
              {pyqSubjects.map((subject) => <button key={subject} type="button" className={pyqSubject === subject ? "active" : ""} onClick={() => setPyqSubject(subject)}>{t.subjectNames[subject]}</button>)}
            </div>
            <div className="teacher-pyq-list">
              {visiblePapers.map((paper) => (
                <article key={paper.file}>
                  <div className="teacher-pyq-file-icon">PDF</div>
                  <div><strong>{paper.kind === "model" ? `${t.classLabel} ${paper.classLevel} ${t.subjectNames[paper.subject]} ${lang === "hi" ? "आदर्श प्रश्नपत्र" : "Model Paper"} ${paper.year}` : `${t.classLabel} ${paper.classLevel} ${t.subjectNames[paper.subject]} PYQ ${paper.year} ${t.setLabel} ${paper.set}`}</strong><span>{paper.year} · {paper.kind === "model" ? (lang === "hi" ? "आदर्श प्रश्नपत्र" : "Model Paper") : `${t.setLabel} ${paper.set}`} · v{paper.version}</span></div>
                  <div><a className="teacher-pyq-open" href={`/pyq/${paper.file}`} target="_blank" rel="noreferrer"><Icon name="externalLink" size={16} />{t.open}</a><a className="teacher-pyq-download" href={`/pyq/${paper.file}`} download><Icon name="download" size={16} />{t.download}</a></div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <TeacherInsightsRail
        recent={recent}
        streak={streak}
        t={t}
        lang={lang}
        onOpenTool={openTool}
        onOpenRecent={(item) => { setResult(item); setActiveTool(item.type); }}
      />
    </div>
  );
}

function renderResult(result, error, loading, onCopy, t) {
  if (error) return <section className="teacher-result error-state"><strong>{t.result.error}</strong><p>{error}</p></section>;
  if (loading) return <section className="teacher-result loading-state"><div className="teacher-loader" /><strong>{t.result.loading}</strong><p>{t.result.loadingNote}</p></section>;
  if (!result) return <section className="teacher-result empty-state"><span><Icon name="sparkle" size={34} /></span><strong>{t.result.empty}</strong><p>{t.result.emptyNote}</p></section>;
  return <section className="teacher-result generated-resource"><header><div><span>{t.result.generated}</span><h2>{result.title}</h2></div><div><button type="button" onClick={onCopy}>{t.result.copy}</button><button type="button" onClick={() => window.print()}>{t.result.print}</button></div></header><article><RichMarkdown>{result.content}</RichMarkdown></article>{result.sources?.length > 0 && <footer><strong>{t.result.sources}</strong>{result.sources.map((source) => <span key={source}>{source}</span>)}</footer>}</section>;
}
