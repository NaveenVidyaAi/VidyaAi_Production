import { cloneElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import BrandMark from "../components/BrandMark";
import CompanyLegalFooter from "../components/CompanyLegalFooter";
import Icon from "../components/Icon";
import RichMarkdown from "../components/RichMarkdown";
import GuidedTour from "../components/GuidedTour";
import ConnectionStatus from "../components/ConnectionStatus";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const subjects = ["Hindi", "English", "Math", "Science", "Social Science", "Sanskrit"];
const teacherAnswerStyles = [
  { id: "default", en: "Default · Follow prompt", hi: "डिफ़ॉल्ट · Prompt के अनुसार" },
  { id: "summary", en: "Summary", hi: "सारांश" },
  { id: "two", en: "2 marks", hi: "2 अंक" },
  { id: "five", en: "5 marks", hi: "5 अंक" },
  { id: "qa", en: "Q&A", hi: "प्रश्नोत्तर" },
  { id: "exam", en: "Exam-ready", hi: "परीक्षा शैली" },
];
let paperUiSequence = 0;
const createPaperUiId = (prefix) => `${prefix}-${Date.now()}-${paperUiSequence += 1}`;
const paperTypePresets = {
  mcq: { label_hi: "बहुविकल्पीय प्रश्न", marks_each: 1, word_limit: "" },
  very_short: { label_hi: "अति लघु उत्तरीय प्रश्न", marks_each: 2, word_limit: "30" },
  short: { label_hi: "लघु उत्तरीय प्रश्न", marks_each: 3, word_limit: "50" },
  long: { label_hi: "दीर्घ उत्तरीय प्रश्न", marks_each: 5, word_limit: "100" },
};

function paperSectionTotals(sections) {
  return sections.reduce((totals, section) => {
    const count = Number(section.count) || 0;
    const marksEach = Number(section.marks_each) || 0;
    return { questions: totals.questions + count, marks: totals.marks + (count * marksEach) };
  }, { marks: 0, questions: 0 });
}

function nextPaperSectionName(sections) {
  const names = new Set(sections.map((section) => String(section.name || "").trim().toUpperCase()));
  for (let index = 0; index < 26; index += 1) {
    const candidate = String.fromCharCode(65 + index);
    if (!names.has(candidate)) return candidate;
  }
  return String(sections.length + 1);
}

function serializePaperSections(sections) {
  return sections.map(({ ui_id, ui_open, custom_questions = [], ...section }) => ({
    ...section,
    count: Number(section.count),
    marks_each: Number(section.marks_each),
    custom_questions: custom_questions.map(({ ui_id: questionUiId, ...question }) => question),
  }));
}

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
    paperForm: { title: "Model paper builder", note: "Choose exact RAG chapters, lock your own questions, and let VidyaAI fill only the remaining slots.", marks: "Total marks", questions: "Number of questions", targetNote: "Set the paper targets here. The section blueprint must match them before generation.", paperTarget: "Paper target", currentBlueprint: "Current sections", blueprintReady: "Targets and section blueprint match.", blueprintMismatch: "Targets do not match the section blueprint.", targetInvalid: "Use whole numbers: 5–200 marks and 1–100 questions. Total marks must be between 1× and 20× the question count.", adjustSections: "Change the section count or marks per question below, or use the current section totals.", useSectionTotals: "Use section totals", editSections: "Edit sections", class10Only: "Class 10 · curriculum RAG available", duration: "Duration (minutes)", difficulty: "Difficulty", type: "Paper type", chapters: "Chapters for RAG", chapterSearch: "Search official chapters…", chapterRequired: "Select at least one chapter.", chapterNote: "Official curriculum topics used to focus retrieval and question generation.", chapterLoading: "Loading official chapters…", chapterEmpty: "No mapped chapters are available for this class and subject.", chapterNoMatch: "No chapter matches this search.", chapterError: "Official chapters could not be loaded. Try again or change the subject.", ragAligned: "RAG aligned", selected: "selected", selectAll: "Select all", selectVisible: "Select visible", clear: "Clear", removeChapter: "Remove chapter", sections: "Sections", addSection: "Add section", sectionLimit: "Maximum 12 sections", remove: "Remove", removeSectionConfirm: "This section contains teacher-written questions. Remove the section and those questions?", removeField: "Remove field", restoreField: "Add back", section: "Section", sectionLabel: "Label", questionType: "Type", count: "Count", marksEach: "Marks / question", wordLimit: "Word limit", addQuestion: "Add my question", customQuestions: "Teacher questions", questionText: "Question in Hindi", answer: "Answer / key", alternative: "Alternative question (optional)", option: "Option", markingPoints: "Marking points, one per line", optionalFields: "Add removed settings", optionalNote: "Removed settings are not sent to VidyaAI.", allFieldsShown: "All optional settings are shown.", addField: "Add field", loading: "Setting the paper…", action: "Generate questions" },
    lessonForm: { title: "Prepare tomorrow's lesson", note: "VidyaAI explains the topic first, then turns it into a teachable classroom sequence.", duration: "Lesson duration", readiness: "Student readiness", topic: "Chapter or topic", topicPlaceholder: "Example: Class 10 Science Chapter 2 — Acids, Bases and Salts", notes: "What should VidyaAI consider?", notesPlaceholder: "Optional: students struggle with equations; no lab available; need a bilingual explanation…", loading: "Preparing your lesson…", action: "Create teaching guide" },
    options: { hindi: "Hindi", english: "English", bilingual: "Bilingual", easy: "Easy", balanced: "Balanced", challenging: "Challenging", unit: "Unit test", term: "Term exam", practice: "Practice paper", worksheet: "Worksheet", mixed: "Mixed classroom", foundation: "Needs foundation", advanced: "Advanced", general: "General" },
    result: { error: "Could not create resource", errorNote: "VidyaAI could not create this resource. Please try again.", loading: "VidyaAI is preparing a classroom-ready resource…", loadingNote: "Checking structure, teaching flow, and curriculum context.", empty: "Your generated resource will appear here", emptyNote: "Complete the form and VidyaAI will create an editable, copyable, print-ready draft.", generated: "Generated resource", copy: "Copy", print: "Download PDF", answerPrint: "Download answer key", edit: "Edit paper", done: "Done editing", addQuestion: "Add question", removeQuestion: "Remove question", questionText: "Question", answerText: "Answer / key", alternativeText: "Alternative question", downloadPreparing: "Preparing PDF…", blueprint: "Blueprint", paper: "Student paper", answers: "Answer key", sources: "Sources used", previousPage: "Previous page", nextPage: "Next page", page: "Page", structuredFallback: "The AI provider was temporarily busy, so VidyaAI built this complete plan from your exact weeks, periods, goals, and mapped curriculum scope. You can use or download it now." },
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
    paperForm: { title: "आदर्श प्रश्नपत्र निर्माता", note: "सटीक RAG अध्याय चुनें, अपने प्रश्न लॉक करें और शेष प्रश्न VidyaAI से भरवाएँ।", marks: "कुल अंक", questions: "प्रश्नों की संख्या", targetNote: "पेपर के लक्ष्य यहाँ तय करें। निर्माण से पहले खंडों का विन्यास इनसे मिलना चाहिए।", paperTarget: "पेपर लक्ष्य", currentBlueprint: "वर्तमान खंड", blueprintReady: "लक्ष्य और खंड-विन्यास मेल खाते हैं।", blueprintMismatch: "लक्ष्य और खंड-विन्यास मेल नहीं खाते।", targetInvalid: "पूर्ण संख्या भरें: 5–200 अंक और 1–100 प्रश्न। कुल अंक प्रश्न संख्या के 1 से 20 गुना के बीच हों।", adjustSections: "नीचे खंडों की प्रश्न संख्या या प्रति प्रश्न अंक बदलें, अथवा वर्तमान खंडों का योग अपनाएँ।", useSectionTotals: "खंडों का योग अपनाएँ", editSections: "खंड संपादित करें", class10Only: "कक्षा 10 · पाठ्यक्रम RAG उपलब्ध", duration: "अवधि (मिनट)", difficulty: "कठिनाई", type: "पेपर का प्रकार", chapters: "RAG के लिए अध्याय", chapterSearch: "आधिकारिक अध्याय खोजें…", chapterRequired: "कम-से-कम एक अध्याय चुनें।", chapterNote: "आधिकारिक पाठ्यक्रम विषय, जिनसे खोज और प्रश्न निर्माण सटीक होता है।", chapterLoading: "आधिकारिक अध्याय लोड हो रहे हैं…", chapterEmpty: "इस कक्षा और विषय के लिए अध्याय सूची उपलब्ध नहीं है।", chapterNoMatch: "इस खोज से मिलता कोई अध्याय नहीं मिला।", chapterError: "आधिकारिक अध्याय लोड नहीं हो सके। फिर कोशिश करें या विषय बदलें।", ragAligned: "RAG संरेखित", selected: "चयनित", selectAll: "सभी चुनें", selectVisible: "दिख रहे चुनें", clear: "हटाएँ", removeChapter: "अध्याय हटाएँ", sections: "खंड", addSection: "खंड जोड़ें", sectionLimit: "अधिकतम 12 खंड", remove: "हटाएँ", removeSectionConfirm: "इस खंड में शिक्षक द्वारा लिखे प्रश्न हैं। खंड और उसके प्रश्न हटाएँ?", removeField: "फ़ील्ड हटाएँ", restoreField: "फिर जोड़ें", section: "खंड", sectionLabel: "हिंदी नाम", questionType: "प्रकार", count: "संख्या", marksEach: "प्रति प्रश्न अंक", wordLimit: "शब्द सीमा", addQuestion: "अपना प्रश्न जोड़ें", customQuestions: "शिक्षक के प्रश्न", questionText: "हिंदी में प्रश्न", answer: "उत्तर / कुंजी", alternative: "वैकल्पिक प्रश्न", option: "विकल्प", markingPoints: "अंक बिंदु, प्रत्येक नई पंक्ति में", optionalFields: "हटाई गई सेटिंग जोड़ें", optionalNote: "हटाई गई सेटिंग VidyaAI को नहीं भेजी जाती।", allFieldsShown: "सभी वैकल्पिक सेटिंग दिख रही हैं।", addField: "फ़ील्ड जोड़ें", loading: "पेपर बन रहा है…", action: "प्रश्न तैयार करें" },
    lessonForm: { title: "कल का पाठ तैयार करें", note: "VidyaAI पहले विषय समझाता है, फिर उसे पढ़ाने योग्य कक्षा क्रम में बदलता है।", duration: "पाठ की अवधि", readiness: "विद्यार्थियों की तैयारी", topic: "अध्याय या विषय", topicPlaceholder: "उदाहरण: कक्षा 10 विज्ञान अध्याय 2 — अम्ल, क्षार और लवण", notes: "VidyaAI किन बातों का ध्यान रखे?", notesPlaceholder: "वैकल्पिक: विद्यार्थियों को समीकरण कठिन लगते हैं; लैब उपलब्ध नहीं है…", loading: "पाठ तैयार हो रहा है…", action: "शिक्षण मार्गदर्शिका बनाएँ" },
    options: { hindi: "हिंदी", english: "अंग्रेज़ी", bilingual: "द्विभाषी", easy: "सरल", balanced: "संतुलित", challenging: "कठिन", unit: "इकाई परीक्षा", term: "सत्र परीक्षा", practice: "अभ्यास पेपर", worksheet: "वर्कशीट", mixed: "मिश्रित कक्षा", foundation: "आधार की आवश्यकता", advanced: "उन्नत", general: "सामान्य" },
    result: { error: "संसाधन नहीं बन सका", errorNote: "VidyaAI अभी यह संसाधन नहीं बना सका। कृपया फिर प्रयास करें।", loading: "VidyaAI कक्षा के लिए संसाधन तैयार कर रहा है…", loadingNote: "संरचना, शिक्षण क्रम और पाठ्यक्रम संदर्भ की जाँच हो रही है।", empty: "आपका बनाया संसाधन यहाँ दिखाई देगा", emptyNote: "फॉर्म पूरा करें और VidyaAI संपादन, कॉपी और प्रिंट के लिए तैयार ड्राफ्ट बनाएगा।", generated: "तैयार संसाधन", copy: "कॉपी", print: "PDF डाउनलोड करें", answerPrint: "उत्तर कुंजी डाउनलोड करें", edit: "पेपर संपादित करें", done: "संपादन पूरा", addQuestion: "प्रश्न जोड़ें", removeQuestion: "प्रश्न हटाएँ", questionText: "प्रश्न", answerText: "उत्तर / कुंजी", alternativeText: "वैकल्पिक प्रश्न", downloadPreparing: "PDF तैयार हो रही है…", blueprint: "प्रश्नपत्र रूपरेखा", paper: "विद्यार्थी प्रश्नपत्र", answers: "उत्तर कुंजी", sources: "प्रयुक्त स्रोत", previousPage: "पिछला पृष्ठ", nextPage: "अगला पृष्ठ", page: "पृष्ठ", structuredFallback: "AI सेवा कुछ समय के लिए व्यस्त थी, इसलिए VidyaAI ने आपके सप्ताह, पीरियड, लक्ष्य और उपलब्ध आधिकारिक पाठ्यक्रम-सीमा से यह पूरी योजना बनाई है। इसे अभी उपयोग या डाउनलोड किया जा सकता है।" },
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
const initialPaperSections = [
  { ui_id: "paper-section-a", ui_open: true, name: "A", type: "mcq", label_hi: "बहुविकल्पीय प्रश्न", count: 10, marks_each: 1, word_limit: "", custom_questions: [] },
  { ui_id: "paper-section-b", name: "B", type: "very_short", label_hi: "अति लघु उत्तरीय प्रश्न", count: 5, marks_each: 2, word_limit: "30", custom_questions: [] },
  { ui_id: "paper-section-c", name: "C", type: "short", label_hi: "लघु उत्तरीय प्रश्न", count: 5, marks_each: 3, word_limit: "50", custom_questions: [] },
  { ui_id: "paper-section-d", name: "D", type: "long", label_hi: "दीर्घ उत्तरीय प्रश्न", count: 3, marks_each: 5, word_limit: "100", custom_questions: [] },
];
const initialPaper = { class_level: "10", subject: "Science", selected_chapters: [], total_marks: 50, question_count: 23, duration_minutes: 90, difficulty: "balanced", paper_type: "unit_test", medium: "Hindi", enabled_fields: ["duration", "difficulty", "paper_type", "medium"], sections: initialPaperSections };
const paperTemplates = {
  unit: { total_marks: 20, question_count: 15, duration_minutes: 45, paper_type: "unit_test", sections: [{ name: "A", type: "mcq", count: 10, marks_each: 1 }, { name: "B", type: "very_short", count: 5, marks_each: 2 }] },
  term: { total_marks: 50, question_count: 23, duration_minutes: 90, paper_type: "term_exam", sections: [{ name: "A", type: "mcq", count: 10, marks_each: 1 }, { name: "B", type: "very_short", count: 5, marks_each: 2 }, { name: "C", type: "short", count: 5, marks_each: 3 }, { name: "D", type: "long", count: 3, marks_each: 5 }] },
  practice: { total_marks: 40, question_count: 30, duration_minutes: 60, paper_type: "practice", sections: [{ name: "A", type: "mcq", count: 20, marks_each: 1 }, { name: "B", type: "very_short", count: 10, marks_each: 2 }] },
};

const buildTemplateSections = (template) => template.sections.map((section, index) => ({
  ui_id: createPaperUiId("paper-template"), ui_open: index === 0, custom_questions: [], word_limit: paperTypePresets[section.type].word_limit,
  label_hi: paperTypePresets[section.type].label_hi, ...section,
}));
const initialLesson = { class_level: "10", subject: "Science", chapter_or_topic: "", lesson_minutes: 45, medium: "Hindi", student_level: "mixed", teacher_notes: "" };
const paperOptionalFields = [
  ["duration", "duration"],
  ["difficulty", "difficulty"],
  ["paper_type", "type"],
  ["medium", "medium"],
];

function Field({ label, children, wide = false, removable = false, onRemove, removeLabel = "Remove" }) {
  const fieldId = useId();
  return <div className={wide ? "teacher-field wide" : "teacher-field"}>
    <span className="teacher-field-heading"><label htmlFor={fieldId}>{label}</label>{removable && <button type="button" onClick={onRemove} aria-label={`${removeLabel}: ${label}`} title={`${removeLabel}: ${label}`}><span aria-hidden="true">×</span></button>}</span>
    {cloneElement(children, { id: children.props.id || fieldId })}
  </div>;
}

function ChapterPicker({ options, selected, onChange, loading, error, onRetry, t }) {
  const [search, setSearch] = useState("");
  const headingId = useId();
  const searchId = useId();
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleOptions = useMemo(() => options.filter((option) => `${option.code || option.id} ${option.label} ${option.group || ""}`.toLocaleLowerCase().includes(normalizedSearch)), [normalizedSearch, options]);
  const visibleGroups = useMemo(() => {
    const groups = new Map();
    visibleOptions.forEach((option) => {
      const group = option.group || "";
      groups.set(group, [...(groups.get(group) || []), option]);
    });
    return [...groups.entries()];
  }, [visibleOptions]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedOptions = useMemo(() => selected.map((id) => options.find((option) => option.id === id)).filter(Boolean), [options, selected]);
  useEffect(() => setSearch(""), [options]);
  const toggle = (id) => onChange(selectedSet.has(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  const selectOptions = (items) => onChange([...new Set([...selected, ...items.map((option) => option.id)])]);

  return (
    <section className="paper-chapter-picker" aria-labelledby={headingId} aria-busy={loading}>
      <header>
        <div><strong id={headingId}>{t.paperForm.chapters}</strong><p>{t.paperForm.chapterNote}</p></div>
        <span className="paper-rag-badge"><span aria-hidden="true" />{t.paperForm.ragAligned}</span>
      </header>
      <div className="paper-chapter-toolbar">
        <label htmlFor={searchId} className="paper-chapter-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg><span className="sr-only">{t.paperForm.chapterSearch}</span><input id={searchId} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.paperForm.chapterSearch} /></label>
        <span className="paper-chapter-count" aria-live="polite"><strong>{selected.length}</strong> {t.paperForm.selected}</span>
      </div>
      {selectedOptions.length > 0 && <div className="paper-selected-chapters" aria-label={`${selected.length} ${t.paperForm.selected}`}>
        {selectedOptions.map((option) => <button key={option.id} type="button" onClick={() => toggle(option.id)} aria-label={`${t.paperForm.removeChapter}: ${option.label}`}><span>{option.code || option.id}</span>{option.label}<b aria-hidden="true">×</b></button>)}
      </div>}
      <div className="paper-chapter-actions">
        <button type="button" disabled={loading || !visibleOptions.length} onClick={() => selectOptions(visibleOptions)}>{normalizedSearch ? t.paperForm.selectVisible : t.paperForm.selectAll}</button>
        <button type="button" disabled={!selected.length} onClick={() => onChange([])}>{t.paperForm.clear}</button>
      </div>
      {loading ? <div className="paper-chapter-state" role="status"><span className="paper-chapter-spinner" aria-hidden="true" />{t.paperForm.chapterLoading}</div>
        : error ? <div className="paper-chapter-state error" role="alert"><span>{t.paperForm.chapterError}</span><button type="button" onClick={onRetry}>{t.paperForm.section === "खंड" ? "फिर कोशिश करें" : "Retry"}</button></div>
          : !visibleOptions.length ? <div className="paper-chapter-state">{normalizedSearch ? t.paperForm.chapterNoMatch : t.paperForm.chapterEmpty}</div>
            : <div className="paper-chapter-options" role="group" aria-label={t.paperForm.chapters}>
              {visibleGroups.map(([group, groupOptions]) => <section className="paper-chapter-group" key={group || "chapters"} aria-label={group || t.paperForm.chapters}>
                {group && <h3>{group}</h3>}
                <div>{groupOptions.map((option) => <label key={option.id} className={selectedSet.has(option.id) ? "selected" : ""}><input type="checkbox" checked={selectedSet.has(option.id)} onChange={() => toggle(option.id)} /><span className="paper-chapter-check" aria-hidden="true">✓</span><span className="paper-chapter-code">{option.code || option.id}</span><strong>{option.label}</strong></label>)}</div>
              </section>)}
            </div>}
    </section>
  );
}

function OptionalPaperSettings({ enabled, onRestore, t }) {
  const hiddenFields = paperOptionalFields.filter(([id]) => !enabled.includes(id));
  if (!hiddenFields.length) return null;
  return <section className="paper-optional-settings">
    <header><div><strong>{t.paperForm.optionalFields}</strong><p>{t.paperForm.optionalNote}</p></div><span>{enabled.length}/{paperOptionalFields.length}</span></header>
    <div>{hiddenFields.map(([id, copyKey]) => <button key={id} type="button" onClick={() => onRestore(id)}><span aria-hidden="true">+</span>{copyKey === "medium" ? t.medium : t.paperForm[copyKey]}<small>{t.paperForm.restoreField}</small></button>)}</div>
  </section>;
}

function PaperSectionBuilder({ sections, onChange, t, units }) {
  const [openSectionIds, setOpenSectionIds] = useState(() => new Set(sections.filter((section) => section.ui_open).map((section) => section.ui_id)));
  const setSectionOpen = (sectionId, open) => setOpenSectionIds((current) => {
    if (current.has(sectionId) === open) return current;
    const next = new Set(current);
    if (open) next.add(sectionId);
    else next.delete(sectionId);
    return next;
  });
  const update = (index, field, value) => onChange(sections.map((section, itemIndex) => itemIndex === index ? { ...section, [field]: value } : section));
  const updateType = (index, value) => onChange(sections.map((section, itemIndex) => itemIndex !== index ? section : {
    ...section,
    ...paperTypePresets[value],
    type: value,
    custom_questions: (section.custom_questions || []).map((question) => ({ ...question, options_hi: value === "mcq" ? Array.from({ length: 4 }, (_, optionIndex) => question.options_hi?.[optionIndex] || "") : [] })),
  }));
  const commitNumber = (index, field, rawValue, minimum, maximum) => {
    const parsed = Math.round(Number(rawValue));
    update(index, field, Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : minimum);
  };
  const remove = (index) => {
    const section = sections[index];
    if ((section.custom_questions || []).length && !window.confirm(t.paperForm.removeSectionConfirm)) return;
    onChange(sections.filter((_, itemIndex) => itemIndex !== index));
  };
  const move = (index, offset) => {
    const destination = index + offset;
    if (destination < 0 || destination >= sections.length) return;
    const next = [...sections];
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange(next.map((section, itemIndex) => ({ ...section, name: String.fromCharCode(65 + itemIndex) })));
  };
  const add = () => {
    if (sections.length >= 12) return;
    const name = nextPaperSectionName(sections);
    const uiId = createPaperUiId("paper-section");
    setSectionOpen(uiId, true);
    onChange([...sections, { ui_id: uiId, ui_open: true, name, type: "short", ...paperTypePresets.short, count: 1, custom_questions: [] }]);
  };
  const updateQuestion = (sectionIndex, questionIndex, field, value) => onChange(sections.map((section, index) => index !== sectionIndex ? section : { ...section, custom_questions: section.custom_questions.map((question, itemIndex) => itemIndex === questionIndex ? { ...question, [field]: value } : question) }));
  const addQuestion = (sectionIndex) => onChange(sections.map((section, index) => {
    if (index !== sectionIndex) return section;
    const customQuestions = [...(section.custom_questions || []), { ui_id: createPaperUiId("teacher-question"), text_hi: "", options_hi: section.type === "mcq" ? ["", "", "", ""] : [], or_text_hi: "", answer_hi: "", marking_points_hi: [] }];
    return { ...section, custom_questions: customQuestions, count: Math.max(Number(section.count) || 0, customQuestions.length) };
  }));
  const removeQuestion = (sectionIndex, questionIndex) => onChange(sections.map((section, index) => index !== sectionIndex ? section : { ...section, custom_questions: section.custom_questions.filter((_, itemIndex) => itemIndex !== questionIndex) }));
  return (
    <fieldset id="paper-section-builder" className="paper-builder-sections" tabIndex="-1" aria-describedby="paper-blueprint-status">
      <legend>{t.paperForm.sections}</legend>
      {sections.map((section, index) => (
        <details className="paper-section-rule" key={section.ui_id} open={openSectionIds.has(section.ui_id)} onToggle={(event) => setSectionOpen(section.ui_id, event.currentTarget.open)}>
          <summary><span><strong>{t.paperForm.section} {section.name || index + 1}</strong><small>{Number(section.count) || 0} {units.questions} × {Number(section.marks_each) || 0} {(Number(section.marks_each) || 0) === 1 ? units.mark : units.marks} = {(Number(section.count) || 0) * (Number(section.marks_each) || 0)} {units.marks}</small></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary>
          <div className="paper-section-content">
          {sections.length > 1 && <div className="paper-section-actions"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${section.name}: ${t.paperForm.section === "खंड" ? "ऊपर ले जाएँ" : "Move up"}`}>↑</button><button type="button" disabled={index === sections.length - 1} onClick={() => move(index, 1)} aria-label={`${section.name}: ${t.paperForm.section === "खंड" ? "नीचे ले जाएँ" : "Move down"}`}>↓</button><button type="button" onClick={() => remove(index)} aria-label={`${t.paperForm.remove}: ${t.paperForm.section} ${section.name || index + 1}`}>{t.paperForm.remove}</button></div>}
          <div className="paper-section-fields">
            <Field label={t.paperForm.section}><input value={section.name} onChange={(event) => update(index, "name", event.target.value)} /></Field>
            <Field label={t.paperForm.questionType}><select value={section.type} onChange={(event) => updateType(index, event.target.value)}><option value="mcq">MCQ / बहुविकल्पीय</option><option value="very_short">Very short / अति लघु</option><option value="short">Short answer / लघु</option><option value="long">Long answer / दीर्घ</option></select></Field>
            <Field label={t.paperForm.count}><input type="number" inputMode="numeric" min={Math.max(1, section.custom_questions?.length || 0)} max="30" value={section.count} onChange={(event) => update(index, "count", event.target.value)} onBlur={(event) => commitNumber(index, "count", event.target.value, Math.max(1, section.custom_questions?.length || 0), 30)} /></Field>
            <Field label={t.paperForm.marksEach}><input type="number" inputMode="numeric" min="1" max="20" value={section.marks_each} onChange={(event) => update(index, "marks_each", event.target.value)} onBlur={(event) => commitNumber(index, "marks_each", event.target.value, 1, 20)} /></Field>
            <Field label={t.paperForm.wordLimit}><input value={section.word_limit} onChange={(event) => update(index, "word_limit", event.target.value)} /></Field>
            <Field label={t.paperForm.sectionLabel}><input value={section.label_hi} onChange={(event) => update(index, "label_hi", event.target.value)} /></Field>
          </div>
          {(section.custom_questions || []).length > 0 && <div className="paper-custom-question-list">
            <strong>{t.paperForm.customQuestions}</strong>
            {section.custom_questions.map((question, questionIndex) => <fieldset className="paper-custom-question" key={question.ui_id || questionIndex}>
              <legend>{t.paperForm.questionText} {questionIndex + 1}</legend>
              <button type="button" className="paper-custom-question-remove" onClick={() => removeQuestion(index, questionIndex)} aria-label={`${t.paperForm.remove}: ${t.paperForm.questionText} ${questionIndex + 1}`}>×</button>
              <Field label={t.paperForm.questionText} wide><textarea required rows="2" value={question.text_hi} onChange={(event) => updateQuestion(index, questionIndex, "text_hi", event.target.value)} /></Field>
              {section.type === "mcq" && <div className="paper-custom-options">{[0, 1, 2, 3].map((optionIndex) => <Field key={optionIndex} label={`${t.paperForm.option} ${["क", "ख", "ग", "घ"][optionIndex]}`}><input required value={question.options_hi?.[optionIndex] || ""} onChange={(event) => { const options = Array.from({ length: 4 }, (_, index) => question.options_hi?.[index] || ""); options[optionIndex] = event.target.value; updateQuestion(index, questionIndex, "options_hi", options); }} /></Field>)}</div>}
              <Field label={t.paperForm.alternative} wide><textarea rows="2" value={question.or_text_hi || ""} onChange={(event) => updateQuestion(index, questionIndex, "or_text_hi", event.target.value)} /></Field>
              <Field label={t.paperForm.answer} wide><textarea rows="2" value={question.answer_hi || ""} onChange={(event) => updateQuestion(index, questionIndex, "answer_hi", event.target.value)} /></Field>
              <Field label={t.paperForm.markingPoints} wide><textarea rows="2" value={(question.marking_points_hi || []).join("\n")} onChange={(event) => updateQuestion(index, questionIndex, "marking_points_hi", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></Field>
            </fieldset>)}
          </div>}
          <button className="paper-add-question" type="button" onClick={() => addQuestion(index)}>+ {t.paperForm.addQuestion}</button>
          </div>
        </details>
      ))}
      <button className="paper-add-section" type="button" onClick={add} disabled={sections.length >= 12}>+ {t.paperForm.addSection}</button>
      {sections.length >= 12 && <small className="paper-section-limit" role="status">{t.paperForm.sectionLimit}</small>}
    </fieldset>
  );
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

function TeacherAppHeader({ profile, logout, t, lang, streak, recent, meta, menuOpen, setMenuOpen, menuRef, onToggleLanguage, onOpenRecent }) {
  const profileTriggerRef = useRef(null);
  const profileDialogRef = useRef(null);
  const menuWasOpenRef = useRef(false);
  const teacherName = profile.name?.trim() || "Teacher";
  const classLevel = profile.class_level || "10";
  const medium = profile.medium || "Hindi";
  const curriculumCount = recent.filter((item) => item.type === "curriculum").length;
  const paperCount = recent.filter((item) => item.type === "paper").length;
  const guideCount = recent.filter((item) => item.type === "lesson").length;
  const lastActive = streak.lastActive || recent[0]?.createdAt;
  const profileLabel = lang === "hi" ? "शिक्षक प्रोफाइल" : "Teacher profile";

  useEffect(() => {
    if (menuOpen) {
      menuWasOpenRef.current = true;
      const frame = requestAnimationFrame(() => profileDialogRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    if (menuWasOpenRef.current) {
      profileTriggerRef.current?.focus();
      menuWasOpenRef.current = false;
    }
    return undefined;
  }, [menuOpen]);

  const keepDialogFocus = (event) => {
    if (event.key !== "Tab" || !profileDialogRef.current) return;
    const focusable = [...profileDialogRef.current.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === profileDialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <header className={`dashboard-main-top teacher-app-header${menuOpen ? " profile-menu-open" : ""}`}>
      <div className="header-left-cluster">
        <div className="dashboard-title-block">
          <h1>{lang === "hi" ? "नमस्ते, " : "Hello, "}<span>{teacherName}</span></h1>
          <div className="student-tags">
            <span>{t.roleBadge}</span>
            <span>{t.classLabel} {classLevel}</span>
            <span>{medium}</span>
          </div>
        </div>
      </div>

      <div className="top-actions" ref={menuRef}>
        <div className="mobile-brand-mark" aria-label="VidyaAI">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m3 10 9-5 9 5-9 5-9-5Z" />
            <path d="M7 12v4.5c0 .8 2.2 2.5 5 2.5s5-1.7 5-2.5V12" />
            <path d="M21 10v5" />
          </svg>
        </div>

        <div className="header-status-chips" aria-label={t.insights.activeDays}>
          <span title={t.streak}>
            <b className="streak-flame" aria-hidden="true"><FireIcon /></b>
            <strong className="streak-count-mobile">{streak.count || 0}</strong>
            <strong className="streak-count-desktop">{streak.count || 0} {lang === "hi" ? "दिन" : "days"}</strong>
            <small>{t.streak}</small>
          </span>
        </div>

        <button type="button" className={`header-language-switch ${lang === "en" ? "english" : "hindi"}`} onClick={onToggleLanguage} aria-label={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"}>
          <span>अ</span><span>A</span>
        </button>

        <div className="mobile-profile-wrap">
          <button ref={profileTriggerRef} type="button" className="mobile-profile-chip" onClick={() => setMenuOpen((open) => !open)} title={profileLabel} aria-expanded={menuOpen} aria-controls="teacher-profile-menu" aria-haspopup="dialog">
            <span className="mobile-profile-avatar" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>
            </span>
            <span className="mobile-profile-copy"><strong>{teacherName}</strong><small>{t.roleBadge} · {medium}</small></span>
            <svg className="profile-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>

        {menuOpen && (
          <>
            <button type="button" className="mobile-profile-backdrop" onClick={() => setMenuOpen(false)} aria-label={lang === "hi" ? "प्रोफाइल बंद करें" : "Close profile"} />
            <div ref={profileDialogRef} className="mobile-profile-menu" id="teacher-profile-menu" role="dialog" aria-modal="true" aria-label={profileLabel} tabIndex="-1" onKeyDown={keepDialogFocus}>
              <div className="mobile-profile-menu-head"><strong>{teacherName}</strong><span>{profile.email || t.roleBadge}</span></div>
              <dl>
                <div><dt>{lang === "hi" ? "भूमिका" : "Role"}</dt><dd>{lang === "hi" ? "शिक्षक" : "Teacher"}</dd></div>
                <div><dt>{t.classLabel}</dt><dd>{classLevel}</dd></div>
                <div><dt>{t.medium}</dt><dd>{medium}</dd></div>
                <div><dt>Board</dt><dd>CGBSE</dd></div>
              </dl>
              <div className="mobile-learning-panel">
                <div className="mobile-learning-head"><strong>{lang === "hi" ? "तैयारी गतिविधि" : "Preparation activity"}</strong><span>{meta.title}</span></div>
                <div className="mobile-learning-grid">
                  <div><span>{lang === "hi" ? "संसाधन" : "Resources"}</span><strong>{recent.length}</strong></div>
                  <div><span>{t.insights.curricula}</span><strong>{curriculumCount}</strong></div>
                  <div><span>{t.insights.papers}</span><strong>{paperCount}</strong></div>
                  <div><span>{lang === "hi" ? "शिक्षण गाइड" : "Teaching guides"}</span><strong>{guideCount}</strong></div>
                </div>
                <div className="teacher-profile-activity-note"><span>{t.insights.activeDays}: <strong>{streak.count || 0}</strong></span><span>{lastActive ? `${t.insights.lastActive}: ${new Date(lastActive).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")}` : t.insights.noRecent}</span></div>
                {recent.length > 0 && <div className="mobile-learning-subjects">{recent.slice(0, 3).map((item) => <button key={item.createdAt} type="button" onClick={() => { setMenuOpen(false); onOpenRecent(item); }}><span>{item.title}</span><small>{t.recent[item.type] || t.recent.curriculum}</small></button>)}</div>}
              </div>
              <button type="button" className="profile-menu-action teacher-profile-logout" onClick={logout}><Icon name="logout" size={17} />{t.logout}</button>
            </div>
          </>
        )}
      </div>
    </header>
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

function TeacherStreamingResponse({ content, animate, onProgress }) {
  const tokens = useMemo(() => (content || "").match(/\S+\s*/g) || [], [content]);
  const [visibleCount, setVisibleCount] = useState(animate ? 0 : tokens.length);
  useEffect(() => {
    if (!animate || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisibleCount(tokens.length);
      return undefined;
    }
    setVisibleCount(0);
    const wordsPerTick = Math.max(1, Math.ceil(tokens.length / 320));
    const timer = window.setInterval(() => setVisibleCount((current) => {
      const next = Math.min(current + wordsPerTick, tokens.length);
      if (next >= tokens.length) window.clearInterval(timer);
      onProgress?.();
      return next;
    }), 28);
    return () => window.clearInterval(timer);
  }, [animate, content, tokens.length]);
  const streaming = visibleCount < tokens.length;
  return <div className={`streaming-markdown${streaming ? " is-streaming" : ""}`}><RichMarkdown streaming={streaming}>{tokens.slice(0, visibleCount).join("")}</RichMarkdown></div>;
}

function TeacherChat({ compact = false, t, lang, question, setQuestion, subject, setSubject, answerStyle, setAnswerStyle, loading, messages, onSubmit, onClear, onOpenFull, onCopy, onRetry, onFeedback, onChapterOption }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const chatWindowRef = useRef(null);
  const followOutputRef = useRef(true);
  const scrollFrameRef = useRef(null);
  const followLatestOutput = () => {
    if (!followOutputRef.current || scrollFrameRef.current) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      const windowElement = chatWindowRef.current;
      if (windowElement) windowElement.scrollTop = windowElement.scrollHeight;
      scrollFrameRef.current = null;
    });
  };
  useEffect(() => {
    const windowElement = chatWindowRef.current;
    if (!windowElement) return;
    followOutputRef.current = true;
    followLatestOutput();
    return () => {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    };
  }, [messages, loading]);
  const prompts = lang === "hi"
    ? ["कक्षा 10 में प्रकाश का परावर्तन कैसे पढ़ाएँ?", "अम्ल और क्षार के लिए कक्षा गतिविधि बनाएँ।", "कमजोर विद्यार्थियों के लिए भिन्न समझाएँ।"]
    : ["How should I teach reflection of light in Class 10?", "Create a classroom activity for acids and bases.", "Explain fractions for struggling learners."];
  return (
    <section className={`teacher-chat-panel${compact ? " compact" : ""}`}>
      <div className="teacher-chat-toolbar">
        <div className="teacher-chat-heading"><strong>{compact ? t.homeChat.title : t.nav.chat}</strong><span>{compact ? t.homeChat.note : t.chatWelcome}</span></div>
        {!compact && <><button type="button" className="teacher-chat-settings-toggle" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}><Icon name="settings" size={16} />{lang === "hi" ? "विषय" : "Subject"}</button><div className={`teacher-chat-settings${settingsOpen ? " open" : ""}`}><label><span>{t.subject}</span><select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="General">{t.options.general}</option>{subjects.map((item) => <option key={item} value={item}>{t.subjectNames[item]}</option>)}</select></label><label><span>{lang === "hi" ? "उत्तर शैली" : "Answer style"}</span><select value={answerStyle} onChange={(event) => setAnswerStyle(event.target.value)}>{teacherAnswerStyles.map((style) => <option key={style.id} value={style.id}>{style[lang]}</option>)}</select></label></div></>}
        {compact ? <button type="button" onClick={onOpenFull}>{t.homeChat.open} <Icon name="arrowRight" size={17} /></button> : <button type="button" onClick={onClear}>{t.newChat}</button>}
      </div>
      <div ref={chatWindowRef} className="teacher-chat-window" role="log" aria-label={compact ? t.homeChat.title : t.nav.chat} aria-live="polite" tabIndex="0" onScroll={(event) => { const element = event.currentTarget; followOutputRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120; }}>
        {!messages.length && !loading && (
          <div className="teacher-chat-welcome"><span><Icon name="sparkle" size={30} /></span>{!compact && <h2>{t.ask}</h2>}<p>{t.chatWelcome}</p><div>{prompts.slice(0, compact ? 2 : 3).map((prompt) => <button key={prompt} type="button" onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div></div>
        )}
        {messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`teacher-chat-message ${message.role}`}>
            <span>{message.role === "teacher" ? t.you : t.assistant}</span>
            <div>
              {message.role === "assistant" ? <TeacherStreamingResponse content={message.content} animate={message.animateResponse} onProgress={followLatestOutput} /> : <RichMarkdown>{message.content}</RichMarkdown>}
              {message.chapterOptions?.length > 0 && <div className="chapter-option-list">{message.chapterOptions.map((option) => <button key={option.section} type="button" disabled={loading} onClick={() => onChapterOption(option)}><span>{option.section}</span>{option.title}</button>)}</div>}
              {message.sources?.length > 0 && (
                <details className="teacher-chat-references">
                  <summary><Icon name="library" size={14} />{lang === "hi" ? "संदर्भ देखें" : "View references"}<span>{new Set(message.sources).size}</span></summary>
                  <div>{[...new Set(message.sources)].map((source) => <small key={source}>{source}</small>)}</div>
                </details>
              )}
            </div>
            {message.role !== "error" && <div className="teacher-message-actions">
              <button type="button" className="icon-btn copy-action" onClick={() => onCopy(message.content)} title={lang === "hi" ? "कॉपी करें" : "Copy"} aria-label={lang === "hi" ? "कॉपी करें" : "Copy"}><Icon name="copy" size={16} /></button>
              <button type="button" className="icon-btn retry-action" onClick={() => onRetry(message)} disabled={loading} title={lang === "hi" ? "फिर से बनाएँ" : "Regenerate"} aria-label={lang === "hi" ? "फिर से बनाएँ" : "Regenerate"}><Icon name="refresh" size={16} /></button>
              {message.role === "assistant" && !message.chapterOptions?.length && <><button type="button" className={`icon-btn feedback-icon positive${message.feedback === "up" ? " active" : ""}`} onClick={() => onFeedback(index, message.sessionId, true)} disabled={!message.sessionId} title={lang === "hi" ? "अच्छा उत्तर" : "Good answer"} aria-label={lang === "hi" ? "अच्छा उत्तर" : "Good answer"}><Icon name="thumbUp" size={16} /></button><button type="button" className={`icon-btn feedback-icon negative${message.feedback === "down" ? " active" : ""}`} onClick={() => onFeedback(index, message.sessionId, false)} disabled={!message.sessionId} title={lang === "hi" ? "सुधार चाहिए" : "Needs improvement"} aria-label={lang === "hi" ? "सुधार चाहिए" : "Needs improvement"}><Icon name="thumbDown" size={16} /></button></>}
            </div>}
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
  const [lang, setLang] = useState(() => localStorage.getItem("vidyaai_teacher_lang") || "hi");
  const [profile, setProfile] = useState({ name: "Teacher", email: "", class_level: "10", medium: "Hindi", role: "teacher" });
  const [curriculum, setCurriculum] = useState(initialCurriculum);
  const [paper, setPaper] = useState(initialPaper);
  const [chapterOptions, setChapterOptions] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState("");
  const [chapterRetry, setChapterRetry] = useState(0);
  const [paperScopeError, setPaperScopeError] = useState("");
  const [paperBlueprintTouched, setPaperBlueprintTouched] = useState(false);
  const paperBlueprintStatusRef = useRef(null);
  const previousPaperRef = useRef(paper);
  const paperDraftLoadedRef = useRef(false);
  const [paperDraftStatus, setPaperDraftStatus] = useState("");
  const [lesson, setLesson] = useState(initialLesson);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatSubject, setChatSubject] = useState("General");
  const [chatAnswerStyle, setChatAnswerStyle] = useState("default");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [pyqSubject, setPyqSubject] = useState("All");
  const [assessmentPapers, setAssessmentPapers] = useState([]);
  const [paperCatalogLoaded, setPaperCatalogLoaded] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileToolRefs = useRef({});
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

  useEffect(() => {
    if (window.matchMedia("(max-width: 820px)").matches) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      mobileToolRefs.current[activeTool]?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTool]);

  useEffect(() => {
    let active = true;
    const requestedSubject = paper.subject;
    const requestedClass = paper.class_level;
    setChapterLoading(true);
    setChapterError("");
    api.get("/teacher/chapter-options", { params: { subject: requestedSubject, class_level: requestedClass } })
      .then(({ data }) => {
        if (!active) return;
        const chapters = Array.isArray(data?.chapters)
          ? data.chapters.filter((chapter) => chapter?.id && chapter?.label).map((chapter) => ({ id: String(chapter.id), code: String(chapter.code || chapter.id), label: String(chapter.label), group: String(chapter.group || "") }))
          : [];
        const validIds = new Set(chapters.map((chapter) => chapter.id));
        setChapterOptions(chapters);
        setPaper((current) => current.subject === requestedSubject && current.class_level === requestedClass
          ? { ...current, selected_chapters: current.selected_chapters.filter((id) => validIds.has(id)) }
          : current);
      })
      .catch(() => {
        if (!active) return;
        setChapterOptions([]);
        setChapterError("chapter-options");
      })
      .finally(() => { if (active) setChapterLoading(false); });
    return () => { active = false; };
  }, [paper.class_level, paper.subject, chapterRetry]);

  useEffect(() => {
    if (activeTool !== "pyq" || assessmentPapers.length) return;
    import("../data/assessmentPapers").then(({ assessmentPapers: papers }) => setAssessmentPapers(papers)).finally(() => setPaperCatalogLoaded(true));
  }, [activeTool, assessmentPapers.length]);

  useEffect(() => {
    if (previousPaperRef.current !== paper && result?.type === "paper") setResult(null);
    previousPaperRef.current = paper;
  }, [paper]);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setShowProfileMenu(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowProfileMenu(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProfileMenu]);

  const recentKey = useMemo(() => `vidyaai_teacher_recent_${profile.email || "local"}`, [profile.email]);
  const paperDraftKey = useMemo(() => profile.email ? `vidyaai_paper_draft_v1_${profile.email.toLowerCase()}` : "", [profile.email]);
  const [recent, setRecent] = useState([]);
  const tourSteps = lang === "hi" ? [
    { target: ".teacher-sidebar", icon: "teacher", kicker: "शिक्षक कार्यक्षेत्र", title: "सभी शिक्षण टूल्स एक जगह", body: "होम, पाठ्यक्रम, प्रश्नपत्र, पाठ योजना, AI चैट और PYQ लाइब्रेरी के बीच यहाँ से जाएँ।", skipLabel: "टूर छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "शुरू करें" },
    { target: ".teacher-hero", icon: "home", kicker: "आज की तैयारी", title: "अपना दैनिक कार्यक्षेत्र देखें", body: "होम स्क्रीन आपको उपलब्ध टूल्स, त्वरित AI सहायता और हाल में बनाए गए संसाधनों का स्पष्ट सार देती है।", skipLabel: "टूर छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "शुरू करें" },
    { target: ".teacher-tool-grid", icon: "curriculum", kicker: "सामग्री निर्माण", title: "योजना, प्रश्नपत्र और पाठ बनाएँ", body: "हर टूल चुनी हुई कक्षा, विषय और अध्याय के आधार पर संपादन योग्य प्रारूप तैयार करता है। उपयोग से पहले सामग्री की जाँच करें।", skipLabel: "टूर छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "शुरू करें" },
    { target: ".teacher-insights-rail", icon: "chart", kicker: "तैयारी मेट्रिक्स", title: "अपनी गतिविधि पर नज़र रखें", body: "दाईं ओर बनाए गए संसाधन, सक्रिय दिन, हाल की गतिविधि और त्वरित कार्रवाइयाँ दिखाई देती हैं।", skipLabel: "टूर छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "शुरू करें" },
  ] : [
    { target: ".teacher-sidebar", icon: "teacher", kicker: "TEACHER WORKSPACE", title: "Every teaching tool in one place", body: "Move between Home, Curriculum, Question Paper, Lesson Guide, AI Chat, and the PYQ library from here.", skipLabel: "Skip tour", backLabel: "Back", nextLabel: "Next", finishLabel: "Get started" },
    { target: ".teacher-hero", icon: "home", kicker: "TODAY'S PREPARATION", title: "See your daily workspace", body: "Home gives you a clear overview of available tools, quick AI support, and your recently created resources.", skipLabel: "Skip tour", backLabel: "Back", nextLabel: "Next", finishLabel: "Get started" },
    { target: ".teacher-tool-grid", icon: "curriculum", kicker: "RESOURCE CREATION", title: "Build plans, papers, and lessons", body: "Each tool creates an editable draft from your chosen class, subject, and chapters. Review every resource before classroom use.", skipLabel: "Skip tour", backLabel: "Back", nextLabel: "Next", finishLabel: "Get started" },
    { target: ".teacher-insights-rail", icon: "chart", kicker: "PREPARATION METRICS", title: "Keep track of your activity", body: "The right rail shows created resources, active days, recent work, and shortcuts for your next action.", skipLabel: "Skip tour", backLabel: "Back", nextLabel: "Next", finishLabel: "Get started" },
  ];
  const paperTourSteps = lang === "hi" ? [
    { target: ".paper-template-bar", icon: "paper", kicker: "त्वरित शुरुआत", title: "तैयार प्रारूप चुनें", body: "यूनिट टेस्ट, टर्म परीक्षा या अभ्यास पेपर से शुरुआत करें और फिर हर सेटिंग बदलें।", skipLabel: "गाइड छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "पेपर बनाएँ" },
    { target: ".paper-blueprint-status", icon: "check", kicker: "सटीक अंक", title: "लक्ष्य और खंड मिलाएँ", body: "यह स्थिति बताती है कि कुल अंक और प्रश्न संख्या आपके खंडों के विन्यास से मेल खाते हैं या नहीं।", skipLabel: "गाइड छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "पेपर बनाएँ" },
    { target: "#paper-section-builder", icon: "curriculum", kicker: "खंड नियंत्रण", title: "खंड जोड़ें और क्रम बदलें", body: "प्रश्न प्रकार, संख्या, अंक और अपने प्रश्न संपादित करें। तीर बटन से खंडों को कीबोर्ड-सुलभ तरीके से ऊपर या नीचे करें।", skipLabel: "गाइड छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "पेपर बनाएँ" },
    { target: ".paper-builder-form .teacher-generate", icon: "sparkle", kicker: "AI ड्राफ्ट", title: "जाँच के बाद पेपर बनाएँ", body: "VidyaAI ड्राफ्ट तैयार करेगा। कक्षा में उपयोग से पहले हर प्रश्न, उत्तर और अंक-वितरण अवश्य जाँचें।", skipLabel: "गाइड छोड़ें", backLabel: "पीछे", nextLabel: "आगे", finishLabel: "पेपर बनाएँ" },
  ] : [
    { target: ".paper-template-bar", icon: "paper", kicker: "QUICK START", title: "Choose a ready blueprint", body: "Begin with a Unit Test, Term Exam, or Practice Paper, then customise every setting.", skipLabel: "Skip guide", backLabel: "Back", nextLabel: "Next", finishLabel: "Build my paper" },
    { target: ".paper-blueprint-status", icon: "check", kicker: "EXACT MARKS", title: "Match targets and sections", body: "This status tells you whether total marks and question count match the section blueprint.", skipLabel: "Skip guide", backLabel: "Back", nextLabel: "Next", finishLabel: "Build my paper" },
    { target: "#paper-section-builder", icon: "curriculum", kicker: "SECTION CONTROL", title: "Add and reorder sections", body: "Edit question type, count, marks, and teacher-written questions. Arrow controls provide accessible reordering.", skipLabel: "Skip guide", backLabel: "Back", nextLabel: "Next", finishLabel: "Build my paper" },
    { target: ".paper-builder-form .teacher-generate", icon: "sparkle", kicker: "AI DRAFT", title: "Generate after validation", body: "VidyaAI creates a draft. Review every question, answer, and mark allocation before classroom use.", skipLabel: "Skip guide", backLabel: "Back", nextLabel: "Next", finishLabel: "Build my paper" },
  ];

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(recentKey) || "[]")); } catch { setRecent([]); }
  }, [recentKey]);

  useEffect(() => {
    if (!paperDraftKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(paperDraftKey) || "null");
      if (saved?.paper?.sections?.length) {
        setPaper({ ...initialPaper, ...saved.paper });
        setPaperDraftStatus(lang === "hi" ? "पिछला ड्राफ्ट वापस लाया गया" : "Previous draft restored");
      }
    } catch {}
    paperDraftLoadedRef.current = true;
  }, [paperDraftKey]);

  useEffect(() => {
    if (!paperDraftKey || !paperDraftLoadedRef.current) return undefined;
    setPaperDraftStatus(lang === "hi" ? "सेव हो रहा है…" : "Saving…");
    const timer = window.setTimeout(() => {
      localStorage.setItem(paperDraftKey, JSON.stringify({ paper, savedAt: new Date().toISOString() }));
      setPaperDraftStatus(lang === "hi" ? "ड्राफ्ट अपने आप सेव हो गया" : "Draft autosaved");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [paper, paperDraftKey, lang]);

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

  const askTeacherQuestion = async (rawQuestion, subjectOverride = chatSubject, styleOverride = chatAnswerStyle) => {
    const question = rawQuestion.trim();
    if (!question || chatLoading) return;
    setChatQuestion("");
    setChatMessages((items) => [...items, { role: "teacher", content: question, question, subject: subjectOverride, answerStyle: styleOverride }]);
    setChatLoading(true);
    recordActivity();
    try {
      const response = await api.post("/chat/ask", { question, subject: subjectOverride, answer_style: styleOverride });
      setChatMessages((items) => [...items, { role: "assistant", content: response.data.answer, sources: response.data.sources || [], sessionId: response.data.session_id, chapterOptions: response.data.chapter_options || [], question, subject: subjectOverride, answerStyle: styleOverride, feedback: null, animateResponse: true }]);
    } catch (err) {
      setChatMessages((items) => [...items, { role: "error", content: err?.response?.data?.detail || "VidyaAI could not answer right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };
  const askChat = async (event) => {
    event.preventDefault();
    await askTeacherQuestion(chatQuestion);
  };
  const copyChatMessage = async (content) => {
    try { await navigator.clipboard.writeText(content); } catch {}
  };
  const retryChatMessage = async (message) => {
    const retryQuestion = message.question || message.content;
    if (!retryQuestion) return;
    setChatSubject(message.subject || chatSubject);
    setChatAnswerStyle(message.answerStyle || chatAnswerStyle);
    await askTeacherQuestion(retryQuestion, message.subject || chatSubject, message.answerStyle || chatAnswerStyle);
  };
  const rateChatMessage = async (messageIndex, sessionId, understood) => {
    if (!sessionId) return;
    setChatMessages((items) => items.map((message, index) => index === messageIndex ? { ...message, feedback: understood ? "up" : "down" } : message));
    try {
      await api.post("/chat/feedback", { session_id: sessionId, understood });
    } catch {
      setChatMessages((items) => items.map((message, index) => index === messageIndex ? { ...message, feedback: null } : message));
    }
  };
  const chooseChatChapter = async (option) => {
    const optionSubject = option.subject || chatSubject;
    setChatSubject(optionSubject);
    await askTeacherQuestion(option.prompt || `class 10 ${optionSubject} chapter ${option.section}`, optionSubject, chatAnswerStyle);
  };

  const runTool = async (endpoint, payload, title, type) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await api.post(endpoint, payload);
      const entry = {
        title,
        type,
        content: response.data.content,
        paper_content: response.data.paper_content || "",
        answer_key: response.data.answer_key || "",
        blueprint: response.data.blueprint || "",
        medium: response.data.medium || payload.medium,
        paper_meta: response.data.paper_meta || (type === "paper" ? {
          board: "CGBSE",
          session: "2026–27",
          class_level: payload.class_level,
          subject: payload.subject,
          total_marks: payload.total_marks,
          duration_minutes: payload.duration_minutes,
          paper_type: payload.paper_type,
        } : null),
        paper_data: response.data.paper_data || null,
        generation_mode: response.data.generation_mode || "ai",
        curriculum_meta: response.data.curriculum_meta || null,
        sources: response.data.sources || [],
        createdAt: new Date().toISOString(),
      };
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
    setShowProfileMenu(false);
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
  const enabledPaperFields = paper.enabled_fields || [];
  const paperUnits = lang === "hi" ? { questions: "प्रश्न", mark: "अंक", marks: "अंक" } : { questions: "questions", mark: "mark", marks: "marks" };
  const blueprintTotals = paperSectionTotals(paper.sections);
  const targetMarks = Number(paper.total_marks);
  const targetQuestions = Number(paper.question_count);
  const blueprintCanBeTarget = blueprintTotals.marks >= 5 && blueprintTotals.marks <= 200
    && blueprintTotals.questions >= 1 && blueprintTotals.questions <= 100
    && blueprintTotals.marks >= blueprintTotals.questions && blueprintTotals.marks <= blueprintTotals.questions * 20;
  const paperTargetsValid = Number.isInteger(targetMarks) && targetMarks >= 5 && targetMarks <= 200
    && Number.isInteger(targetQuestions) && targetQuestions >= 1 && targetQuestions <= 100
    && targetMarks >= targetQuestions && targetMarks <= targetQuestions * 20;
  const paperBlueprintMatches = paperTargetsValid && targetMarks === blueprintTotals.marks && targetQuestions === blueprintTotals.questions;
  const setPaperScope = (field, value) => {
    setPaperScopeError("");
    setPaper((current) => ({ ...current, [field]: value, selected_chapters: [] }));
  };
  const removePaperField = (field) => setPaper((current) => ({ ...current, enabled_fields: current.enabled_fields.filter((item) => item !== field) }));
  const restorePaperField = (field) => setPaper((current) => ({ ...current, enabled_fields: [...new Set([...current.enabled_fields, field])] }));
  const useCurrentSectionTotals = () => {
    setPaperBlueprintTouched(false);
    setPaper((current) => ({ ...current, total_marks: blueprintTotals.marks, question_count: blueprintTotals.questions }));
  };
  const applyPaperTemplate = (templateId) => {
    const template = paperTemplates[templateId];
    if (!template) return;
    setPaperBlueprintTouched(false);
    setResult(null);
    setPaper((current) => ({ ...current, ...template, sections: buildTemplateSections(template) }));
  };
  const clearPaperDraft = () => {
    if (!window.confirm(lang === "hi" ? "सहेजा हुआ ड्राफ्ट हटाकर नया पेपर शुरू करें?" : "Clear the saved draft and start a new paper?")) return;
    localStorage.removeItem(paperDraftKey);
    setPaper({ ...initialPaper, sections: initialPaperSections.map((section) => ({ ...section, custom_questions: [] })) });
    setPaperDraftStatus(lang === "hi" ? "नया ड्राफ्ट शुरू हुआ" : "New draft started");
  };
  const focusPaperBlueprint = () => requestAnimationFrame(() => paperBlueprintStatusRef.current?.focus());
  const submitPaper = (event) => {
    event.preventDefault();
    const missingScope = !paper.selected_chapters.length;
    setPaperScopeError(missingScope ? t.paperForm.chapterRequired : "");
    setPaperBlueprintTouched(!paperBlueprintMatches);
    if (!paperBlueprintMatches || missingScope) {
      if (!paperBlueprintMatches) focusPaperBlueprint();
      return;
    }
    const payload = { class_level: paper.class_level, subject: paper.subject, selected_chapters: paper.selected_chapters, sections: serializePaperSections(paper.sections), total_marks: targetMarks, question_count: targetQuestions };
    if (enabledPaperFields.includes("duration")) payload.duration_minutes = paper.duration_minutes;
    if (enabledPaperFields.includes("difficulty")) payload.difficulty = paper.difficulty;
    if (enabledPaperFields.includes("paper_type")) payload.paper_type = paper.paper_type;
    if (enabledPaperFields.includes("medium")) payload.medium = paper.medium;
    runTool("/teacher/test-paper", payload, `${paper.class_level} ${paper.subject} ${targetMarks}-mark paper`, "paper");
  };

  return (
    <div className={`teacher-shell teacher-tool-${activeTool}`}>
      <a className="skip-link" href="#teacher-main">{lang === "hi" ? "मुख्य सामग्री पर जाएँ" : "Skip to main content"}</a>
      <TeacherAppHeader
        profile={profile}
        logout={logout}
        t={t}
        lang={lang}
        streak={streak}
        recent={recent}
        meta={meta}
        menuOpen={showProfileMenu}
        setMenuOpen={setShowProfileMenu}
        menuRef={profileMenuRef}
        onToggleLanguage={toggleLanguage}
        onOpenRecent={(item) => { setResult(item); setError(""); setActiveTool(item.type); }}
      />
      <aside className="teacher-sidebar">
        <div className="teacher-sidebar-head">
          <BrandMark compact tone="teacher" tagline={t.brandTagline} />
        </div>
        <div className="teacher-role-badge">{t.roleBadge}</div>
        <div className="teacher-mobile-tool-strip" role="navigation" aria-label={lang === "hi" ? "शिक्षक टूल" : "Teacher tools"}>
          {[["home", "home"], ["curriculum", "curriculum"], ["paper", "paper"], ["lesson", "lesson"], ["chat", "chat"], ["pyq", "library"]].map(([id, icon]) => (
            <button ref={(node) => { mobileToolRefs.current[id] = node; }} key={id} type="button" className={activeTool === id ? "active" : ""} aria-current={activeTool === id ? "page" : undefined} onClick={() => openTool(id)}>
              <Icon name={icon} size={16} />
              <span>{t.nav[id]}</span>
            </button>
          ))}
        </div>
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
        <div className="teacher-account" aria-label={lang === "hi" ? "शिक्षक प्रोफाइल" : "Teacher profile"}>
          <span aria-hidden="true">{profile.name?.trim()?.charAt(0)?.toUpperCase() || "T"}</span>
          <div>
            <strong>{profile.name?.trim() || "Teacher"}</strong>
            <small>{t.classLabel} {profile.class_level || "10"} · {profile.medium || "Hindi"}</small>
          </div>
          <button type="button" onClick={logout} title={t.logout} aria-label={t.logout}><Icon name="logout" size={18} /></button>
        </div>
      </aside>

      <main className="teacher-main" id="teacher-main" tabIndex="-1">
        {activeTool === "home" && (
          <>
            <section className="teacher-hero">
              <div><span>{t.hero.kicker}</span><h2>{t.hero.title}</h2><p>{t.hero.text}</p></div>
              <div className="teacher-hero-stat"><strong>5</strong><span>{t.hero.stat}</span><small>{t.hero.statNote}</small></div>
            </section>
            <div className="teacher-home-chat-heading"><span>{t.homeChat.kicker}</span></div>
            <TeacherChat compact t={t} lang={lang} question={chatQuestion} setQuestion={setChatQuestion} subject={chatSubject} setSubject={setChatSubject} answerStyle={chatAnswerStyle} setAnswerStyle={setChatAnswerStyle} loading={chatLoading} messages={chatMessages} onSubmit={askChat} onClear={() => setChatMessages([])} onOpenFull={() => openTool("chat")} onCopy={copyChatMessage} onRetry={retryChatMessage} onFeedback={rateChatMessage} onChapterOption={chooseChatChapter} />
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
              <button className="teacher-generate" type="submit" disabled={loading} aria-busy={loading}>{loading ? t.curriculumForm.loading : t.curriculumForm.action}</button>
            </form>
            {renderResult(result, error, loading, copyResult, t)}
          </section>
        )}

        {activeTool === "paper" && (
          <section className="teacher-workspace">
            <form onSubmit={submitPaper} className="teacher-generator-form paper-builder-form">
              <div className="teacher-form-title"><span>02</span><div><h2>{t.paperForm.title}</h2><p>{t.paperForm.note}</p></div></div>
              <div className="paper-template-bar">
                <div><strong>{lang === "hi" ? "प्रारूप से शुरू करें" : "Start from a blueprint"}</strong><small aria-live="polite">{paperDraftStatus}</small></div>
                <div><button type="button" onClick={() => applyPaperTemplate("unit")}>{lang === "hi" ? "यूनिट टेस्ट · 20" : "Unit test · 20"}</button><button type="button" onClick={() => applyPaperTemplate("term")}>{lang === "hi" ? "टर्म परीक्षा · 50" : "Term exam · 50"}</button><button type="button" onClick={() => applyPaperTemplate("practice")}>{lang === "hi" ? "अभ्यास · 40" : "Practice · 40"}</button><button type="button" className="paper-clear-draft" onClick={clearPaperDraft}>{lang === "hi" ? "नया" : "New"}</button></div>
              </div>
              <div className="teacher-form-grid">
                <Field label={t.classLabel}><select value={paper.class_level} onChange={(e) => setPaperScope("class_level", e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></Field>
                <Field label={t.subject}><select value={paper.subject} onChange={(e) => setPaperScope("subject", e.target.value)}>{subjects.map((item) => <option key={item} value={item}>{t.subjectNames[item]}</option>)}</select></Field>
                <Field label={t.paperForm.marks}><input className="paper-target-input" type="number" inputMode="numeric" min="5" max="200" step="1" value={paper.total_marks} aria-describedby="paper-target-note paper-blueprint-status" aria-invalid={paperBlueprintTouched && !paperTargetsValid} onChange={(e) => setPaper((current) => ({ ...current, total_marks: e.target.value }))} onBlur={() => setPaperBlueprintTouched(true)} /></Field>
                <Field label={t.paperForm.questions}><input className="paper-target-input" type="number" inputMode="numeric" min="1" max="100" step="1" value={paper.question_count} aria-describedby="paper-target-note paper-blueprint-status" aria-invalid={paperBlueprintTouched && !paperTargetsValid} onChange={(e) => setPaper((current) => ({ ...current, question_count: e.target.value }))} onBlur={() => setPaperBlueprintTouched(true)} /></Field>
                <p className="paper-target-note" id="paper-target-note">{t.paperForm.targetNote}</p>
                <section ref={paperBlueprintStatusRef} id="paper-blueprint-status" className={`paper-blueprint-status ${paperBlueprintMatches ? "matched" : paperTargetsValid ? "mismatch" : "invalid"}`} tabIndex="-1" role={paperBlueprintTouched && !paperBlueprintMatches ? "alert" : "status"} aria-live="polite">
                  <span className="paper-blueprint-status-icon" aria-hidden="true">{paperBlueprintMatches ? "✓" : "!"}</span>
                  <div>
                    <strong>{paperBlueprintMatches ? t.paperForm.blueprintReady : paperTargetsValid ? t.paperForm.blueprintMismatch : t.paperForm.targetInvalid}</strong>
                    <div className="paper-blueprint-values">
                      <span><small>{t.paperForm.paperTarget}</small><b>{paper.total_marks || "—"} {paperUnits.marks} · {paper.question_count || "—"} {paperUnits.questions}</b></span>
                      <span><small>{t.paperForm.currentBlueprint}</small><b>{blueprintTotals.marks} {paperUnits.marks} · {blueprintTotals.questions} {paperUnits.questions}</b></span>
                    </div>
                    {!paperBlueprintMatches && paperTargetsValid && <p>{t.paperForm.adjustSections}</p>}
                  </div>
                  {!paperBlueprintMatches && <div className="paper-blueprint-actions">
                    <button type="button" disabled={!blueprintCanBeTarget} onClick={useCurrentSectionTotals}>{t.paperForm.useSectionTotals}</button>
                    <button type="button" onClick={() => { const builder = document.getElementById("paper-section-builder"); builder?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); builder?.focus({ preventScroll: true }); }}>{t.paperForm.editSections}</button>
                  </div>}
                </section>
                {enabledPaperFields.includes("duration") && <Field label={t.paperForm.duration} removable onRemove={() => removePaperField("duration")} removeLabel={t.paperForm.removeField}><input type="number" min="10" max="360" value={paper.duration_minutes} onChange={(e) => setPaper({ ...paper, duration_minutes: Number(e.target.value) })} /></Field>}
                {enabledPaperFields.includes("difficulty") && <Field label={t.paperForm.difficulty} removable onRemove={() => removePaperField("difficulty")} removeLabel={t.paperForm.removeField}><select value={paper.difficulty} onChange={(e) => setPaper({ ...paper, difficulty: e.target.value })}><option value="easy">{t.options.easy}</option><option value="balanced">{t.options.balanced}</option><option value="challenging">{t.options.challenging}</option></select></Field>}
                {enabledPaperFields.includes("paper_type") && <Field label={t.paperForm.type} removable onRemove={() => removePaperField("paper_type")} removeLabel={t.paperForm.removeField}><select value={paper.paper_type} onChange={(e) => setPaper({ ...paper, paper_type: e.target.value })}><option value="unit_test">{t.options.unit}</option><option value="term_exam">{t.options.term}</option><option value="practice">{t.options.practice}</option><option value="worksheet">{t.options.worksheet}</option></select></Field>}
                {enabledPaperFields.includes("medium") && <Field label={t.medium} removable onRemove={() => removePaperField("medium")} removeLabel={t.paperForm.removeField}><select value={paper.medium} onChange={(e) => setPaper({ ...paper, medium: e.target.value })}><option value="Hindi">{t.options.hindi}</option><option value="English">{t.options.english}</option><option value="Bilingual">{t.options.bilingual}</option></select></Field>}
                <ChapterPicker options={chapterOptions} selected={paper.selected_chapters} onChange={(selected_chapters) => { setPaperScopeError(""); setPaper((current) => ({ ...current, selected_chapters })); }} loading={chapterLoading} error={chapterError} onRetry={() => setChapterRetry((value) => value + 1)} t={t} />
                {paperScopeError && <p className="paper-scope-error" role="alert">{paperScopeError}</p>}
                <OptionalPaperSettings enabled={enabledPaperFields} onRestore={restorePaperField} t={t} />
              </div>
              <PaperSectionBuilder sections={paper.sections} onChange={(sections) => setPaper((current) => ({ ...current, sections }))} t={t} units={paperUnits} />
              {error && <p className="paper-form-error" role="alert">{error}</p>}
              <button className="teacher-generate" type="submit" disabled={loading}>{loading ? t.paperForm.loading : t.paperForm.action}</button>
            </form>
            {renderResult(result, error, loading, copyResult, t, paper)}
            <GuidedTour accountId={profile.email} role="teacher-paper" steps={paperTourSteps} />
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
          <TeacherChat t={t} lang={lang} question={chatQuestion} setQuestion={setChatQuestion} subject={chatSubject} setSubject={setChatSubject} answerStyle={chatAnswerStyle} setAnswerStyle={setChatAnswerStyle} loading={chatLoading} messages={chatMessages} onSubmit={askChat} onClear={() => setChatMessages([])} onOpenFull={() => openTool("chat")} onCopy={copyChatMessage} onRetry={retryChatMessage} onFeedback={rateChatMessage} onChapterOption={chooseChatChapter} />
        )}

        {activeTool === "pyq" && (
          <section className="teacher-pyq-panel">
            <div className="teacher-pyq-head"><div><h2>{t.papersTitle}</h2><p>{t.papersNote}</p></div><span>{t.papersCount(visiblePapers.length)}</span></div>
            {!paperCatalogLoaded ? <div className="resource-skeleton" role="status" aria-label={lang === "hi" ? "प्रश्नपत्र लोड हो रहे हैं" : "Loading papers"}><span /><span /><span /></div> : <><div className="teacher-pyq-filters" role="tablist" aria-label="PYQ subject">
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
            </>}
          </section>
        )}

        {activeTool !== "chat" && <CompanyLegalFooter className="workspace-public-footer teacher-public-footer" />}
      </main>

      <TeacherInsightsRail
        recent={recent}
        streak={streak}
        t={t}
        lang={lang}
        onOpenTool={openTool}
        onOpenRecent={(item) => { setResult(item); setActiveTool(item.type); }}
      />
      <GuidedTour accountId={profile.email} role="teacher" steps={tourSteps} onStepChange={() => setActiveTool("home")} />
      <ConnectionStatus language={lang} />
    </div>
  );
}

function makePaperDraft(paper) {
  let number = 1;
  const totalMarks = paper.sections.reduce((sum, section) => sum + section.count * section.marks_each, 0);
  return {
    title: "Live paper preview",
    type: "paper",
    draft: true,
    medium: paper.medium,
    paper_content: "preview",
    paper_meta: { board: "CGBSE", session: "2026–27", class_level: paper.class_level, subject: paper.subject, total_marks: totalMarks, duration_minutes: paper.duration_minutes, paper_type: paper.paper_type },
    paper_data: {
      instructions: paper.enabled_fields?.includes("instructions") && paper.instructions.trim().split("\n").filter(Boolean).length ? paper.instructions.trim().split("\n").filter(Boolean) : paper.sections.map((section) => `खंड ${section.name} में ${section.count} ${section.label_hi} हैं; प्रत्येक प्रश्न ${section.marks_each} अंक का है${section.word_limit ? ` और शब्द सीमा ${section.word_limit} है` : ""}।`),
      sections: paper.sections.map((section) => ({ ...section, questions: Array.from({ length: section.count }, (_, index) => {
        const custom = section.custom_questions?.[index];
        return { number: number++, text_hi: custom?.text_hi || "प्रश्न निर्माण के बाद यहाँ दिखाई देगा।", options_hi: section.type === "mcq" ? (custom?.options_hi?.some(Boolean) ? custom.options_hi : ["विकल्प क", "विकल्प ख", "विकल्प ग", "विकल्प घ"]) : [], or_text_hi: custom?.or_text_hi || "" };
      }) })),
    },
    sources: [],
  };
}

function renderResult(result, error, loading, onCopy, t, paperDraft = null) {
  if (error) return <section className="teacher-result error-state" role="alert" aria-live="assertive"><strong>{t.result.error}</strong><p>{error}</p></section>;
  if (loading) return <section className="teacher-result loading-state" role="status" aria-live="polite" aria-busy="true"><div className="teacher-loader" /><strong>{t.result.loading}</strong><p>{t.result.loadingNote}</p></section>;
  if (!result && paperDraft) return <GeneratedResource result={makePaperDraft(paperDraft)} onCopy={onCopy} t={t} />;
  if (!result) return <section className="teacher-result empty-state"><span><Icon name="sparkle" size={34} /></span><strong>{t.result.empty}</strong><p>{t.result.emptyNote}</p></section>;
  return <GeneratedResource result={result} onCopy={onCopy} t={t} />;
}

function GeneratedResource({ result, onCopy, t }) {
  const isPaper = result.type === "paper" && result.paper_content;
  const isCurriculum = result.type === "curriculum";
  const [paperTab, setPaperTab] = useState("paper");
  const [paperData, setPaperData] = useState(() => result.paper_data ? structuredClone(result.paper_data) : null);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const sheetRef = useRef(null);
  useEffect(() => {
    setPaperData(result.paper_data ? structuredClone(result.paper_data) : null);
    setEditing(false);
  }, [result]);
  const questionTotal = paperData?.sections.reduce((sum, section) => sum + section.questions.length, 0) || 0;
  const marksTotal = paperData?.sections.reduce((sum, section) => sum + section.questions.length * Number(section.marks_each || 0), 0) || result.paper_meta?.total_marks;
  const downloadPdf = async () => {
    if (!sheetRef.current || downloading) return;
    setDownloading(true);
    setEditing(false);
    sheetRef.current.classList.add("paper-exporting");
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      const canvas = await html2canvas(sheetRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = 210;
      const pageHeight = 297;
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      const image = canvas.toDataURL("image/jpeg", 0.96);
      let offset = 0;
      while (offset < imageHeight) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(image, "JPEG", 0, -offset, pageWidth, imageHeight, undefined, "FAST");
        offset += pageHeight;
      }
      const meta = result.paper_meta || result.curriculum_meta || {};
      pdf.save(`${result.paper_meta?.board || "CGBSE"}-${meta.class_level || "10"}-${meta.subject || result.type}.pdf`);
    } finally {
      sheetRef.current?.classList.remove("paper-exporting");
      setDownloading(false);
    }
  };
  const subjectHindi = copy.hi.subjectNames[result.paper_meta?.subject] || result.paper_meta?.subject || "";
  const paperTypeHindi = {
    unit_test: "इकाई परीक्षा",
    term_exam: "सत्र परीक्षा",
    practice: "अभ्यास प्रश्नपत्र",
    worksheet: "अभ्यास पत्रक",
  }[result.paper_meta?.paper_type] || "प्रश्नपत्र";
  const documentTitle = paperTab === "paper" ? paperTypeHindi : paperTab === "answers" ? t.result.answers : t.result.blueprint;
  const curriculumMeta = result.curriculum_meta || {};
  const curriculumIsEnglish = curriculumMeta.medium === "English";

  return (
    <section className={`teacher-result generated-resource${isPaper ? " paper-resource" : ""}${isCurriculum ? " curriculum-resource" : ""}`}>
      <header>
        <div><span>{t.result.generated}</span><h2>{result.title}</h2></div>
        <div>
          {!result.draft && <button type="button" onClick={onCopy}>{t.result.copy}</button>}
          {isPaper && paperTab === "paper" && paperData && !result.draft && <button type="button" className="paper-edit-action" aria-pressed={editing} onClick={() => setEditing((value) => !value)}>{editing ? t.result.done : t.result.edit}</button>}
          <button type="button" className="paper-download-action" disabled={downloading} onClick={downloadPdf}><Icon name="download" size={16} />{downloading ? t.result.downloadPreparing : paperTab === "answers" ? t.result.answerPrint : t.result.print}</button>
        </div>
      </header>
      {isPaper ? (
        <>
          {!result.draft && <nav className="paper-result-tabs" aria-label={t.result.generated}>
            <button type="button" className={paperTab === "paper" ? "active" : ""} onClick={() => setPaperTab("paper")}>{t.result.paper}</button>
            <button type="button" className={paperTab === "answers" ? "active" : ""} onClick={() => setPaperTab("answers")}>{t.result.answers}</button>
            <button type="button" className={paperTab === "blueprint" ? "active" : ""} onClick={() => setPaperTab("blueprint")}>{t.result.blueprint}</button>
          </nav>}
          <article ref={sheetRef} className={`paper-print-sheet paper-part-${paperTab}`} lang={result.medium === "Hindi" ? "hi" : undefined}>
            <header className="paper-document-header">
              <div className="paper-board-name">{result.paper_meta?.board || "CGBSE"}</div>
              <div className="paper-document-title">{documentTitle}</div>
              <div className="paper-session">शैक्षणिक सत्र {result.paper_meta?.session || "2026–27"}</div>
              {paperTab === "paper" && <div className="paper-school-fields"><span>विद्यालय: ______________________________</span><span>रोल नंबर: ______________</span></div>}
              <div className="paper-meta-grid">
                <span>कक्षा — {result.paper_meta?.class_level || "10"}</span>
                <span>समय — {result.paper_meta?.duration_minutes || "—"} मिनट</span>
                <span>विषय — {subjectHindi}</span>
                <span>पूर्णांक — {marksTotal || "—"}</span>
              </div>
            </header>
            <div className="paper-document-body">{paperTab === "paper" && paperData ? <StructuredPaper data={paperData} onChange={setPaperData} editing={editing} t={t} /> : paperTab === "answers" && paperData ? <StructuredAnswers data={paperData} /> : paperTab === "blueprint" && paperData ? <StructuredBlueprint data={paperData} questionTotal={questionTotal} marksTotal={marksTotal} /> : <RichMarkdown>{result.paper_content}</RichMarkdown>}</div>
            <footer className="paper-document-footer"><span>{subjectHindi} · {result.paper_meta?.board || "CGBSE"}</span><span>VidyaAI द्वारा तैयार</span></footer>
          </article>
        </>
      ) : isCurriculum ? (
        <>
          {result.generation_mode === "structured_fallback" && <aside className="curriculum-generation-note" role="status"><Icon name="sparkle" size={18} /><span>{t.result.structuredFallback}</span></aside>}
          <article ref={sheetRef} className="curriculum-print-sheet" lang={curriculumIsEnglish ? "en" : "hi"}>
            <header className="curriculum-document-header">
              <span>VIDYAAI · {curriculumIsEnglish ? "CURRICULUM ROADMAP" : "पाठ्यक्रम कार्ययोजना"}</span>
              <h1>{curriculumIsEnglish ? `Class ${curriculumMeta.class_level || "—"} ${curriculumMeta.subject || ""}` : `कक्षा ${curriculumMeta.class_level || "—"} · ${copy.hi.subjectNames[curriculumMeta.subject] || curriculumMeta.subject || ""}`}</h1>
              <div>
                <span>{curriculumMeta.duration_weeks || "—"} {curriculumIsEnglish ? "weeks" : "सप्ताह"}</span>
                <span>{curriculumMeta.periods_per_week || "—"} {curriculumIsEnglish ? "periods / week" : "पीरियड / सप्ताह"}</span>
                <span>{curriculumMeta.medium || "—"}</span>
              </div>
            </header>
            <div className="curriculum-document-body"><RichMarkdown>{result.content}</RichMarkdown></div>
            <footer className="curriculum-document-footer"><span>CGBSE-aligned teacher workspace</span><span>VidyaAI</span></footer>
          </article>
        </>
      ) : <article><RichMarkdown>{result.content}</RichMarkdown></article>}
      {result.sources?.length > 0 && <footer><strong>{t.result.sources}</strong>{result.sources.map((source) => <span key={source}>{source}</span>)}</footer>}
    </section>
  );
}

function buildPaperPages(data) {
  const pages = [];
  let current = { instructions: data.instructions, sections: [] };
  let capacity = 5;
  data.sections.forEach((section) => {
    for (let index = 0; index < section.questions.length; index += capacity) {
      const questions = section.questions.slice(index, index + capacity);
      if (current.sections.length) {
        pages.push(current);
        current = { instructions: null, sections: [] };
        capacity = 7;
      }
      current.sections.push({ ...section, questions });
    }
  });
  if (current.instructions || current.sections.length) pages.push(current);
  return pages;
}

function StructuredAnswers({ data }) {
  return <div className="paper-structured-answers"><h2>उत्तर कुंजी</h2>{data.sections.map((section) => <section key={section.name}><h3>खंड {section.name}</h3>{section.questions.map((question) => <article key={question.number}><strong>प्रश्न {question.number}.</strong> {question.answer_hi || "—"}{question.marking_points_hi?.length > 0 && <ul>{question.marking_points_hi.map((point, index) => <li key={index}>{point}</li>)}</ul>}</article>)}</section>)}</div>;
}

function StructuredBlueprint({ data, questionTotal, marksTotal }) {
  return <div className="paper-structured-blueprint"><h2>प्रश्नपत्र रूपरेखा</h2><table><thead><tr><th>खंड</th><th>प्रकार</th><th>प्रश्न</th><th>प्रति प्रश्न अंक</th><th>कुल अंक</th></tr></thead><tbody>{data.sections.map((section) => <tr key={section.name}><td>{section.name}</td><td>{section.label_hi}</td><td>{section.questions.length}</td><td>{section.marks_each}</td><td>{section.questions.length * section.marks_each}</td></tr>)}</tbody><tfoot><tr><th colSpan="2">कुल</th><th>{questionTotal}</th><th>—</th><th>{marksTotal}</th></tr></tfoot></table></div>;
}

function renumberPaper(data) {
  let number = 1;
  return { ...data, sections: data.sections.map((section) => ({ ...section, questions: section.questions.map((question) => ({ ...question, number: number++ })) })) };
}

function StructuredPaper({ data, onChange, editing, t }) {
  const pages = useMemo(() => buildPaperPages(data), [data]);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState("next");
  useEffect(() => setPage((current) => Math.min(current, pages.length - 1)), [pages.length]);
  const goTo = (nextPage) => {
    if (nextPage < 0 || nextPage >= pages.length || nextPage === page) return;
    setDirection(nextPage > page ? "next" : "previous");
    setPage(nextPage);
  };
  const handleKeys = (event) => {
    if (event.key === "ArrowLeft") goTo(page - 1);
    if (event.key === "ArrowRight") goTo(page + 1);
  };
  const updateQuestion = (sectionName, questionNumber, field, value) => onChange((current) => renumberPaper({ ...current, sections: current.sections.map((section) => section.name !== sectionName ? section : { ...section, questions: section.questions.map((question) => question.number === questionNumber ? { ...question, [field]: value } : question) }) }));
  const removeQuestion = (sectionName, questionNumber) => onChange((current) => renumberPaper({ ...current, sections: current.sections.map((section) => section.name !== sectionName ? section : { ...section, questions: section.questions.filter((question) => question.number !== questionNumber) }) }));
  const addQuestion = (sectionName) => onChange((current) => renumberPaper({ ...current, sections: current.sections.map((section) => section.name !== sectionName ? section : { ...section, questions: [...section.questions, { number: 0, text_hi: "", options_hi: section.type === "mcq" ? ["", "", "", ""] : [], or_text_hi: "", answer_hi: "", marking_points_hi: [] }] }) }));
  return (
    <div className="paper-book-viewer" tabIndex="0" onKeyDown={handleKeys} aria-label={`${t.result.page} ${page + 1}`}>
      <div className="paper-flip-stage">
        {pages.map((paperPage, pageIndex) => <div key={pageIndex} className={`paper-flip-page${pageIndex === page ? ` active flip-${direction}` : ""}`} aria-hidden={pageIndex !== page}>
          {paperPage.instructions && <section className="paper-instructions"><strong>निर्देश</strong><ol>{paperPage.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ol></section>}
          {paperPage.sections.map((section) => (
        <section className="paper-question-section" key={section.name}>
          <h2>खंड {section.name} — {section.label_hi} [{section.marks_each} × {section.questions.length} = {section.marks_each * section.questions.length}]</h2>
          {section.questions.map((question) => (
            <article className="paper-question" key={question.number}>
              <span className="paper-question-marks">({section.marks_each})</span>
              <strong>प्रश्न {question.number}.</strong>
              {editing ? <div className="paper-inline-editor">
                <label><span>{t.result.questionText}</span><textarea rows="2" value={question.text_hi} onChange={(event) => updateQuestion(section.name, question.number, "text_hi", event.target.value)} /></label>
                {section.type === "mcq" && <div className="paper-inline-options">{(question.options_hi?.length ? question.options_hi : ["", "", "", ""]).map((option, index) => <label key={index}><span>{["क", "ख", "ग", "घ"][index]}</span><input value={option} onChange={(event) => { const options = [...(question.options_hi?.length ? question.options_hi : ["", "", "", ""])]; options[index] = event.target.value; updateQuestion(section.name, question.number, "options_hi", options); }} /></label>)}</div>}
                <label><span>{t.result.alternativeText}</span><input value={question.or_text_hi || ""} onChange={(event) => updateQuestion(section.name, question.number, "or_text_hi", event.target.value)} /></label>
                <label><span>{t.result.answerText}</span><textarea rows="2" value={question.answer_hi || ""} onChange={(event) => updateQuestion(section.name, question.number, "answer_hi", event.target.value)} /></label>
                <button type="button" className="paper-inline-remove" onClick={() => removeQuestion(section.name, question.number)}>{t.result.removeQuestion}</button>
              </div> : <><p>{question.text_hi}</p>
                {question.options_hi?.length > 0 && <div className="paper-options">{question.options_hi.map((option, index) => <span key={`${index}-${option}`}>({["क", "ख", "ग", "घ"][index]}) {option}</span>)}</div>}
                {question.or_text_hi && <><div className="paper-or">अथवा</div><p>{question.or_text_hi}</p></>}</>}
            </article>
          ))}
          {editing && <button type="button" className="paper-inline-add" onClick={() => addQuestion(section.name)}>+ {t.result.addQuestion}</button>}
        </section>
          ))}
          <div className="paper-page-number">{t.result.page} {pageIndex + 1}</div>
        </div>)}
      </div>
      {pages.length > 1 && <nav className="paper-page-controls" aria-label={t.result.page}>
        <button type="button" disabled={page === 0} onClick={() => goTo(page - 1)} aria-label={t.result.previousPage}><Icon name="arrowRight" size={18} /></button>
        <span>{t.result.page} {page + 1} / {pages.length}</span>
        <button type="button" disabled={page === pages.length - 1} onClick={() => goTo(page + 1)} aria-label={t.result.nextPage}><Icon name="arrowRight" size={18} /></button>
      </nav>}
    </div>
  );
}
