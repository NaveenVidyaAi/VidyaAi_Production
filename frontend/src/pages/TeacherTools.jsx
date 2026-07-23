import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import Icon from "../components/Icon";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const copy = {
  en: {
    title: "AI Teacher, Chat & Paper Creator for CGBSE Teachers | VidyaAI", description: "Explore VidyaAI for CGBSE teachers: curriculum-grounded AI Chat, editable AI Paper Creator and animated voice-led AI Teacher.",
    heroEye: "VIDYAAI FOR CGBSE TEACHERS", heroTitle: "Ask, assess and teach from one AI workspace", heroText: "Use AI Chat for classroom support, create editable question papers from selected chapters, or turn verified textbook context into an animated, voice-led AI Teacher lesson.", open: "Open teacher workspace",
    curriculumEye: "CURRICULUM CREATOR", curriculumTitle: "Plan the teaching sequence", curriculumText: "Select the class, subject and chapters, then draft a week-wise plan with learning outcomes, classroom activities, assessment opportunities and revision. Every generated plan is an editable working document.",
    lessonEye: "AI TEACHER", lessonTitle: "Generate an animated chapter lesson", lessonText: "Select a verified chapter and create a voice-led teaching sequence. The AI Teacher speaks while key context appears on the classroom board, with scene controls and a check-for-understanding question.",
    paperEye: "AI PAPER CREATOR", paperTitle: "Create, edit and download a question paper", paperOne: "Choose chapters and define each section: question type, count, marks, word limit and custom questions. Edit, remove or add questions directly before downloading the paper and answer key.", paperTwo: "Before distribution, verify every question, option, answer key, total mark and chapter mapping. AI-generated assessments are drafts, not official CGBSE publications.",
    chatEye: "AI CHAT", chatTitle: "Get curriculum-grounded teaching support", chatText: "Ask in Hindi, English or Hinglish—even with incomplete wording—and get explanations, classroom activities and student-doubt support connected to available curriculum context.",
    workflowTitle: "A responsible workflow for generated resources", steps: ["Choose only chapters learners have studied.", "Give specific instructions for language, difficulty and question types.", "Review facts, marks, repetition and accessibility.", "Edit the draft for your learners and school.", "Download only after professional review."], policyStart: "Read the", policy: "Responsible AI Use Policy", policyEnd: "for accuracy limits and teacher responsibilities.",
  },
  hi: {
    title: "CGBSE शिक्षकों के लिए AI शिक्षिका, चैट और पेपर निर्माता | VidyaAI", description: "CGBSE शिक्षकों के लिए VidyaAI का पाठ्यक्रम-आधारित AI चैट, संपादन योग्य AI पेपर निर्माता और आवाज़ वाली एनिमेटेड AI शिक्षिका देखें।",
    heroEye: "CGBSE शिक्षकों के लिए VIDYAAI", heroTitle: "एक AI कार्यक्षेत्र से पूछें, जाँचें और पढ़ाएँ", heroText: "कक्षा सहायता के लिए AI चैट इस्तेमाल करें, चुने अध्यायों से संपादन योग्य प्रश्नपत्र बनाएँ या सत्यापित पाठ्यपुस्तक संदर्भ को आवाज़ वाली एनिमेटेड AI शिक्षिका के पाठ में बदलें।", open: "शिक्षक कार्यक्षेत्र खोलें",
    curriculumEye: "पाठ्यक्रम निर्माता", curriculumTitle: "पढ़ाने का क्रम बनाएँ", curriculumText: "कक्षा, विषय और अध्याय चुनकर सीखने के परिणाम, कक्षा गतिविधियाँ, मूल्यांकन और पुनरावृत्ति सहित सप्ताहवार योजना बनाएँ। हर योजना संपादन योग्य कार्य दस्तावेज है।",
    lessonEye: "AI शिक्षिका", lessonTitle: "एनिमेटेड अध्याय पाठ बनाएँ", lessonText: "सत्यापित अध्याय चुनकर आवाज़ वाला शिक्षण क्रम बनाएँ। AI शिक्षिका बोलती है और मुख्य संदर्भ कक्षा बोर्ड पर साथ-साथ दिखाई देता है, जिसमें दृश्य नियंत्रण और समझ-जाँच प्रश्न शामिल हैं।",
    paperEye: "AI पेपर निर्माता", paperTitle: "प्रश्नपत्र बनाएँ, संपादित करें और डाउनलोड करें", paperOne: "अध्याय चुनें और हर खंड में प्रश्न प्रकार, संख्या, अंक, शब्द सीमा और अपने प्रश्न तय करें। पेपर और उत्तर-कुंजी डाउनलोड करने से पहले प्रश्न सीधे संपादित करें, हटाएँ या जोड़ें।", paperTwo: "वितरण से पहले हर प्रश्न, विकल्प, उत्तर-कुंजी, कुल अंक और अध्याय मिलान जाँचें। AI से बने मूल्यांकन प्रारूप हैं, आधिकारिक CGBSE प्रकाशन नहीं।",
    chatEye: "AI चैट", chatTitle: "पाठ्यक्रम-आधारित शिक्षण सहायता पाएँ", chatText: "हिंदी, अंग्रेज़ी या हिंग्लिश में—अधूरे शब्दों के साथ भी—पूछें और उपलब्ध पाठ्यक्रम संदर्भ से जुड़ी व्याख्या, कक्षा गतिविधियाँ और विद्यार्थी-संदेह सहायता पाएँ।",
    workflowTitle: "तैयार संसाधनों के जिम्मेदार उपयोग की प्रक्रिया", steps: ["केवल पढ़ाए गए अध्याय चुनें।", "भाषा, कठिनाई और प्रश्न प्रकार स्पष्ट बताएँ।", "तथ्य, अंक, दोहराव और सुगमता जाँचें।", "अपने विद्यार्थियों और स्कूल के अनुसार प्रारूप बदलें।", "पेशेवर जाँच के बाद ही डाउनलोड करें।"], policyStart: "सटीकता की सीमाओं और शिक्षक की जिम्मेदारियों के लिए", policy: "जिम्मेदार AI उपयोग नीति", policyEnd: "पढ़ें।",
  },
};

export default function TeacherTools() {
  const { language } = usePublicLanguage(); const t = copy[language];
  return <PublicLayout title={t.title} description={t.description} path="/cgbse-teacher-tools">
    <section className="resource-hero public-section"><p className="public-eyebrow">{t.heroEye}</p><h1>{t.heroTitle}</h1><p>{t.heroText}</p><div className="public-hero-actions"><Link className="public-primary-button" to="/login">{t.open} <Icon name="arrowRight" size={18} /></Link></div></section>
    <section className="seo-capabilities public-section"><div className="public-section-heading"><p className="public-eyebrow">{t.chatEye}</p><h2>{t.chatTitle}</h2><p>{t.chatText}</p></div></section>
    <section className="seo-split public-section"><div><p className="public-eyebrow">{t.curriculumEye}</p><h2>{t.curriculumTitle}</h2><p>{t.curriculumText}</p></div><div><p className="public-eyebrow">{t.lessonEye}</p><h2>{t.lessonTitle}</h2><p>{t.lessonText}</p></div></section>
    <section className="seo-grounding public-section"><div><p className="public-eyebrow">{t.paperEye}</p><h2>{t.paperTitle}</h2></div><div><p>{t.paperOne}</p><p>{t.paperTwo}</p></div></section>
    <section className="seo-resource-note public-section"><h2>{t.workflowTitle}</h2><ol>{t.steps.map((step) => <li key={step}>{step}</li>)}</ol><p>{t.policyStart} <Link to="/ai-use">{t.policy}</Link> {t.policyEnd}</p></section>
  </PublicLayout>;
}
