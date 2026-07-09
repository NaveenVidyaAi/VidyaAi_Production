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
    navChat: "Chat",
    navQuiz: "Quiz",
    navPyq: "PYQ",
    navPlan: "Study Plan",
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

const pyqPapers = [
  {
    title: "Class 10 English PYQ 2026 Set A",
    classLevel: "10",
    subject: "English",
    year: "2026",
    set: "A",
    medium: "English",
    fileUrl: "/pyq/class_10_english_PYQ26_SET_A.pdf",
  },
  {
    title: "Class 10 English PYQ 2025 Set A",
    classLevel: "10",
    subject: "English",
    year: "2025",
    set: "A",
    medium: "English",
    fileUrl: "/pyq/class_10_english_PYQ25_SET_A.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2025 Set B",
    classLevel: "10",
    subject: "Hindi",
    year: "2025",
    set: "B",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ25_SET_B.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2025 Set C",
    classLevel: "10",
    subject: "Hindi",
    year: "2025",
    set: "C",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ25_SET_C.pdf",
  },
  {
    title: "Class 10 Math PYQ 2025 Set A",
    classLevel: "10",
    subject: "Math",
    year: "2025",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_math_PYQ25_SET_A.pdf",
  },
  {
    title: "Class 10 Sanskrit PYQ 2025 Set A",
    classLevel: "10",
    subject: "Sanskrit",
    year: "2025",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_sanskrit_PYQ25_SET_A.pdf",
  },
  {
    title: "Class 10 Science PYQ 2025 Set A",
    classLevel: "10",
    subject: "Science",
    year: "2025",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_science_PYQ25_SET_A.pdf",
  },
  {
    title: "Class 10 Social Science PYQ 2025 Set A",
    classLevel: "10",
    subject: "Social Science",
    year: "2025",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_social_science_PYQ25_SET_A.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2024 Set A",
    classLevel: "10",
    subject: "Hindi",
    year: "2024",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ24_SET_A.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2024 Set A 2",
    classLevel: "10",
    subject: "Hindi",
    year: "2024",
    set: "A 2",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ24_SET_A_2.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2024 Set B",
    classLevel: "10",
    subject: "Hindi",
    year: "2024",
    set: "B",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ24_SET_B.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2024 Set C",
    classLevel: "10",
    subject: "Hindi",
    year: "2024",
    set: "C",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ24_SET_C.pdf",
  },
  {
    title: "Class 10 Math PYQ 2024 Set A",
    classLevel: "10",
    subject: "Math",
    year: "2024",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_math_PYQ24_SET_A.pdf",
  },
  {
    title: "Class 10 Science PYQ 2024 Set A",
    classLevel: "10",
    subject: "Science",
    year: "2024",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_science_PYQ24_SET_A.pdf",
  },
  {
    title: "Class 10 Social Science PYQ 2024 Set C",
    classLevel: "10",
    subject: "Social Science",
    year: "2024",
    set: "C",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_social_science_PYQ24_SET_C.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2023 Set A",
    classLevel: "10",
    subject: "Hindi",
    year: "2023",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ23_SET_A.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2023 Set A 2",
    classLevel: "10",
    subject: "Hindi",
    year: "2023",
    set: "A 2",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ23_SET_A_2.pdf",
  },
  {
    title: "Class 10 Hindi PYQ 2023 Set B",
    classLevel: "10",
    subject: "Hindi",
    year: "2023",
    set: "B",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_hindi_PYQ23_SET_B.pdf",
  },
  {
    title: "Class 10 Math PYQ 2023 Set A",
    classLevel: "10",
    subject: "Math",
    year: "2023",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_math_PYQ23_SET_A.pdf",
  },
  {
    title: "Class 10 Science PYQ 2023 Set A",
    classLevel: "10",
    subject: "Science",
    year: "2023",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_science_PYQ23_SET_A.pdf",
  },
  {
    title: "Class 10 Social Science PYQ 2023 Set A",
    classLevel: "10",
    subject: "Social Science",
    year: "2023",
    set: "A",
    medium: "Hindi",
    fileUrl: "/pyq/class_10_social_science_PYQ23_SET_A.pdf",
  },
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
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("chat");
  const [standaloneQuiz, setStandaloneQuiz] = useState(null);
  const [quizSubject, setQuizSubject] = useState("Hindi");
  const [studyHours, setStudyHours] = useState(3);
  const [studyPlan, setStudyPlan] = useState([]);
  const windowRef = useRef(null);
  const messagesEndRef = useRef(null);
  const profileMenuRef = useRef(null);

  const t = translations[lang];
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
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ block: "end" });
      } else if (windowRef.current) {
        windowRef.current.scrollTop = windowRef.current.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(frame);
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
    setStudentProfile(null);
    setStudentName("अतिथि विद्यार्थी");
    setIsGuest(true);
    setShowProfileMenu(false);
    navigate("/login");
  };

  const askQuestion = async (currentQuestion, subjectOverride = null, answerStyleOverride = null) => {
    if (!currentQuestion || isLoading) return;

    recordStudyActivity();
    const outgoingSubject = subjectOverride || selectedSubject || inferSubject(currentQuestion);
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

  const updateQuizMessage = (quizId, updater) => {
    setMessages((prev) => prev.map((message) => (
      message.role === "quiz" && message.quiz?.quiz_id === quizId ? updater(message) : message
    )));
    setStandaloneQuiz((message) => (
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
    const parsedHours = Math.min(4, Math.max(3, Number(studyHours) || 3));
    const days = Math.max(Math.ceil((new Date(examDate) - new Date()) / 86400000), 1);
    const planLength = Math.min(days, 21);
    const allSubjects = subjects.map((subject) => subject.id);
    const totalMinutes = parsedHours * 60;
    const nextPlan = Array.from({ length: planLength }, (_, index) => {
      const subject = index % 5 === 0 ? selectedSubject : allSubjects[index % allSubjects.length];
      const subjectPlan = chapterPlanner[subject] || chapterPlanner.Hindi;
      const chapter = subjectPlan[index % subjectPlan.length];
      const secondSubject = allSubjects[(index + 2) % allSubjects.length];
      const secondPlan = chapterPlanner[secondSubject] || chapterPlanner.Hindi;
      const secondChapter = secondPlan[index % secondPlan.length];
      const revisionMinutes = Math.round(totalMinutes * 0.45);
      const practiceMinutes = Math.round(totalMinutes * 0.35);
      const testMinutes = totalMinutes - revisionMinutes - practiceMinutes;
      return {
        day: index + 1,
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

        <div className="sidebar-section">
          <p>Study Tools</p>
          {[
            { id: "chat", label: t.navChat },
            { id: "quiz", label: t.navQuiz },
            { id: "pyq", label: t.navPyq },
            { id: "plan", label: t.navPlan },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`plain-list-button ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
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

      </aside>

      <section className="dashboard-main-chat">
        <header className={`dashboard-main-top ${showProfileMenu ? "profile-menu-open" : ""}`}>
          <div className="dashboard-title-block">
            <h1>{t.greeting(studentName)}</h1>
            <div className="student-tags">
              <span>कक्षा {studentProfile?.class_level || "10"}</span>
              <span>{studentProfile?.medium || "Hindi"} माध्यम</span>
            </div>
          </div>

          <div className="top-actions" ref={profileMenuRef}>
            <div className="mobile-brand-mark" aria-label="VidyaAI">वि</div>

            <div className="mobile-profile-wrap">
              <button type="button" className="mobile-profile-chip" onClick={() => setShowProfileMenu((open) => !open)} title={t.profileTitle} aria-expanded={showProfileMenu}>
                <span className="mobile-profile-avatar" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span className="mobile-profile-copy">
                  <strong>{studentName}</strong>
                  <small>कक्षा {studentProfile?.class_level || "10"} • {studentProfile?.medium || "Hindi"}</small>
                </span>
              </button>
            </div>

            <div className="header-status-chips" aria-label="study status">
              <span title="Daily active streak">🔥 {streak.count || 0} {lang === "hi" ? "दिन streak" : "day streak"}</span>
            </div>

            {showProfileMenu && (
              <div className="mobile-profile-menu">
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
                    <strong>Learning Tracker</strong>
                    <span>{studentProfile?.quiz?.completed ?? 0}/{studentProfile?.quiz?.started ?? 0} quizzes</span>
                  </div>
                  <div className="mobile-learning-grid">
                    <div><span>Quiz Avg</span><strong>{studentProfile?.quiz?.avg_score ?? 0}%</strong></div>
                    <div><span>Improve</span><strong>{studentProfile?.quiz?.improvement ?? 0}%</strong></div>
                    <div><span>Subjects</span><strong>{learningSubjects.length}</strong></div>
                    <div><span>Weak</span><strong>{studentProfile?.weak_topics?.length ?? 0}</strong></div>
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
                    setLang((currentLang) => currentLang === "hi" ? "en" : "hi");
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
          <span>{lang === "hi" ? "परीक्षा-मित्र टूल्स" : "Exam-friendly tools"}</span>
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

            <div ref={windowRef} className="dashboard-chatgpt-window">
              {messages.map((message, index) => (
                <div key={index} className={`dashboard-message-row ${message.role === "student" ? "student" : "assistant"}`}>
                  <div className="dashboard-message-stack">
                    <span className="message-label">{message.role === "student" ? t.studentLabel : message.role === "quiz" ? "MCQ Quiz" : t.assistantLabel}</span>
                    <div className={`dashboard-message-bubble ${message.role === "student" ? "student" : "assistant"}${message.role === "quiz" ? " quiz-bubble" : ""}`}>
                      {message.role !== "quiz" && <ReactMarkdown>{message.text}</ReactMarkdown>}
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
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? t.loading : t.submit}
              </button>
            </form>
          </div>
          )}

          {activeSection === "quiz" && (
            <div className="study-tool-panel">
              <div className="tool-panel-head">
                <div>
                  <h2>Subject Quizzes</h2>
                  <p>Choose a subject and take optional MCQ practice when you are ready.</p>
                </div>
                <span>{studentProfile?.quiz?.avg_score ?? 0}% avg</span>
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
                  {quizLoading ? "Creating quiz..." : `Start ${quizSubject} Quiz`}
                </button>
              </div>

              <div className="standalone-quiz-wrap">
                {standaloneQuiz ? renderQuizCard(standaloneQuiz) : (
                  <div className="empty-tool-state">
                    <strong>No quiz started</strong>
                    <span>Your chat will no longer be interrupted by MCQs. Start one here whenever you want practice.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "pyq" && (
            <div className="study-tool-panel">
              <div className="tool-panel-head">
                <div>
                  <h2>{t.papersTitle}</h2>
                  <p>{t.papersNote}</p>
                </div>
                <span>Class {classLevel}</span>
              </div>

              {pyqPapers.length > 0 ? (
                <div className="pyq-list">
                  {pyqPapers.map((paper) => (
                    <article key={paper.fileUrl} className="pyq-row">
                      <div>
                        <strong>{paper.title}</strong>
                        <span>{paper.subject} · {paper.year} · {paper.medium}</span>
                      </div>
                      <div className="pyq-actions">
                        <a href={paper.fileUrl} target="_blank" rel="noreferrer">Open</a>
                        <a href={paper.fileUrl} download>Download</a>
                        <button type="button" onClick={() => {
                          setSelectedSubject(paper.subject);
                          setQuestion(`Class ${classLevel} ${paper.subject} ${paper.year} PYQ paper solve करवाइए`);
                          setActiveSection("chat");
                        }}>
                          {t.startPaper}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-tool-state">
                  <strong>PYQ papers are ready for upload</strong>
                  <span>Add PDFs under frontend/public/pyq and register them in the PYQ catalog to enable open/download buttons.</span>
                </div>
              )}
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
                  <select value={studyHours} onChange={(e) => setStudyHours(e.target.value)}>
                    <option value="3">3 hours/day</option>
                    <option value="4">4 hours/day</option>
                  </select>
                </label>
                <button type="button" className="primary-tool-btn" onClick={buildStudyPlan}>
                  Create Plan
                </button>
              </div>

              {studyPlan.length > 0 ? (
                <div className="study-plan-list">
                  {studyPlan.map((day) => (
                    <article key={day.day} className="study-plan-day">
                      <div>
                        <strong>Day {day.day}</strong>
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
                  <span>Use your probable exam date and choose 3 or 4 hours/day. Class and medium are already taken from login.</span>
                </div>
              )}
            </div>
          )}

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
          <p className="rail-heading">Learning Tracker</p>
          <div className="learning-tracker-card">
            <div className="learning-score-grid">
              <div>
                <span>Quiz Avg</span>
                <strong>{studentProfile?.quiz?.avg_score ?? 0}%</strong>
              </div>
              <div>
                <span>Completed</span>
                <strong>{studentProfile?.quiz?.completed ?? 0}/{studentProfile?.quiz?.started ?? 0}</strong>
              </div>
              <div>
                <span>Improvement</span>
                <strong>{studentProfile?.quiz?.improvement ?? 0}%</strong>
              </div>
              <div>
                <span>Weak Topics</span>
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
