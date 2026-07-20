import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import Icon from "../components/Icon";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const copy = {
  en: {
    title: "CGBSE Teacher AI Tools for Planning | VidyaAI", description: "Explore VidyaAI tools for CGBSE teachers: editable curriculum plans, lesson plans and Hindi question papers.",
    heroEye: "VIDYAAI FOR CGBSE TEACHERS", heroTitle: "Teacher planning tools with the teacher in control", heroText: "Turn selected classes, subjects, chapters and assessment requirements into editable teaching resources. VidyaAI helps with the first draft; the teacher reviews, corrects and decides what reaches the classroom.", open: "Open teacher workspace", papers: "Sign in to access papers",
    curriculumEye: "CURRICULUM CREATOR", curriculumTitle: "Plan the teaching sequence", curriculumText: "Select the class, subject and chapters, then draft a week-wise plan with learning outcomes, classroom activities, assessment opportunities and revision. Every generated plan is an editable working document.",
    lessonEye: "LESSON PLANNER", lessonTitle: "Prepare a teachable lesson", lessonText: "Build a lesson around the topic, available time and classroom need. Organise objectives, explanations, activities, checks for understanding and follow-up practice.",
    paperEye: "QUESTION PAPER CREATOR", paperTitle: "Create a printable Hindi question paper", paperOne: "Choose chapters and define each section: question type, count, marks, word limit and custom questions. VidyaAI presents an editable paper-style draft.", paperTwo: "Before distribution, verify every question, option, answer key, total mark and chapter mapping. AI-generated assessments are drafts, not official CGBSE publications.",
    workflowTitle: "A responsible workflow for generated resources", steps: ["Choose only chapters learners have studied.", "Give specific instructions for language, difficulty and question types.", "Review facts, marks, repetition and accessibility.", "Edit the draft for your learners and school.", "Download only after professional review."], policyStart: "Read the", policy: "Responsible AI Use Policy", policyEnd: "for accuracy limits and teacher responsibilities.",
  },
  hi: {
    title: "CGBSE शिक्षक AI योजना टूल्स | VidyaAI", description: "CGBSE शिक्षकों के लिए VidyaAI के संपादन योग्य पाठ्यक्रम, पाठ योजना और हिंदी प्रश्नपत्र टूल्स देखें।",
    heroEye: "CGBSE शिक्षकों के लिए VIDYAAI", heroTitle: "शिक्षक के नियंत्रण में रहने वाले योजना टूल्स", heroText: "चुनी हुई कक्षा, विषय, अध्याय और मूल्यांकन जरूरतों को संपादन योग्य शिक्षण संसाधनों में बदलें। VidyaAI पहला प्रारूप बनाता है; शिक्षक उसकी जाँच, सुधार और कक्षा में उपयोग का निर्णय लेते हैं।", open: "शिक्षक कार्यक्षेत्र खोलें", papers: "प्रश्नपत्रों के लिए साइन इन करें",
    curriculumEye: "पाठ्यक्रम निर्माता", curriculumTitle: "पढ़ाने का क्रम बनाएँ", curriculumText: "कक्षा, विषय और अध्याय चुनकर सीखने के परिणाम, कक्षा गतिविधियाँ, मूल्यांकन और पुनरावृत्ति सहित सप्ताहवार योजना बनाएँ। हर योजना संपादन योग्य कार्य दस्तावेज है।",
    lessonEye: "पाठ योजना", lessonTitle: "पढ़ाने योग्य पाठ तैयार करें", lessonText: "विषय, उपलब्ध समय और कक्षा की जरूरत के अनुसार उद्देश्य, व्याख्या, गतिविधियाँ, समझ की जाँच और आगे का अभ्यास व्यवस्थित करें।",
    paperEye: "प्रश्नपत्र निर्माता", paperTitle: "प्रिंट करने योग्य हिंदी प्रश्नपत्र बनाएँ", paperOne: "अध्याय चुनें और हर खंड में प्रश्न प्रकार, संख्या, अंक, शब्द सीमा और अपने प्रश्न तय करें। VidyaAI संपादन योग्य प्रश्नपत्र प्रारूप प्रस्तुत करता है।", paperTwo: "वितरण से पहले हर प्रश्न, विकल्प, उत्तर-कुंजी, कुल अंक और अध्याय मिलान जाँचें। AI से बने मूल्यांकन प्रारूप हैं, आधिकारिक CGBSE प्रकाशन नहीं।",
    workflowTitle: "तैयार संसाधनों के जिम्मेदार उपयोग की प्रक्रिया", steps: ["केवल पढ़ाए गए अध्याय चुनें।", "भाषा, कठिनाई और प्रश्न प्रकार स्पष्ट बताएँ।", "तथ्य, अंक, दोहराव और सुगमता जाँचें।", "अपने विद्यार्थियों और स्कूल के अनुसार प्रारूप बदलें।", "पेशेवर जाँच के बाद ही डाउनलोड करें।"], policyStart: "सटीकता की सीमाओं और शिक्षक की जिम्मेदारियों के लिए", policy: "जिम्मेदार AI उपयोग नीति", policyEnd: "पढ़ें।",
  },
};

export default function TeacherTools() {
  const { language } = usePublicLanguage(); const t = copy[language];
  return <PublicLayout title={t.title} description={t.description} path="/cgbse-teacher-tools">
    <section className="resource-hero public-section"><p className="public-eyebrow">{t.heroEye}</p><h1>{t.heroTitle}</h1><p>{t.heroText}</p><div className="public-hero-actions"><Link className="public-primary-button" to="/login">{t.open} <Icon name="arrowRight" size={18} /></Link><Link className="public-secondary-button" to="/login">{t.papers}</Link></div></section>
    <section className="seo-split public-section"><div><p className="public-eyebrow">{t.curriculumEye}</p><h2>{t.curriculumTitle}</h2><p>{t.curriculumText}</p></div><div><p className="public-eyebrow">{t.lessonEye}</p><h2>{t.lessonTitle}</h2><p>{t.lessonText}</p></div></section>
    <section className="seo-grounding public-section"><div><p className="public-eyebrow">{t.paperEye}</p><h2>{t.paperTitle}</h2></div><div><p>{t.paperOne}</p><p>{t.paperTwo}</p></div></section>
    <section className="seo-resource-note public-section"><h2>{t.workflowTitle}</h2><ol>{t.steps.map((step) => <li key={step}>{step}</li>)}</ol><p>{t.policyStart} <Link to="/ai-use">{t.policy}</Link> {t.policyEnd}</p></section>
  </PublicLayout>;
}
