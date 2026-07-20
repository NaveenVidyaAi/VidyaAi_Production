import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import Icon from "../components/Icon";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const copy = {
  en: {
    title: "CGBSE Class 10 AI Learning Assistant | VidyaAI",
    description: "Study CGBSE Class 10 in Hindi or English with curriculum-aware AI help. Teachers can create editable lessons and question papers.",
    eyebrow: "CGBSE CLASS 10 · STUDENTS & TEACHERS",
    heading: "CGBSE learning support that understands your curriculum.",
    lead: "VidyaAI brings curriculum-aware explanations, Hindi and English learning support, authentic practice resources and teacher planning tools into one focused workspace.",
    open: "Open VidyaAI", papers: "Sign in to access papers",
    trust: "AI output is designed for learning support and should be checked against official CGBSE material and teacher guidance.",
    ask: "Ask in your language", points: ["Curriculum-grounded support", "Class 10 model papers and PYQs", "Editable resources for teachers"],
    capEye: "ONE EDUCATION WORKSPACE", capTitle: "How VidyaAI supports CGBSE preparation", capLead: "Every feature is organised around practical study and classroom workflows—not generic chat alone.",
    capabilities: [
      ["brain", "Curriculum-aware answers", "Ask questions in Hindi or English and receive explanations supported by the CGBSE learning material available to VidyaAI."],
      ["document", "Model papers and PYQs", "Open subject-wise Class 10 model papers and previous-year question papers after signing in for focused board-exam practice."],
      ["code", "Teacher planning tools", "Draft editable curriculum plans, lesson plans and printable question papers, then review and adapt them for your classroom."],
    ],
    studentEye: "FOR STUDENTS", studentTitle: "Move from a question to real understanding",
    studentOne: "Students can ask subject questions, revise weak concepts and practise with board-style material. VidyaAI retrieves relevant educational context before generating an answer, helping responses stay connected to the selected class and subject.",
    studentTwo: "The signed-in workspace makes previous papers easier to discover. Learners can open the available Class 10 subject papers from a single library.", studentLink: "Sign in to explore Class 10 papers",
    teacherEye: "FOR TEACHERS", teacherTitle: "Prepare resources you can review and edit",
    teacherOne: "Teachers can create curriculum plans, lesson plans and question-paper drafts using selected chapters, question sections, mark allocations and their own instructions.",
    teacherTwo: "VidyaAI is an assistant, not an examination authority. Teachers should verify factual accuracy, syllabus alignment, fairness and answer keys before classroom use.", teacherLink: "See teacher tools",
    responsibleEye: "BUILT FOR RESPONSIBLE USE", responsibleTitle: "What “curriculum-aware” means",
    responsibleOne: "VidyaAI uses retrieval-augmented generation: it searches the educational sources available in its knowledge base and supplies relevant excerpts to the AI model as context.",
    responsibleTwo: "No generative system is perfectly accurate. Important answers must still be compared with official textbooks, curriculum documents and teacher guidance.", policy: "Responsible AI Use Policy",
    ctaEye: "START WITH VIDYAAI", ctaTitle: "Learn, practise or prepare your next class.", cta: "Continue to sign in",
  },
  hi: {
    title: "CGBSE कक्षा 10 AI शिक्षण सहायक | VidyaAI",
    description: "पाठ्यक्रम-संगत AI सहायता के साथ हिंदी या अंग्रेज़ी में CGBSE कक्षा 10 की पढ़ाई करें। शिक्षक संपादन योग्य पाठ और प्रश्नपत्र बना सकते हैं।",
    eyebrow: "CGBSE कक्षा 10 · विद्यार्थी और शिक्षक",
    heading: "आपके पाठ्यक्रम को समझने वाली CGBSE शिक्षण सहायता।",
    lead: "VidyaAI पाठ्यक्रम-संगत व्याख्या, हिंदी और अंग्रेज़ी में सीखने की सहायता, अभ्यास सामग्री और शिक्षक योजना टूल्स को एक केंद्रित कार्यक्षेत्र में लाता है।",
    open: "VidyaAI खोलें", papers: "प्रश्नपत्रों के लिए साइन इन करें",
    trust: "AI से मिले उत्तर केवल सीखने में सहायता के लिए हैं। उन्हें आधिकारिक CGBSE सामग्री और शिक्षक मार्गदर्शन से जाँचें।",
    ask: "अपनी भाषा में पूछें", points: ["पाठ्यक्रम-संगत सहायता", "कक्षा 10 मॉडल और पिछले प्रश्नपत्र", "शिक्षकों के लिए संपादन योग्य संसाधन"],
    capEye: "एक संपूर्ण शिक्षा कार्यक्षेत्र", capTitle: "VidyaAI CGBSE की तैयारी में कैसे मदद करता है", capLead: "हर सुविधा व्यावहारिक पढ़ाई और कक्षा की जरूरतों के अनुसार बनाई गई है—केवल सामान्य चैट के लिए नहीं।",
    capabilities: [
      ["brain", "पाठ्यक्रम-संगत उत्तर", "हिंदी या अंग्रेज़ी में प्रश्न पूछें और VidyaAI में उपलब्ध CGBSE शिक्षण सामग्री पर आधारित व्याख्या पाएँ।"],
      ["document", "मॉडल और पिछले प्रश्नपत्र", "साइन इन करने के बाद बोर्ड परीक्षा अभ्यास के लिए विषयवार कक्षा 10 मॉडल और पिछले वर्षों के प्रश्नपत्र खोलें।"],
      ["code", "शिक्षक योजना टूल्स", "संपादन योग्य पाठ्यक्रम योजना, पाठ योजना और प्रिंट करने योग्य प्रश्नपत्र बनाएँ, फिर उन्हें अपनी कक्षा के अनुसार बदलें।"],
    ],
    studentEye: "विद्यार्थियों के लिए", studentTitle: "प्रश्न से वास्तविक समझ तक पहुँचें",
    studentOne: "विद्यार्थी विषय से जुड़े प्रश्न पूछ सकते हैं, कमजोर अवधारणाओं को दोहरा सकते हैं और बोर्ड-शैली सामग्री से अभ्यास कर सकते हैं। उत्तर देने से पहले VidyaAI संबंधित शैक्षिक संदर्भ खोजता है।",
    studentTwo: "साइन-इन कार्यक्षेत्र में पिछले प्रश्नपत्र आसानी से मिलते हैं। विद्यार्थी एक ही लाइब्रेरी में उपलब्ध कक्षा 10 के विषयवार प्रश्नपत्र खोल सकते हैं।", studentLink: "कक्षा 10 प्रश्नपत्र देखने के लिए साइन इन करें",
    teacherEye: "शिक्षकों के लिए", teacherTitle: "ऐसे संसाधन बनाएँ जिन्हें आप जाँच और संपादित कर सकें",
    teacherOne: "शिक्षक चुने हुए अध्यायों, प्रश्न खंडों, अंक-वितरण और अपने निर्देशों के आधार पर पाठ्यक्रम योजना, पाठ योजना और प्रश्नपत्र का प्रारूप बना सकते हैं।",
    teacherTwo: "VidyaAI एक सहायक है, परीक्षा प्राधिकरण नहीं। कक्षा में उपयोग से पहले तथ्य, पाठ्यक्रम-संगति, निष्पक्षता और उत्तर-कुंजी की जाँच करें।", teacherLink: "शिक्षक टूल्स देखें",
    responsibleEye: "जिम्मेदार उपयोग के लिए निर्मित", responsibleTitle: "“पाठ्यक्रम-संगत” का क्या अर्थ है",
    responsibleOne: "VidyaAI रिट्रीवल-ऑगमेंटेड जनरेशन का उपयोग करता है: यह अपने ज्ञान-भंडार में उपलब्ध शैक्षिक स्रोतों को खोजकर संबंधित अंश AI मॉडल को संदर्भ के रूप में देता है।",
    responsibleTwo: "कोई भी जनरेटिव प्रणाली पूरी तरह त्रुटिहीन नहीं है। महत्वपूर्ण उत्तरों को आधिकारिक पाठ्यपुस्तकों, पाठ्यक्रम दस्तावेजों और शिक्षक मार्गदर्शन से जाँचें।", policy: "जिम्मेदार AI उपयोग नीति",
    ctaEye: "VIDYAAI के साथ शुरू करें", ctaTitle: "सीखें, अभ्यास करें या अपनी अगली कक्षा तैयार करें।", cta: "साइन इन करके आगे बढ़ें",
  },
};

export default function Home() {
  const { language } = usePublicLanguage();
  const t = copy[language];
  const origin = window.location.origin;
  const schema = [{ "@context": "https://schema.org", "@type": "Organization", name: "Gyanix AI Solutions", url: `${origin}/about`, logo: `${origin}/brand/gyanix-ai-solutions-logo.png`, founder: { "@type": "Person", name: "Naveen Chandrawanshi" }, email: "GyanixAiSolutions@gmail.com" }, { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "VidyaAI", applicationCategory: "EducationalApplication", operatingSystem: "Web", url: `${origin}/`, description: t.description, creator: { "@type": "Organization", name: "Gyanix AI Solutions" } }];

  return <PublicLayout title={t.title} description={t.description} path="/" schema={schema}>
    <section className="seo-home-hero public-section" aria-labelledby="home-title"><div><p className="public-eyebrow">{t.eyebrow}</p><h1 id="home-title">{t.heading}</h1><p className="seo-home-lead">{t.lead}</p><div className="public-hero-actions"><Link className="public-primary-button" to="/login">{t.open} <Icon name="arrowRight" size={18} /></Link><Link className="public-secondary-button" to="/login">{t.papers}</Link></div><p className="seo-trust-note"><Icon name="shield" size={18} /> {t.trust}</p></div><div className="seo-hero-card"><span className="seo-hero-mark" aria-hidden="true">वि</span><p>{t.ask}</p><strong>समझें · अभ्यास करें · पढ़ाएँ</strong><ul>{t.points.map((point) => <li key={point}>{point}</li>)}</ul></div></section>
    <section className="seo-capabilities public-section"><div className="public-section-heading"><p className="public-eyebrow">{t.capEye}</p><h2>{t.capTitle}</h2><p>{t.capLead}</p></div><div className="seo-card-grid">{t.capabilities.map(([icon, title, text]) => <article key={title}><span aria-hidden="true"><Icon name={icon} size={23} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="seo-split public-section"><div><p className="public-eyebrow">{t.studentEye}</p><h2>{t.studentTitle}</h2><p>{t.studentOne}</p><p>{t.studentTwo}</p><Link className="public-text-link" to="/login">{t.studentLink} <Icon name="arrowRight" size={16} /></Link></div><div><p className="public-eyebrow">{t.teacherEye}</p><h2>{t.teacherTitle}</h2><p>{t.teacherOne}</p><p>{t.teacherTwo}</p><Link className="public-text-link" to="/cgbse-teacher-tools">{t.teacherLink} <Icon name="arrowRight" size={16} /></Link></div></section>
    <section className="seo-grounding public-section"><div><p className="public-eyebrow">{t.responsibleEye}</p><h2>{t.responsibleTitle}</h2></div><div><p>{t.responsibleOne}</p><p>{t.responsibleTwo} <Link to="/ai-use">{t.policy}</Link></p></div></section>
    <section className="public-cta public-section"><div><p className="public-eyebrow">{t.ctaEye}</p><h2>{t.ctaTitle}</h2></div><Link className="public-primary-button" to="/login">{t.cta} <Icon name="arrowRight" size={18} /></Link></section>
  </PublicLayout>;
}
