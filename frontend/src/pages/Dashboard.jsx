import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RichMarkdown from "../components/RichMarkdown";
import api from "../api/client";
import CompanyLegalFooter from "../components/CompanyLegalFooter";
import Icon from "../components/Icon";
import GuidedTour from "../components/GuidedTour";
import ConnectionStatus from "../components/ConnectionStatus";

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
    profileLabels: { name: "नाम", class: "कक्षा", medium: "माध्यम", status: "स्थिति", guest: "अतिथि", loggedIn: "लॉग इन" },
    sidebarTagline: "छात्रों के लिए सरल, हल्का और उपयोगी सीखने का अनुभव",
    brandTagline: "आपका स्मार्ट पढ़ाई साथी",
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
    examDateLabel: "परीक्षा तिथि",
    todayTargetTitle: "आज का लक्ष्य",
    targetProgress: (done, total) => `${done}/${total} पूरे`,
    streakTitle: "अध्ययन स्ट्रीक",
    streakUnit: "दिन",
    streakNote: "आज एक लक्ष्य पूरा करके streak बचाएं।",
    navChat: "AI चैट",
    navQuiz: "क्विज़",
    navPyq: "पुराने प्रश्नपत्र",
    navPlan: "अध्ययन योजना",
    papersTitle: "पिछले वर्षों के प्रश्नपत्र",
    papersNote: "एक प्रश्नपत्र चुनें और VidyaAI के साथ अभ्यास शुरू करें।",
    startPaper: "अभ्यास",
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
    navChat: "Chat",
    navQuiz: "Quiz",
    navPyq: "PYQ",
    navPlan: "Study Plan",
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
  { id: "summary", hi: "सारांश", en: "Summary" },
  { id: "two", hi: "2 अंक", en: "2 marks" },
  { id: "five", hi: "5 अंक", en: "5 marks" },
  { id: "qa", hi: "प्रश्नोत्तर", en: "Q&A" },
  { id: "exam", hi: "मॉक टेस्ट", en: "Mock test" },
];

const suggestionChips = [
  { hi: "अध्याय 3 सारांश", en: "Chapter 3 summary" },
  { hi: "मीरा बाई कविता", en: "Meera Bai poem" },
  { hi: "5 अंक प्रश्न", en: "5-mark question" },
  { hi: "परीक्षा टिप्स", en: "Exam tips" },
];

const importantTopicsBySubject = {
  Hindi: ["गद्य-पद्य सारांश", "कवि/लेखक परिचय", "केंद्रीय भाव", "2 और 5 अंक प्रश्न", "व्याकरण अभ्यास"],
  Science: ["रासायनिक अभिक्रियाएं", "अम्ल क्षार और लवण", "धातु-अधातु", "प्रकाश", "विद्युत", "जीव विज्ञान के आरेख"],
  Math: ["वास्तविक संख्याएं", "बहुपद", "द्विघात समीकरण", "समांतर श्रेणी", "त्रिकोणमिति", "क्षेत्रमिति"],
  "Social Science": ["इतिहास की महत्वपूर्ण घटनाएं", "भूगोल मानचित्र", "नागरिक शास्त्र", "अर्थशास्त्र", "लघु और दीर्घ उत्तर"],
  English: ["Prose and poetry summary", "Theme and character sketch", "Grammar", "Letter/application", "Writing section"],
  Sanskrit: ["अनुवाद", "संधि", "समास", "श्लोक अर्थ", "लघु उत्तरीय प्रश्न"],
};

const chapterPlanner = {
  Hindi: [
    { chapter: "गद्य खंड", topics: ["लेखक परिचय", "मुख्य घटना", "चरित्र चित्रण"], practice: "2 अंक के 3 प्रश्न और 5 अंक का 1 उत्तर लिखें" },
    { chapter: "पद्य खंड", topics: ["केंद्रीय भाव", "काव्य सौंदर्य", "व्याख्या"], practice: "एक पद्यांश की व्याख्या और 2 PYQ प्रश्न करें" },
    { chapter: "व्याकरण", topics: ["संधि", "समास", "मुहावरे"], practice: "10 वस्तुनिष्ठ/लघु प्रश्न हल करें" },
  ],
  Science: [
    { chapter: "रासायनिक अभिक्रियाएं", topics: ["संतुलित समीकरण", "ऑक्सीकरण-अपचयन", "दैनिक जीवन उदाहरण"], practice: "PYQ से 2 अंक और 5 अंक के प्रश्न करें" },
    { chapter: "अम्ल, क्षार और लवण", topics: ["pH", "लवण", "सूचक"], practice: "कारण सहित 5 छोटे उत्तर लिखें" },
    { chapter: "प्रकाश", topics: ["परावर्तन", "अपवर्तन", "लेंस आरेख"], practice: "2 ray diagram और 3 numericals करें" },
    { chapter: "विद्युत", topics: ["ओम का नियम", "श्रृंखला/समांतर", "विद्युत शक्ति"], practice: "सूत्र आधारित 5 प्रश्न हल करें" },
  ],
  Math: [
    { chapter: "द्विघात समीकरण", topics: ["गुणनखंड", "सूत्र विधि", "प्रकृति"], practice: "PYQ से 5 questions step-by-step हल करें" },
    { chapter: "समांतर श्रेणी", topics: ["nth term", "sum", "word problems"], practice: "कम से कम 6 mixed questions करें" },
    { chapter: "त्रिकोणमिति", topics: ["identity", "height-distance", "values"], practice: "formula recall + 4 board questions" },
    { chapter: "क्षेत्रमिति", topics: ["surface area", "volume", "combined solids"], practice: "3 long numericals timed mode में करें" },
  ],
  "Social Science": [
    { chapter: "इतिहास", topics: ["राष्ट्रीय आंदोलन", "महत्वपूर्ण तिथियां", "कारण-परिणाम"], practice: "5 अंक के 2 उत्तर point-wise लिखें" },
    { chapter: "भूगोल", topics: ["संसाधन", "मानचित्र", "कृषि/उद्योग"], practice: "map practice + 3 short answers" },
    { chapter: "नागरिक शास्त्र", topics: ["लोकतंत्र", "संविधान", "शक्तियां"], practice: "कारण सहित 4 प्रश्न करें" },
    { chapter: "अर्थशास्त्र", topics: ["विकास", "मुद्रा", "वैश्वीकरण"], practice: "definitions + examples वाले उत्तर लिखें" },
  ],
  English: [
    { chapter: "Prose", topics: ["theme", "character", "value points"], practice: "2 short answers + 1 long answer" },
    { chapter: "Poetry", topics: ["central idea", "poetic devices", "stanza explanation"], practice: "one stanza explanation and 3 PYQ questions" },
    { chapter: "Writing", topics: ["letter", "application", "paragraph"], practice: "one timed writing task" },
    { chapter: "Grammar", topics: ["tenses", "modals", "editing"], practice: "15 grammar questions" },
  ],
  Sanskrit: [
    { chapter: "पाठ अनुवाद", topics: ["शब्दार्थ", "भावार्थ", "प्रश्नोत्तर"], practice: "एक गद्यांश का हिंदी अनुवाद करें" },
    { chapter: "व्याकरण", topics: ["संधि", "समास", "कारक"], practice: "10 रूप/व्याकरण प्रश्न करें" },
    { chapter: "श्लोक", topics: ["अर्थ", "अन्वय", "व्याख्या"], practice: "2 श्लोक अर्थ सहित लिखें" },
  ],
};

const pyqStyleQuestionsBySubject = {
  Hindi: [
    { marks: "2 अंक", topic: "केंद्रीय भाव", question: "किसी पाठ/कविता का केंद्रीय भाव अपने शब्दों में लिखिए।" },
    { marks: "5 अंक", topic: "चरित्र/व्याख्या", question: "मुख्य पात्र/कवि के विचारों को उदाहरण सहित समझाइए।" },
    { marks: "प्रश्नोत्तर", topic: "पद्यांश", question: "दिए गए पद्यांश की प्रसंग सहित व्याख्या कीजिए।" },
  ],
  Science: [
    { marks: "2 अंक", topic: "अम्ल क्षार और लवण", question: "pH मान का दैनिक जीवन में महत्व दो उदाहरण सहित लिखिए।" },
    { marks: "3 अंक", topic: "प्रकाश", question: "उत्तल लेंस द्वारा प्रतिबिंब बनने की स्थिति ray diagram से समझाइए।" },
    { marks: "5 अंक", topic: "विद्युत", question: "श्रृंखला और समांतर संयोजन में अंतर लिखकर एक numerical हल कीजिए।" },
  ],
  Math: [
    { marks: "2 अंक", topic: "द्विघात समीकरण", question: "x² - 5x + 6 = 0 के मूल ज्ञात कीजिए।" },
    { marks: "3 अंक", topic: "समांतर श्रेणी", question: "AP में a = 3, d = 4 हो तो 20वां पद और पहले 20 पदों का योग ज्ञात कीजिए।" },
    { marks: "5 अंक", topic: "क्षेत्रमिति", question: "एक संयुक्त ठोस का आयतन और पृष्ठीय क्षेत्रफल निकालने वाला प्रश्न हल कीजिए।" },
  ],
  "Social Science": [
    { marks: "2 अंक", topic: "इतिहास", question: "राष्ट्रीय आंदोलन में किसी एक प्रमुख घटना का महत्व लिखिए।" },
    { marks: "3 अंक", topic: "भूगोल", question: "संसाधन संरक्षण क्यों आवश्यक है? तीन कारण लिखिए।" },
    { marks: "5 अंक", topic: "नागरिक शास्त्र", question: "लोकतंत्र की प्रमुख विशेषताएं उदाहरण सहित समझाइए।" },
  ],
  English: [
    { marks: "2 marks", topic: "Poetry", question: "Write the central idea of a poem you have studied." },
    { marks: "3 marks", topic: "Grammar", question: "Attempt a short editing/omission question with correct answers." },
    { marks: "5 marks", topic: "Writing", question: "Write an application/letter in proper board-exam format." },
  ],
  Sanskrit: [
    { marks: "2 अंक", topic: "अनुवाद", question: "किसी पाठ के दो वाक्यों का हिंदी अनुवाद कीजिए।" },
    { marks: "3 अंक", topic: "व्याकरण", question: "संधि/समास के तीन उदाहरण हल कीजिए।" },
    { marks: "5 अंक", topic: "श्लोक", question: "किसी श्लोक का अर्थ और भावार्थ लिखिए।" },
  ],
};

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

function StreamingMarkdown({ text, animate, onProgress }) {
  const tokens = (text || "").match(/\S+\s*/g) || [];
  const [visibleCount, setVisibleCount] = useState(animate ? 0 : tokens.length);

  useEffect(() => {
    if (!animate) {
      setVisibleCount(tokens.length);
      return undefined;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisibleCount(tokens.length);
      return undefined;
    }
    setVisibleCount(0);
    const wordsPerTick = Math.max(1, Math.ceil(tokens.length / 320));
    const timer = window.setInterval(() => {
      setVisibleCount((current) => {
        const next = Math.min(current + wordsPerTick, tokens.length);
        if (next >= tokens.length) window.clearInterval(timer);
        return next;
      });
      onProgress?.();
    }, 28);
    return () => window.clearInterval(timer);
  }, [animate, text]);

  const isStreaming = visibleCount < tokens.length;
  return (
    <div className={`streaming-markdown${isStreaming ? " is-streaming" : ""}`} aria-live="polite">
      <RichMarkdown streaming={isStreaming}>{tokens.slice(0, visibleCount).join("")}</RichMarkdown>
    </div>
  );
}

function AssistantResponse({ message, animationRegistry, onProgress }) {
  const animationKey = message.streamId || message.sessionId || message.text;
  const [animate] = useState(() => message.animateResponse && !animationRegistry.has(animationKey));

  useEffect(() => {
    if (animate) animationRegistry.add(animationKey);
  }, [animate, animationKey, animationRegistry]);

  return <StreamingMarkdown text={message.text} animate={animate} onProgress={onProgress} />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState(() => localStorage.getItem("vidyaai_student_lang") || "hi");
  const [studentName, setStudentName] = useState("विद्यार्थी");
  const [studentProfile, setStudentProfile] = useState(null);
  const [question, setQuestion] = useState(() => localStorage.getItem("vidyaai_student_question_draft") || "");
  const [messages, setMessages] = useState(() => [
    { role: "assistant", text: translations.hi.welcomeMsg },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountRole, setAccountRole] = useState(() => localStorage.getItem("vidyaai_role") || "student");
  const [adminStats, setAdminStats] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [examDate, setExamDate] = useState(() => localStorage.getItem("vidyaai_exam_date") || defaultExamDate());
  const [completedTargets, setCompletedTargets] = useState(() => readJson(`vidyaai_targets_${dateKey()}`, []));
  const [streak, setStreak] = useState(() => readJson("vidyaai_streak", { count: 0, lastActive: "" }));
  const [selectedSubject, setSelectedSubject] = useState("Hindi");
  const [answerStyle, setAnswerStyle] = useState("exam");
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("chat");
  const [standaloneQuiz, setStandaloneQuiz] = useState(null);
  const [pyqQuiz, setPyqQuiz] = useState(null);
  const [pyqLoadingFile, setPyqLoadingFile] = useState("");
  const [pyqPapers, setPyqPapers] = useState([]);
  const [pyqCatalogLoaded, setPyqCatalogLoaded] = useState(false);
  const [quizSubject, setQuizSubject] = useState("Hindi");
  const [pyqSubject, setPyqSubject] = useState("Hindi");
  const [studyHours, setStudyHours] = useState(3);
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState(6);
  const [studyGoal, setStudyGoal] = useState("balanced");
  const [planSubjects, setPlanSubjects] = useState(() => readJson("vidyaai_plan_subjects", ["Hindi", "Math", "Science", "Social Science", "English"]));
  const [studyPlan, setStudyPlan] = useState([]);
  const [showRecentPanel, setShowRecentPanel] = useState(false);
  const windowRef = useRef(null);
  const messagesEndRef = useRef(null);
  const profileMenuRef = useRef(null);
  const animatedMessagesRef = useRef(new Set());

  const t = translations[lang];
  const toggleLanguage = () => setLang((currentLang) => {
    const nextLang = currentLang === "hi" ? "en" : "hi";
    localStorage.setItem("vidyaai_student_lang", nextLang);
    return nextLang;
  });
  const todayIndex = Math.floor(new Date().getTime() / 86400000) % dailyTargets.length;
  const todaysTargets = dailyTargets[todayIndex];
  const completedCount = todaysTargets.filter((item) => completedTargets.includes(item.id)).length;
  const daysToExam = Math.max(Math.ceil((new Date(examDate) - new Date()) / 86400000), 0);
  const askedQuestions = messages.filter((message) => message.role === "student");
  const recentQuestions = askedQuestions.slice(-4).reverse();
  const selectedSubjectSamples = subjectQuestionSamples[selectedSubject] || [];
  const chatSuggestions = selectedSubjectSamples.length
    ? selectedSubjectSamples.map((sample) => sample[lang])
    : suggestionChips.map((chip) => chip[lang]);
  const learningSubjects = studentProfile?.subject_activity || [];
  const maxSubjectQuestions = Math.max(...learningSubjects.map((item) => item.questions || 0), 1);
  const classLevel = studentProfile?.class_level || "10";
  const medium = studentProfile?.medium || "Hindi";
  const pyqSubjects = subjects
    .map((subject) => ({
      subject,
      count: pyqPapers.filter((paper) => paper.subject === subject.id).length,
    }))
    .filter((group) => group.count > 0);
  const selectedPyqSubjectMeta = subjects.find((subject) => subject.id === pyqSubject) || subjects[0];
  const selectedPyqPapers = pyqPapers.filter((paper) => paper.subject === pyqSubject);
  const tourSteps = lang === "hi" ? [
    { target: ".dashboard-left-nav", icon: "home", kicker: "VIDYAAI का परिचय", title: "आपका अध्ययन नियंत्रण केंद्र", body: "नई चैट शुरू करें, पुराने प्रश्न खोलें और चैट, PYQ, योजना तथा क्विज़ टूल्स के बीच जाएँ।", skipLabel: "टूर छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "पढ़ाई शुरू करें" },
    { target: ".dashboard-chat-panel", icon: "chat", kicker: "AI STUDY ASSISTANT", title: "किसी भी विषय पर प्रश्न पूछें", body: "विषय और उत्तर शैली चुनें, फिर हिंदी या English में सवाल लिखें। VidyaAI पाठ्यक्रम के अनुसार समझाने और अभ्यास कराने में मदद करेगा।", skipLabel: "टूर छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "पढ़ाई शुरू करें" },
    { target: ".dashboard-main-top", icon: "sparkle", kicker: "आपकी पसंद", title: "भाषा और प्रोफाइल हमेशा पास हैं", body: "ऊपर से भाषा बदलें, स्ट्रीक देखें और अपने प्रोफाइल तथा प्रगति की जानकारी खोलें।", skipLabel: "टूर छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "पढ़ाई शुरू करें" },
    { target: ".dashboard-right-rail", icon: "chart", kicker: "LEARNING TRACKER", title: "अपनी प्रगति समझें", body: "विषय बदलें, क्विज़ औसत देखें और उन कमजोर टॉपिक्स पर वापस जाएँ जिन्हें अधिक अभ्यास चाहिए।", skipLabel: "टूर छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "पढ़ाई शुरू करें" },
  ] : [
    { target: ".dashboard-left-nav", icon: "home", kicker: "MEET VIDYAAI", title: "Your study control centre", body: "Start a new chat, revisit questions, and move between Chat, PYQs, Study Plan, and Quiz tools.", skipLabel: "Skip tour", backLabel: "Back", nextLabel: "Next", finishLabel: "Start studying" },
    { target: ".dashboard-chat-panel", icon: "chat", kicker: "AI STUDY ASSISTANT", title: "Ask about any subject", body: "Choose a subject and answer style, then ask in Hindi or English. VidyaAI helps explain, revise, and practise within your curriculum.", skipLabel: "Skip tour", backLabel: "Back", nextLabel: "Next", finishLabel: "Start studying" },
    { target: ".dashboard-main-top", icon: "sparkle", kicker: "YOUR PREFERENCES", title: "Language and profile stay close", body: "Use the header to switch language, check your streak, and open your profile and learning summary.", skipLabel: "Skip tour", backLabel: "Back", nextLabel: "Next", finishLabel: "Start studying" },
    { target: ".dashboard-right-rail", icon: "chart", kicker: "LEARNING TRACKER", title: "Understand your progress", body: "Change subjects, review quiz averages, and return to weak topics that need more practice.", skipLabel: "Skip tour", backLabel: "Back", nextLabel: "Next", finishLabel: "Start studying" },
  ];

  useEffect(() => {
    const requestedSection = new URLSearchParams(location.search).get("section");
    if (["chat", "quiz", "pyq", "plan"].includes(requestedSection)) {
      setActiveSection(requestedSection);
    }
  }, [location.search]);

  useEffect(() => { localStorage.setItem("vidyaai_student_question_draft", question); }, [question]);

  useEffect(() => {
    if (activeSection !== "pyq" || pyqPapers.length) return;
    import("../data/assessmentPapers").then(({ assessmentPapers }) => setPyqPapers(assessmentPapers)).finally(() => setPyqCatalogLoaded(true));
  }, [activeSection, pyqPapers.length]);

  const inferSubject = (text) => {
    const q = (text || "").toLowerCase();
    if (/\b(math|maths|ganit|algebra|geometry|trigonometry|quadratic|equation|probability)\b/.test(q) || q.includes("गणित") || /\d+\s*[+×÷=]/.test(q)) return "Math";
    if (/\b(science|vigyan|physics|chemistry|biology|acid|base|electricity|light|carbon)\b/.test(q) || q.includes("विज्ञान")) return "Science";
    if (/\b(social science|sst|history|geography|civics|economics|itihas|bhugol)\b/.test(q) || q.includes("इतिहास") || q.includes("भूगोल")) return "Social Science";
    if (/\b(english|grammar|essay|letter|tense|voice|narration)\b/.test(q)) return "English";
    if (/\b(sanskrit|sanskrut|shlok|shloka)\b/.test(q) || q.includes("संस्कृत")) return "Sanskrit";
    if (/\b(hindi|vyakaran|nibandh|patra|muhavara)\b/.test(q) || q.includes("हिंदी") || q.includes("हिन्दी")) return "Hindi";
    return "General";
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/auth/me");
        if (response?.data?.name) {
          setStudentName(response.data.name);
          let mergedProfile = response.data;
          try {
            const profileResponse = await api.get("/profile/summary");
            mergedProfile = { ...response.data, ...profileResponse.data };
          } catch {}
          setStudentProfile(mergedProfile);
          if (response.data.exam_date) {
            const profileExamDate = dateKey(new Date(response.data.exam_date));
            setExamDate(profileExamDate);
            localStorage.setItem("vidyaai_exam_date", profileExamDate);
          }
          setIsGuest(false);
          setIsAdmin(Boolean(response.data.is_admin));
          setAccountRole(response.data.role || "student");
          localStorage.setItem("vidyaai_role", response.data.role || "student");
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
    if (!showProfileMenu) return;

    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (askedQuestions.length === 0) {
        if (windowRef.current) windowRef.current.scrollTop = 0;
        return;
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ block: "end" });
      } else if (windowRef.current) {
        windowRef.current.scrollTop = windowRef.current.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, isLoading, askedQuestions.length]);

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

  const refreshLearningProfile = async () => {
    try {
      const profileResponse = await api.get("/profile/summary");
      setStudentProfile((prev) => ({ ...(prev || {}), ...profileResponse.data }));
    } catch {}
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

  const handleLogout = () => {
    localStorage.removeItem("vidyaai_token");
    localStorage.removeItem("vidyaai_role");
    setStudentProfile(null);
    setStudentName("अतिथि विद्यार्थी");
    setIsGuest(true);
    setShowProfileMenu(false);
    navigate("/login");
  };

  const askQuestion = async (currentQuestion, subjectOverride = null, answerStyleOverride = null) => {
    if (!currentQuestion || isLoading) return;

    recordStudyActivity();
    const promptSubject = inferSubject(currentQuestion);
    const outgoingSubject = promptSubject !== "General" ? promptSubject : (subjectOverride || selectedSubject || "General");
    const outgoingAnswerStyle = answerStyleOverride || answerStyle;
    setQuestion("");
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "student",
        text: currentQuestion,
        question: currentQuestion,
        subject: outgoingSubject,
        answerStyle: outgoingAnswerStyle,
      },
    ]);

    try {
      const response = await api.post("/chat/ask", {
        question: currentQuestion,
        subject: outgoingSubject,
        answer_style: outgoingAnswerStyle,
      });
      const assistantMessage = {
        role: "assistant",
        text: response?.data?.answer || t.welcomeMsg,
        sessionId: response?.data?.session_id,
        streamId: `${response?.data?.session_id || "answer"}-${Date.now()}`,
        animateResponse: true,
        question: currentQuestion,
        subject: outgoingSubject,
        answerStyle: outgoingAnswerStyle,
        chapterOptions: response?.data?.chapter_options || [],
        feedback: null,
      };

      setMessages((prev) => [
        ...prev,
        assistantMessage,
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

  const generateActivityQuiz = async (message) => {
    setQuizLoading(true);
    try {
      const response = await api.post("/quiz/generate", {
        subject: message.subject || selectedSubject || "General",
        chapter: null,
        topic: null,
        source_session_id: message.sessionId,
        source_question: message.question,
        source_answer: message.text,
        quiz_type: "activity",
        count: 2,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "quiz",
          text: "Quick MCQ practice",
          quiz: response.data,
          selectedAnswers: {},
          result: null,
          status: "started",
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const generateSubjectQuiz = async (subject = quizSubject) => {
    if (quizLoading) return;
    setQuizLoading(true);
    setStandaloneQuiz(null);
    const topics = importantTopicsBySubject[subject] || importantTopicsBySubject.Hindi;
    try {
      const response = await api.post("/quiz/generate", {
        subject,
        chapter: null,
        topic: `${subject} important topics`,
        source_question: `Create Class ${classLevel} ${subject} MCQ practice from important board exam topics.`,
        source_answer: `Important topics for Class ${classLevel} ${subject}: ${topics.join(", ")}. Medium: ${medium}. Ask exam-oriented concept questions from these topics.`,
        quiz_type: "subject",
        count: 5,
      });
      setStandaloneQuiz({
        role: "quiz",
        text: `${subject} MCQ Practice`,
        quiz: response.data,
        selectedAnswers: {},
        result: null,
        status: "started",
      });
      setActiveSection("quiz");
    } catch (err) {
      setStandaloneQuiz({
        role: "quiz",
        text: "Quiz unavailable",
        error: "Quiz service is not ready. Please login and try again after the backend database is available.",
        quiz: null,
        selectedAnswers: {},
        result: null,
        status: "error",
      });
    } finally {
      setQuizLoading(false);
    }
  };

  const generatePyqQuiz = async (paper) => {
    if (pyqLoadingFile) return;
    const sourceFile = paper.fileUrl.split("/").pop();
    setPyqLoadingFile(sourceFile);
    setPyqQuiz(null);
    try {
      const response = await api.post("/quiz/generate", {
        subject: paper.subject,
        chapter: `${paper.year} Set ${paper.set}`,
        topic: `${paper.subject} ${paper.year} Set ${paper.set} PYQ`,
        quiz_type: "pyq",
        count: 5,
        paper_source_file: sourceFile,
        paper_year: paper.year,
        paper_set: paper.set,
      });
      setSelectedSubject(paper.subject);
      setQuizSubject(paper.subject);
      setPyqQuiz({
        role: "quiz",
        text: `${paper.title} Practice`,
        quiz: response.data,
        selectedAnswers: {},
        result: null,
        status: "started",
      });
    } catch (err) {
      const detail = err?.response?.data?.detail || "This paper could not be loaded from the PYQ knowledge base.";
      setPyqQuiz({ role: "quiz", text: `${paper.title} Practice`, error: detail, quiz: null, status: "error" });
    } finally {
      setPyqLoadingFile("");
    }
  };

  const updateQuizMessage = (quizId, updater) => {
    setMessages((prev) => prev.map((message) => (
      message.role === "quiz" && message.quiz?.quiz_id === quizId ? updater(message) : message
    )));
    setStandaloneQuiz((message) => (
      message?.role === "quiz" && message.quiz?.quiz_id === quizId ? updater(message) : message
    ));
    setPyqQuiz((message) => (
      message?.role === "quiz" && message.quiz?.quiz_id === quizId ? updater(message) : message
    ));
  };

  const handleQuizOption = (quizId, questionId, optionIndex) => {
    updateQuizMessage(quizId, (message) => ({
      ...message,
      selectedAnswers: { ...(message.selectedAnswers || {}), [questionId]: optionIndex },
    }));
  };

  const handleQuizSubmit = async (quizId, selectedAnswers) => {
    const response = await api.post(`/quiz/${quizId}/submit`, { answers: selectedAnswers || {} });
    updateQuizMessage(quizId, (message) => ({
      ...message,
      result: response.data,
      status: "completed",
    }));
    await refreshLearningProfile();
  };

  const handleQuizSkip = async (quizId) => {
    try {
      await api.post(`/quiz/${quizId}/skip`);
    } finally {
      updateQuizMessage(quizId, (message) => ({ ...message, status: "skipped" }));
      await refreshLearningProfile();
    }
  };

  const buildStudyPlan = () => {
    const parsedHours = Math.min(8, Math.max(0.5, Number(studyHours) || 2));
    const days = Math.max(Math.ceil((new Date(examDate) - new Date()) / 86400000), 1);
    const planLength = Math.min(days, 30);
    const chosenSubjects = planSubjects.length ? planSubjects : [selectedSubject];
    const totalMinutes = parsedHours * 60;
    const activeDays = Array.from({ length: planLength }, (_, index) => index)
      .filter((index) => (index % 7) < Number(studyDaysPerWeek));
    const nextPlan = activeDays.map((index, planIndex) => {
      const priorityOffset = studyGoal === "weak" && chosenSubjects.includes(selectedSubject) && planIndex % 3 === 0;
      const subject = priorityOffset ? selectedSubject : chosenSubjects[planIndex % chosenSubjects.length];
      const subjectPlan = chapterPlanner[subject] || chapterPlanner.Hindi;
      const chapter = subjectPlan[Math.floor(planIndex / chosenSubjects.length) % subjectPlan.length];
      const secondSubject = chosenSubjects[(planIndex + 1) % chosenSubjects.length];
      const secondPlan = chapterPlanner[secondSubject] || chapterPlanner.Hindi;
      const secondChapter = secondPlan[Math.floor(planIndex / chosenSubjects.length) % secondPlan.length];
      const practiceRatio = studyGoal === "pyq" ? 0.5 : studyGoal === "revision" ? 0.25 : 0.35;
      const revisionMinutes = Math.round(totalMinutes * (studyGoal === "revision" ? 0.55 : 0.4));
      const practiceMinutes = Math.round(totalMinutes * practiceRatio);
      const testMinutes = totalMinutes - revisionMinutes - practiceMinutes;
      return {
        day: index + 1,
        date: dateKey(addDays(new Date(), index)),
        subject,
        chapter: chapter.chapter,
        topics: chapter.topics,
        secondarySubject: secondSubject,
        hours: parsedHours,
        blocks: [
          `${revisionMinutes} min: ${subject} - ${chapter.chapter}: ${chapter.topics.join(", ")}`,
          `${practiceMinutes} min: ${chapter.practice}`,
          `${testMinutes} min: ${secondSubject} quick revision - ${secondChapter.chapter}`,
          "Last 10 min: mistakes notebook update + tomorrow's weak topic mark करें",
        ],
      };
    });
    localStorage.setItem("vidyaai_plan_subjects", JSON.stringify(chosenSubjects));
    setStudyPlan(nextPlan);
    setActiveSection("plan");
  };

  const buildMockTestText = (subject) => {
    const subjectLabel = subjects.find((item) => item.id === subject)?.[lang] || subject;
    const questions = pyqStyleQuestionsBySubject[subject] || pyqStyleQuestionsBySubject.Hindi;
    const topicHint = importantTopicsBySubject[subject]?.[0] || "important topic";
    if (lang === "hi") {
      return [
        `## ${subjectLabel} मॉक टेस्ट`,
        `**फोकस टॉपिक:** ${topicHint}`,
        "",
        "पहले ये सवाल खुद लिखकर हल करें। उत्तर लिखने के बाद मुझे भेजें, मैं जांचकर सुधार बताऊंगा।",
        "",
        ...questions.slice(0, 3).map((item, index) => `${index + 1}. **${item.marks} | ${item.topic}:** ${item.question}`),
      ].join("\n");
    }
    return [
      `## ${subjectLabel} Mock Test`,
      `**Focus topic:** ${topicHint}`,
      "",
      "Attempt these first. Send your answer afterwards and I will check it with improvements.",
      "",
      ...questions.slice(0, 3).map((item, index) => `${index + 1}. **${item.marks} | ${item.topic}:** ${item.question}`),
    ].join("\n");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await askQuestion(question.trim());
  };

  const handleAnswerStyleClick = async (style) => {
    setAnswerStyle(style.id);
    if (style.id !== "exam" || isLoading) return;

    recordStudyActivity();
    setActiveSection("chat");
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: buildMockTestText(selectedSubject),
        question: "Mock test",
        subject: selectedSubject,
        answerStyle: style.id,
        feedback: null,
      },
    ]);
  };

  const handleChapterOption = async (option) => {
    const optionSubject = option.subject || selectedSubject || "Hindi";
    setSelectedSubject(optionSubject);
    await askQuestion(option.prompt || `class 10 ${optionSubject} chapter ${option.section}`, optionSubject);
  };

  const renderQuizCard = (message) => {
    if (message?.error) {
      return <p className="quiz-status">{message.error}</p>;
    }
    if (!message?.quiz) {
      return <p className="quiz-status">Choose a subject to start MCQ practice.</p>;
    }
    return (
      <div className="quiz-card">
        <div className="quiz-card-head">
          <div>
            <strong>{message.text || "MCQ Practice"}</strong>
            <span>{message.quiz?.subject} · {message.quiz?.topic}</span>
          </div>
          {message.status === "started" && (
            <button type="button" className="quiz-skip-btn" onClick={() => handleQuizSkip(message.quiz.quiz_id)}>
              Skip
            </button>
          )}
        </div>
        {message.status === "skipped" ? (
          <p className="quiz-status">Skipped. You can continue studying.</p>
        ) : (
          <>
            <div className="quiz-question-list">
              {message.quiz?.questions?.map((quizQuestion, qIndex) => {
                const selected = message.selectedAnswers?.[quizQuestion.id];
                const detail = message.result?.details?.find((item) => item.id === quizQuestion.id);
                return (
                  <div key={quizQuestion.id} className="quiz-question">
                    <p>{qIndex + 1}. {quizQuestion.prompt}</p>
                    <div className="quiz-options">
                      {quizQuestion.options.map((option, optionIndex) => (
                        <button
                          key={option}
                          type="button"
                          className={[
                            selected === optionIndex ? "selected" : "",
                            detail?.correct_option === optionIndex ? "correct" : "",
                            detail && selected === optionIndex && !detail.is_correct ? "wrong" : "",
                          ].filter(Boolean).join(" ")}
                          onClick={() => handleQuizOption(message.quiz.quiz_id, quizQuestion.id, optionIndex)}
                          disabled={Boolean(message.result)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {detail?.explanation && <small>{detail.explanation}</small>}
                  </div>
                );
              })}
            </div>
            {message.result ? (
              <p className="quiz-status">Score: {message.result.correct}/{message.result.total} ({message.result.score_percent}%)</p>
            ) : (
              <button type="button" className="quiz-submit-btn" onClick={() => handleQuizSubmit(message.quiz.quiz_id, message.selectedAnswers)}>
                Submit MCQ
              </button>
            )}
          </>
        )}
      </div>
    );
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
    const retryQuestion = message.question || message.text || [...messages].reverse().find((item) => item.role === "student")?.text;
    if (!retryQuestion) return;
    if (message.answerStyle) {
      setAnswerStyle(message.answerStyle);
    }
    await askQuestion(retryQuestion, message.subject || selectedSubject || inferSubject(retryQuestion));
  };

  return (
    <div className="page-shell dashboard-app-shell">
      <a className="skip-link" href="#student-main">{lang === "hi" ? "मुख्य सामग्री पर जाएँ" : "Skip to main content"}</a>
      <aside className="dashboard-left-nav">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 4.5 9.8 19.5h4.4L20 4.5h-4.1L12 15.4 8.1 4.5H4Z" fill="currentColor" />
              <path d="M8.5 4.5h7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" opacity="0.72" />
            </svg>
          </div>
          <div className="sidebar-brand-copy">
            <strong>VidyaAI</strong>
            <p>{t.sidebarTagline}</p>
          </div>
        </div>

        <button type="button" className="nav-action primary" onClick={handleNewChat}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          <span>{t.newChat.replace("+ ", "")}</span>
        </button>
        {isAdmin && (
          <button type="button" className="nav-action nav-action-admin" onClick={() => navigate("/admin")}>Admin Panel</button>
        )}
        {accountRole === "teacher" && (
          <button type="button" className="nav-action teacher-workspace-link" onClick={() => navigate("/teacher")}><Icon name="arrowLeft" size={18} /> Teacher Workspace</button>
        )}

        <div className="sidebar-section quick-prompt-section">
          <p>{t.quickPromptsTitle}</p>
          {t.quickPrompts.map((prompt, index) => (
            <button key={index} type="button" className="plain-list-button" onClick={() => setQuestion(prompt)}>{prompt}</button>
          ))}
        </div>

        <div className="sidebar-section recent-sidebar-section">
          <p>{t.recentChatsTitle}</p>
          {recentQuestions.length > 0 ? (
            recentQuestions.map((message, index) => (
              <button
                key={`${message.text}-${index}`}
                type="button"
                className="plain-list-button recent-question-button"
                onClick={() => setQuestion(message.text)}
              >
                {message.text}
              </button>
            ))
          ) : (
            <span className="sidebar-empty-note">{lang === "hi" ? "अभी कोई सवाल नहीं है।" : "No questions yet."}</span>
          )}
        </div>

        <div className="sidebar-section sidebar-tool-section">
          <p>{lang === "hi" ? "अध्ययन उपकरण" : "Study Tools"}</p>
          {[
            { id: "chat", label: t.navChat, helper: lang === "hi" ? "मुख्य चैट" : "Main chat" },
            { id: "pyq", label: t.navPyq, helper: lang === "hi" ? "पुराने प्रश्नपत्र" : "Previous papers" },
            { id: "plan", label: t.navPlan, helper: lang === "hi" ? "दैनिक अध्ययन योजना" : "Daily roadmap" },
            { id: "quiz", label: t.navQuiz, helper: lang === "hi" ? "बहुविकल्पीय अभ्यास" : "MCQ practice" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`plain-list-button ${activeSection === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveSection(item.id);
                setShowRecentPanel(false);
              }}
              title={item.label}
              aria-label={item.label}
              aria-current={activeSection === item.id ? "page" : undefined}
            >
              <span className={`nav-icon nav-icon-${item.id}`} aria-hidden="true">
                {item.id === "chat" && (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4.5 10.4 12 4l7.5 6.4v8.1A1.5 1.5 0 0 1 18 20h-3.2v-5.2H9.2V20H6a1.5 1.5 0 0 1-1.5-1.5v-8.1Z" fill="currentColor" opacity="0.28" />
                    <path d="M3.4 11.2 12 3.85l8.6 7.35" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 10.6v7.8h3.2v-4.9h5.6v4.9H18v-7.8" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {item.id === "pyq" && (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5.5 4.5h5.1c.8 0 1.4.6 1.4 1.4v13.6c-.5-.8-1.3-1.2-2.3-1.2H5.5A1.5 1.5 0 0 1 4 16.8V6a1.5 1.5 0 0 1 1.5-1.5Z" fill="currentColor" opacity="0.24" />
                    <path d="M18.5 4.5h-5.1c-.8 0-1.4.6-1.4 1.4v13.6c.5-.8 1.3-1.2 2.3-1.2h4.2a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5Z" fill="currentColor" opacity="0.24" />
                    <path d="M12 6.1v13.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M7.4 9h2.1M7.4 12.2h2.1M14.5 9h2.1M14.5 12.2h2.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    <path d="M5.5 4.5h5.1c.8 0 1.4.6 1.4 1.4v13.6c-.5-.8-1.3-1.2-2.3-1.2H5.5A1.5 1.5 0 0 1 4 16.8V6a1.5 1.5 0 0 1 1.5-1.5ZM18.5 4.5h-5.1c-.8 0-1.4.6-1.4 1.4v13.6c.5-.8 1.3-1.2 2.3-1.2h4.2a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
                  </svg>
                )}
                {item.id === "plan" && (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4" y="5.5" width="16" height="15" rx="3" fill="currentColor" opacity="0.24" />
                    <path d="M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M4.5 10.2h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9 15.1 11 17l4-4.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="4" y="5.5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
                {item.id === "quiz" && (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="5" y="3.5" width="14" height="17" rx="3" fill="currentColor" opacity="0.24" />
                    <path d="M9 8h6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                    <path d="m8.5 13 1.8 1.8 4.4-5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 17h4.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                    <rect x="5" y="3.5" width="14" height="17" rx="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </span>
              <span className="nav-label-copy">
                <strong>{item.label}</strong>
                <small>{item.helper}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="desktop-account-actions">
          <div className="desktop-account-summary">
            <span className="desktop-account-avatar" aria-hidden="true">{studentName?.trim()?.charAt(0) || "V"}</span>
            <div><strong>{studentName}</strong><small>{isGuest ? t.profileLabels.guest : t.profileLabels.loggedIn}</small></div>
          </div>
          {isGuest ? (
            <button type="button" className="nav-action" onClick={() => navigate("/login")}>Login</button>
          ) : (
            <button type="button" className="nav-action desktop-logout-action" onClick={handleLogout}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>
              <span>{lang === "hi" ? "लॉग आउट" : "Logout"}</span>
            </button>
          )}
        </div>

        {showRecentPanel && (
          <div className="recent-chat-popover">
            <div className="recent-chat-popover-head">
              <strong>{t.recentChatsTitle}</strong>
              <button type="button" onClick={() => setShowRecentPanel(false)} aria-label="Close recent chats">
                <Icon name="close" size={18} />
              </button>
            </div>
            {recentQuestions.length > 0 ? (
              <div className="recent-chat-popover-list">
                {recentQuestions.map((message, index) => (
                  <button
                    key={`${message.text}-${index}`}
                    type="button"
                    onClick={() => {
                      setQuestion(message.text);
                      setShowRecentPanel(false);
                    }}
                  >
                    {message.text}
                  </button>
                ))}
              </div>
            ) : (
              <p>{lang === "hi" ? "अभी कोई recent सवाल नहीं है।" : "No recent questions yet."}</p>
            )}
          </div>
        )}

      </aside>

      <section className="dashboard-main-chat" id="student-main" tabIndex="-1">
        <header className={`dashboard-main-top ${showProfileMenu ? "profile-menu-open" : ""}`}>
          <div className="header-left-cluster">
            <div className="dashboard-title-block">
              <h1>{lang === "hi" ? "नमस्ते, " : "Hello, "}<span>{studentName}</span></h1>
              <div className="student-tags">
                <span>कक्षा {studentProfile?.class_level || "10"}</span>
                <span>{studentProfile?.medium || "Hindi"} माध्यम</span>
              </div>
            </div>
          </div>

          <div className="top-actions" ref={profileMenuRef}>
            <div className="mobile-brand-mark" aria-label="VidyaAI">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 10 9-5 9 5-9 5-9-5Z" />
                <path d="M7 12v4.5c0 .8 2.2 2.5 5 2.5s5-1.7 5-2.5V12" />
                <path d="M21 10v5" />
              </svg>
            </div>

            <div className="header-status-chips" aria-label="study status">
              <span title="Study streak">
                <b className="streak-flame" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <defs>
                      <linearGradient id="streakFireGradient" x1="7" x2="17" y1="21" y2="2" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#facc15" />
                        <stop offset="0.48" stopColor="#fb923c" />
                        <stop offset="1" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#streakFireGradient)" d="M13.3 2.2c.4 2.5-.2 4.1-1.3 5.6-.9 1.2-2 2.4-2.1 4.3 0 1.1.5 2.1 1.5 2.8-.1-1.5.5-2.6 1.5-3.7.9 1 1.8 2.3 1.8 4 0 2.1-1.7 3.8-3.8 3.8-2.8 0-5-2.2-5-5 0-2.2 1-4.1 2.7-5.9 1.4-1.5 2.3-3.2 1.9-5.2 4 1.7 7.6 5.6 7.6 10.3 0 4.7-3.8 8.5-8.5 8.5S1.7 18 1.7 13.3c0-2.9 1.4-5.4 3.7-7.2-.6 1.2-.9 2.3-.8 3.4.3-1.6 1.2-2.9 2.4-4.1 1.8-1.8 3.4-3.2 6.3-3.2Z" />
                  </svg>
                </b>
                <strong className="streak-count-mobile">{streak.count || 0}</strong>
                <strong className="streak-count-desktop">{streak.count || 0} {lang === "hi" ? "दिन" : "days"}</strong>
                <small>{lang === "hi" ? "स्ट्रीक" : "streak"}</small>
              </span>
            </div>

            <button
              type="button"
              className={`header-language-switch ${lang === "en" ? "english" : "hindi"}`}
              onClick={toggleLanguage}
              aria-label={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"}
            >
              <span>अ</span>
              <span>A</span>
            </button>

            <div className="mobile-profile-wrap">
              <button type="button" className="mobile-profile-chip" onClick={() => setShowProfileMenu((open) => !open)} title={t.profileTitle} aria-expanded={showProfileMenu} aria-controls="student-profile-menu" aria-haspopup="dialog">
                <span className="mobile-profile-avatar" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span className="mobile-profile-copy">
                  <strong>{studentName}</strong>
                  <small>कक्षा {studentProfile?.class_level || "10"} • {studentProfile?.medium || "Hindi"}</small>
                </span>
                <svg className="profile-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>

            {showProfileMenu && (
              <>
                <button
                  type="button"
                  className="mobile-profile-backdrop"
                  onClick={() => setShowProfileMenu(false)}
                  aria-label={lang === "hi" ? "प्रोफाइल बंद करें" : "Close profile"}
                />
                <div className="mobile-profile-menu" id="student-profile-menu" role="dialog" aria-modal="true" aria-label={t.profileTitle}>
                <div className="mobile-profile-menu-head">
                  <strong>{studentName}</strong>
                  <span>{isGuest ? t.profileLabels.guest : t.profileLabels.loggedIn}</span>
                </div>
                <dl>
                  <div><dt>{t.profileLabels.class}</dt><dd>{studentProfile?.class_level || "10"}</dd></div>
                  <div><dt>{t.profileLabels.medium}</dt><dd>{studentProfile?.medium || "Hindi"}</dd></div>
                  <div><dt>Board</dt><dd>CGBSE</dd></div>
                </dl>
                <div className="mobile-learning-panel">
                  <div className="mobile-learning-head">
                    <strong>{lang === "hi" ? "सीखने की प्रगति" : "Learning Tracker"}</strong>
                    <span>{studentProfile?.quiz?.completed ?? 0}/{studentProfile?.quiz?.started ?? 0} {lang === "hi" ? "क्विज़" : "quizzes"}</span>
                  </div>
                  <div className="mobile-learning-grid">
                    <div><span>{lang === "hi" ? "क्विज़ औसत" : "Quiz Avg"}</span><strong>{studentProfile?.quiz?.avg_score ?? 0}%</strong></div>
                    <div><span>{lang === "hi" ? "सुधार" : "Improve"}</span><strong>{studentProfile?.quiz?.improvement ?? 0}%</strong></div>
                    <div><span>{lang === "hi" ? "विषय" : "Subjects"}</span><strong>{learningSubjects.length}</strong></div>
                    <div><span>{lang === "hi" ? "कमज़ोर" : "Weak"}</span><strong>{studentProfile?.weak_topics?.length ?? 0}</strong></div>
                  </div>
                  {learningSubjects.length > 0 && (
                    <div className="mobile-learning-subjects">
                      {learningSubjects.slice(0, 3).map((item) => (
                        <button
                          key={item.subject}
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            setSelectedSubject(item.subject);
                            setQuestion(`${item.subject} revision कराइए`);
                          }}
                        >
                          <span>{item.subject}</span>
                          <small>{item.questions} Q · {item.quiz_attempts} quiz · {item.avg_quiz_score || 0}%</small>
                        </button>
                      ))}
                    </div>
                  )}
                  {studentProfile?.weak_topics?.length > 0 && (
                    <div className="mobile-weak-topics">
                      {studentProfile.weak_topics.slice(0, 3).map((topic) => (
                        <button
                          key={`${topic.subject}-${topic.topic}`}
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            setQuestion(`${topic.subject} ${topic.topic} revise कराइए`);
                          }}
                        >
                          {topic.topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button type="button" onClick={() => { setShowProfileMenu(false); navigate("/admin"); }}>
                    Admin Panel
                  </button>
                )}
                <button
                  type="button"
                  className="profile-menu-action"
                  onClick={() => {
                    toggleLanguage();
                    setShowProfileMenu(false);
                  }}
                >
                  {lang === "hi" ? "English" : "हिंदी"}
                </button>
                {isGuest ? (
                  <button type="button" onClick={() => { setShowProfileMenu(false); navigate("/login"); }}>
                    Login
                  </button>
                ) : (
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                )}
                </div>
              </>
            )}
          </div>
        </header>

        <div className="mobile-study-controls" aria-label="study-controls">
          <div className="mobile-tool-strip">
            {[
              { id: "chat", label: t.navChat },
              { id: "quiz", label: t.navQuiz },
              { id: "pyq", label: t.navPyq },
              { id: "plan", label: t.navPlan },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? "active" : ""}
                onClick={() => setActiveSection(item.id)}
                aria-current={activeSection === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mobile-subject-strip">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                className={selectedSubject === subject.id ? "active" : ""}
                onClick={() => setSelectedSubject(subject.id)}
              >
                {subject[lang]}
              </button>
            ))}
          </div>
        </div>

        {activeSection === "chat" && (
        <div className="answer-style-bar">
          <span>{lang === "hi" ? "परीक्षा-मित्र" : "Exam mode"}</span>
          {answerStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              className={answerStyle === style.id ? "active" : ""}
              onClick={() => handleAnswerStyleClick(style)}
              disabled={style.id === "exam" && isLoading}
            >
              {style[lang]}
            </button>
          ))}
        </div>
        )}

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
          {activeSection === "chat" && (
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

            <div ref={windowRef} className={`dashboard-chatgpt-window ${askedQuestions.length === 0 && !isLoading ? "empty-reference" : ""}`}>
              {askedQuestions.length === 0 && !isLoading && (
                <div className="study-welcome" aria-label="VidyaAI study home">
                  <div className="study-welcome-copy">
                    <span className="study-welcome-kicker">{lang === "hi" ? "CGBSE board prep" : "CGBSE board prep"}</span>
                    <h2>{lang === "hi" ? "आज किस टॉपिक को मजबूत करना है?" : "What should we strengthen today?"}</h2>
                    <p>
                      {lang === "hi"
                        ? "अध्याय समझें, उत्तर लिखवाएं, PYQ practice करें और कमजोर टॉपिक पर तुरंत revision शुरू करें."
                        : "Understand chapters, draft exam answers, practice PYQs, and revise weak topics from one focused workspace."}
                    </p>
                    <div className="student-learning-path" aria-label={lang === "hi" ? "सीखने के चार चरण" : "Four-step learning path"}>
                      {[
                        { id: "chat", icon: "chat", label: lang === "hi" ? "पूछें" : "Ask", note: lang === "hi" ? "अपना सवाल लिखें" : "Start with a question" },
                        { id: "understand", icon: "brain", label: lang === "hi" ? "समझें" : "Understand", note: lang === "hi" ? "सरल व्याख्या पाएँ" : "Get a clear explanation" },
                        { id: "quiz", icon: "lesson", label: lang === "hi" ? "अभ्यास" : "Practise", note: lang === "hi" ? "क्विज़ से जाँचें" : "Check with a quiz" },
                        { id: "progress", icon: "sparkle", label: lang === "hi" ? "सुधारें" : "Improve", note: lang === "hi" ? "कमज़ोर टॉपिक देखें" : "Review weak topics" },
                      ].map((item, index) => <button key={item.id} type="button" onClick={() => {
                        if (item.id === "quiz") setActiveSection("quiz");
                        else if (item.id === "progress") document.querySelector(".dashboard-right-rail")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
                        else { setActiveSection("chat"); if (item.id === "understand") setQuestion(chatSuggestions[0] || ""); }
                      }}><span>{index + 1}</span><Icon name={item.icon} size={18} /><strong>{item.label}</strong><small>{item.note}</small></button>)}
                    </div>
                    <div className="study-welcome-actions">
                      {chatSuggestions.slice(0, 3).map((suggestion) => (
                        <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="study-welcome-board" aria-hidden="true">
                    <div className="board-card main">
                      <span>{subjects.find((subject) => subject.id === selectedSubject)?.[lang] || selectedSubject}</span>
                      <strong>{answerStyles.find((style) => style.id === answerStyle)?.[lang] || "Exam-ready"}</strong>
                      <small>{daysToExam} {t.countdownUnit} · {completedCount}/{todaysTargets.length} targets</small>
                    </div>
                    <div className="board-card mini">
                      <span>{lang === "hi" ? "आज" : "Today"}</span>
                      <strong>{askedQuestions.length}</strong>
                      <small>{lang === "hi" ? "प्रश्न पूछे" : "questions asked"}</small>
                    </div>
                    <div className="board-card mini accent">
                      <span>{lang === "hi" ? "स्ट्रीक" : "Streak"}</span>
                      <strong>{streak.count || 0}</strong>
                      <small>{t.streakUnit}</small>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`dashboard-message-row ${message.role === "student" ? "student" : "assistant"}`}>
                  <div className="dashboard-message-stack">
                    <span className="message-label">{message.role === "student" ? t.studentLabel : message.role === "quiz" ? "MCQ Quiz" : t.assistantLabel}</span>
                    <div className={`dashboard-message-bubble ${message.role === "student" ? "student" : "assistant"}${message.role === "quiz" ? " quiz-bubble" : ""}`}>
                      {message.role === "student" && <RichMarkdown>{message.text}</RichMarkdown>}
                      {message.role === "assistant" && (
                        <AssistantResponse
                          message={message}
                          animationRegistry={animatedMessagesRef.current}
                          onProgress={() => messagesEndRef.current?.scrollIntoView({ block: "end" })}
                        />
                      )}
                      {message.role === "quiz" && (
                        renderQuizCard(message)
                      )}
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
                    {message.role === "student" && (
                      <div className="message-signs">
                        <button type="button" className="icon-btn" onClick={() => handleRetry(message)} title="Re-ask question" disabled={isLoading}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
                        </button>
                        <button type="button" className="icon-btn" onClick={() => handleCopy(message.text)} title="Copy question">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                      </div>
                    )}
                    {message.role === "assistant" && (
                      <div className="message-signs">
                        <button type="button" className="icon-btn" onClick={() => handleCopy(message.text)} title="Copy">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button type="button" className="icon-btn" onClick={() => handleRetry(message)} title="Retry">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
                        </button>
                        {message.role === "assistant" && !message.chapterOptions?.length && (
                          <>
                            <button
                              type="button"
                              className={`icon-btn feedback-icon positive${message.feedback === "up" ? " active" : ""}`}
                              onClick={() => handleFeedback(index, message.sessionId, true)}
                              title="Good answer"
                              disabled={!message.sessionId}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                            </button>
                            <button
                              type="button"
                              className={`icon-btn feedback-icon negative${message.feedback === "down" ? " active" : ""}`}
                              onClick={() => handleFeedback(index, message.sessionId, false)}
                              title="Needs improvement"
                              disabled={!message.sessionId}
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

              {(isLoading || quizLoading) && (
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
              <div ref={messagesEndRef} className="chat-scroll-anchor" aria-hidden="true" />
            </div>

            <div className="suggestion-strip">
              <button type="button" className="suggestion-new-chat" onClick={handleNewChat}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                {lang === "hi" ? "नई चैट" : "New Chat"}
              </button>
              {chatSuggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>

            <form className="dashboard-chatgpt-form sticky-input" onSubmit={handleSubmit}>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t.placeholder}
                aria-label={lang === "hi" ? "VidyaAI से प्रश्न पूछें" : "Ask VidyaAI a question"}
              />
              <button type="submit" disabled={isLoading || !question.trim()} aria-label={t.submit}>
                <span className="send-label">{isLoading ? t.loading : t.submit}</span>
                <svg className="send-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
              </button>
            </form>
          </div>
          )}

          {activeSection === "quiz" && (
            <div className="study-tool-panel">
              <div className="tool-panel-head">
                <div>
                  <h2>{lang === "hi" ? "विषय क्विज़" : "Subject Quizzes"}</h2>
                  <p>{lang === "hi" ? "अपना विषय चुनें और तैयार होने पर MCQ अभ्यास शुरू करें।" : "Choose a subject and take optional MCQ practice when you are ready."}</p>
                </div>
                <span>{studentProfile?.quiz?.avg_score ?? 0}% {lang === "hi" ? "औसत" : "avg"}</span>
              </div>

              <div className="tool-subject-grid">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    className={quizSubject === subject.id ? "active" : ""}
                    onClick={() => {
                      setQuizSubject(subject.id);
                      setSelectedSubject(subject.id);
                    }}
                  >
                    <strong>{subject[lang]}</strong>
                    <small>{(importantTopicsBySubject[subject.id] || []).slice(0, 2).join(" · ")}</small>
                  </button>
                ))}
              </div>

              <div className="tool-action-row">
                <button type="button" className="primary-tool-btn" onClick={() => generateSubjectQuiz(quizSubject)} disabled={quizLoading}>
                  {quizLoading ? (lang === "hi" ? "क्विज़ बन रही है…" : "Creating quiz...") : (lang === "hi" ? `${subjects.find((item) => item.id === quizSubject)?.hi || quizSubject} क्विज़ शुरू करें` : `Start ${quizSubject} Quiz`)}
                </button>
              </div>

              <div className="standalone-quiz-wrap">
                {standaloneQuiz ? renderQuizCard(standaloneQuiz) : (
                  <div className="empty-tool-state">
                    <strong>{lang === "hi" ? "अभी कोई क्विज़ शुरू नहीं हुई" : "No quiz started"}</strong>
                    <span>{lang === "hi" ? "अभ्यास के लिए तैयार होने पर यहीं से क्विज़ शुरू करें। आपकी चैट बाधित नहीं होगी।" : "Your chat will no longer be interrupted by MCQs. Start one here whenever you want practice."}</span>
                  </div>
                )}
              </div>
              <CompanyLegalFooter className="workspace-public-footer" />
            </div>
          )}

          {activeSection === "pyq" && (
            <div className="study-tool-panel">
              <div className="tool-panel-head">
                <div>
                  <h2>{t.papersTitle}</h2>
                  <p>{t.papersNote}</p>
                </div>
                <span>{lang === "hi" ? "कक्षा" : "Class"} {classLevel}</span>
              </div>

              {!pyqCatalogLoaded ? <div className="resource-skeleton" role="status" aria-label={lang === "hi" ? "प्रश्नपत्र लोड हो रहे हैं" : "Loading papers"}><span /><span /><span /></div> : pyqSubjects.length > 0 ? (
                <div className="pyq-subject-browser">
                  <div className="pyq-subject-picker" role="tablist" aria-label="PYQ subject">
                    {pyqSubjects.map((group) => (
                      <button
                        key={group.subject.id}
                        type="button"
                        className={pyqSubject === group.subject.id ? "active" : ""}
                        onClick={() => setPyqSubject(group.subject.id)}
                        role="tab"
                        aria-selected={pyqSubject === group.subject.id}
                      >
                        <span>{group.subject[lang]}</span>
                        <small>{group.count}</small>
                      </button>
                    ))}
                  </div>

                  <section className="pyq-subject-section">
                    <div className="pyq-subject-head">
                      <div>
                        <strong>{selectedPyqSubjectMeta?.[lang] || pyqSubject}</strong>
                        <span>{selectedPyqPapers.length} {lang === "hi" ? "प्रश्नपत्र" : "papers"}</span>
                      </div>
                    </div>
                    <div className="pyq-list">
                      {selectedPyqPapers.map((paper) => (
                        <article key={paper.fileUrl} className="pyq-row">
                          <div>
                            <strong>{paper.title}</strong>
                            <span>{paper.year} · Set {paper.set} · {paper.medium}</span>
                          </div>
                          <div className="pyq-actions">
                            <a className="pyq-open-action" href={paper.fileUrl} target="_blank" rel="noreferrer">{lang === "hi" ? "खोलें" : "Open"}</a>
                            <a className="pyq-download-action" href={paper.fileUrl} download>{lang === "hi" ? "डाउनलोड" : "Download"}</a>
                            <button type="button" disabled={Boolean(pyqLoadingFile)} onClick={() => generatePyqQuiz(paper)}>
                              {pyqLoadingFile === paper.fileUrl.split("/").pop() ? (lang === "hi" ? "तैयार हो रहा है…" : "Preparing...") : t.startPaper}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="standalone-quiz-wrap pyq-practice-wrap">
                      {pyqQuiz ? renderQuizCard(pyqQuiz) : (
                        <div className="empty-tool-state">
                          <strong>{lang === "hi" ? "अभ्यास के लिए प्रश्नपत्र चुनें" : "Select a paper to practice"}</strong>
                          <span>{lang === "hi" ? "PYQ पेज छोड़े बिना प्रश्नपत्र आधारित सवाल यहीं दिखाई देंगे।" : "Your paper-specific questions will appear here without leaving the PYQ page."}</span>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="empty-tool-state">
                  <strong>PYQ papers are ready for upload</strong>
                  <span>Add PDFs under frontend/public/pyq and register them in the PYQ catalog to enable open/download buttons.</span>
                </div>
              )}
              <CompanyLegalFooter className="workspace-public-footer" />
            </div>
          )}

          {activeSection === "plan" && (
            <div className="study-tool-panel">
              <div className="tool-panel-head">
                <div>
                  <h2>Study Plan</h2>
                  <p>Simple subject-wise preparation plan from probable exam date and 3-4 hours daily study time.</p>
                </div>
                <span>{daysToExam} {t.countdownUnit}</span>
              </div>

              <div className="plan-controls">
                <label>
                  Probable exam date
                  <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value || defaultExamDate())} />
                </label>
                <label>
                  Daily study time
                  <input type="number" min="0.5" max="8" step="0.5" value={studyHours} onChange={(e) => setStudyHours(e.target.value)} />
                </label>
                <label>
                  Study days/week
                  <select value={studyDaysPerWeek} onChange={(e) => setStudyDaysPerWeek(e.target.value)}>
                    {[4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}
                  </select>
                </label>
                <label>
                  My goal
                  <select value={studyGoal} onChange={(e) => setStudyGoal(e.target.value)}>
                    <option value="balanced">Balanced preparation</option>
                    <option value="weak">Improve my weak subject</option>
                    <option value="pyq">More PYQ practice</option>
                    <option value="revision">Fast revision</option>
                  </select>
                </label>
                <button type="button" className="primary-tool-btn" onClick={buildStudyPlan}>
                  Build My Plan
                </button>
              </div>

              <div className="plan-subject-choice">
                <strong>Subjects I want to study</strong>
                <div className="tool-subject-grid">
                  {subjects.map((subject) => {
                    const active = planSubjects.includes(subject.id);
                    return (
                      <button key={subject.id} type="button" className={active ? "active" : ""} onClick={() => setPlanSubjects((current) => active ? current.filter((item) => item !== subject.id) : [...current, subject.id])}>
                        <strong>{subject[lang]}</strong><small>{active ? "Included" : "Tap to include"}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              {studyPlan.length > 0 ? (
                <div className="study-plan-list">
                  {studyPlan.map((day) => (
                    <article key={day.day} className="study-plan-day">
                      <div>
                        <strong>Day {day.day} · {day.date}</strong>
                        <span>{day.subject} · {day.chapter} · {day.hours} hours</span>
                      </div>
                      <ul>
                        {day.blocks.map((block) => <li key={block}>{block}</li>)}
                      </ul>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-tool-state">
                  <strong>No plan created yet</strong>
                  <span>Choose your subjects, available time, weekly routine, and personal goal. The plan will follow your choices.</span>
                </div>
              )}
              <CompanyLegalFooter className="workspace-public-footer" />
            </div>
          )}

        </div>
      </section>

      <aside className="dashboard-right-rail">
        <section className="right-section">
          <p className="rail-heading">{lang === "hi" ? "विषय" : "Subjects"}</p>
          <div className="subject-picker-card">
            <div className="desktop-subject-list right-subject-list">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  className={selectedSubject === subject.id ? "active" : ""}
                  onClick={() => {
                    setSelectedSubject(subject.id);
                    setQuizSubject(subject.id);
                    setPyqSubject(subject.id);
                  }}
                >
                  <span>{subject[lang]}</span>
                  <small>{(importantTopicsBySubject[subject.id] || []).slice(0, 2).join(" · ")}</small>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="right-section">
          <p className="rail-heading">{lang === "hi" ? "सीखने की प्रगति" : "Learning Tracker"}</p>
          <div className="learning-tracker-card">
            <div className="learning-score-grid">
              <div>
                <span>{lang === "hi" ? "क्विज़ औसत" : "Quiz Avg"}</span>
                <strong>{studentProfile?.quiz?.avg_score ?? 0}%</strong>
              </div>
              <div>
                <span>{lang === "hi" ? "पूरे हुए" : "Completed"}</span>
                <strong>{studentProfile?.quiz?.completed ?? 0}/{studentProfile?.quiz?.started ?? 0}</strong>
              </div>
              <div>
                <span>{lang === "hi" ? "सुधार" : "Improvement"}</span>
                <strong>{studentProfile?.quiz?.improvement ?? 0}%</strong>
              </div>
              <div>
                <span>{lang === "hi" ? "कमज़ोर टॉपिक" : "Weak Topics"}</span>
                <strong>{studentProfile?.weak_topics?.length ?? 0}</strong>
              </div>
            </div>

            {learningSubjects.length > 0 && (
              <div className="learning-subject-list">
                {learningSubjects.slice(0, 5).map((item) => (
                  <div key={item.subject} className="learning-subject-row">
                    <div>
                      <strong>{item.subject}</strong>
                      <span>{item.questions} questions · {item.quiz_attempts} quizzes · {item.weak_topics} weak</span>
                    </div>
                    <div className="learning-progress-track" aria-hidden="true">
                      <span style={{ width: `${Math.max(8, Math.round(((item.questions || 0) / maxSubjectQuestions) * 100))}%` }} />
                    </div>
                    <small>{item.avg_quiz_score ? `${item.avg_quiz_score}% quiz avg` : "No quiz score yet"}</small>
                  </div>
                ))}
              </div>
            )}

            {studentProfile?.weak_topics?.length > 0 && (
              <div className="learning-chip-list">
                {studentProfile.weak_topics.slice(0, 4).map((topic) => (
                  <button
                    key={`${topic.subject}-${topic.topic}`}
                    type="button"
                    onClick={() => setQuestion(`${topic.subject} ${topic.topic} revise कराइए`)}
                  >
                    {topic.subject}: {topic.topic}
                  </button>
                ))}
              </div>
            )}
          </div>
          {studentProfile?.recent_quizzes?.length > 0 && (
            <div className="question-sample-panel">
              <div className="sample-panel-head">
                <strong>Recent MCQs</strong>
                <span>{studentProfile.recent_quizzes.length}</span>
              </div>
              <div className="question-sample-list">
                {studentProfile.recent_quizzes.slice(0, 3).map((quiz) => (
                  <button key={quiz.id} type="button" onClick={() => setQuestion(`${quiz.subject} ${quiz.topic || ""} revise कराइए`)}>
                    {quiz.subject}: {quiz.score_percent}% · {quiz.status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="right-section">
          <p className="rail-heading">{lang === "hi" ? "आज की गतिविधि" : "Today's activity"}</p>
          <div className="activity-grid">
            <div><strong>{askedQuestions.length}</strong><span>{lang === "hi" ? "प्रश्न पूछे" : "Questions asked"}</span></div>
            <div><strong>{completedCount}</strong><span>{lang === "hi" ? "लक्ष्य पूरे" : "Targets completed"}</span></div>
          </div>
          <div className="mini-stat-row">
            <span>{t.countdownTitle}</span>
            <strong>{daysToExam} {t.countdownUnit}</strong>
          </div>
        </section>

        <section className="right-section">
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
      {!isGuest && <GuidedTour accountId={studentProfile?.email} role="student" steps={tourSteps} onStepChange={(tourStep) => { if (tourStep.target === ".dashboard-chat-panel") setActiveSection("chat"); }} />}
      <ConnectionStatus language={lang} />
    </div>
  );
}
