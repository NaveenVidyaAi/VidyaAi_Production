import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import Icon from "../components/Icon";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const copy = {
  en: {
    title: "AI Chat, AI Teacher & Paper Creator for CGBSE | VidyaAI",
    description: "Learn and teach CGBSE Class 10 with VidyaAI: curriculum-grounded AI Chat, editable AI Paper Creator, and animated voice-led AI Teacher.",
    eyebrow: "CGBSE CLASS 10 · STUDENTS & TEACHERS",
    heading: "Ask, assess and teach with curriculum-grounded AI.",
    lead: "VidyaAI combines AI Chat for clear answers, AI Paper Creator for editable assessments, and an animated AI Teacher for voice-led textbook lessons—all in one CGBSE workspace.",
    open: "Open VidyaAI",
    trust: "AI output is designed for learning support and should be checked against official CGBSE material and teacher guidance.",
    ask: "Three powerful ways to use AI", points: ["Ask with AI Chat", "Assess with AI Paper Creator", "Teach with AI Teacher"],
    capEye: "VIDYAAI HERO FEATURES", capTitle: "Ask, create a paper, or start an AI-led lesson", capLead: "Three focused AI tools connect everyday questions, classroom assessment and chapter teaching with verified curriculum context.",
    capabilities: [
      ["chat", "AI Chat", "Ask in Hindi, English or Hinglish and get clear, curriculum-grounded explanations for student doubts and classroom questions."],
      ["paper", "AI Paper Creator", "Choose chapters and marks, generate a balanced paper, edit or add questions, and download the paper with its answer key."],
      ["teacher", "AI Teacher", "Turn a verified Class 10 chapter into an animated, voice-led lesson with synchronized explanations and board work."],
    ],
    studentEye: "FOR STUDENTS", studentTitle: "Move from a question to real understanding",
    studentOne: "Students can ask subject questions, revise weak concepts and practise with board-style material. VidyaAI retrieves relevant educational context before generating an answer, helping responses stay connected to the selected class and subject.",
    studentTwo: "The signed-in workspace makes previous papers easier to discover. Learners can open the available Class 10 subject papers from a single library.", studentLink: "Sign in to explore Class 10 papers",
    teacherEye: "FOR TEACHERS", teacherTitle: "Chat, create assessments and teach with AI",
    teacherOne: "Teachers can ask the AI Chat for support, build fully editable papers with their own questions, or generate an animated AI Teacher lesson from verified chapter context.",
    teacherTwo: "VidyaAI is an assistant, not an examination authority. Teachers should verify factual accuracy, syllabus alignment, fairness and answer keys before classroom use.", teacherLink: "See teacher tools",
    responsibleEye: "BUILT FOR RESPONSIBLE USE", responsibleTitle: "What “curriculum-aware” means",
    responsibleOne: "VidyaAI uses retrieval-augmented generation: it searches the educational sources available in its knowledge base and supplies relevant excerpts to the AI model as context.",
    responsibleTwo: "No generative system is perfectly accurate. Important answers must still be compared with official textbooks, curriculum documents and teacher guidance.", policy: "Responsible AI Use Policy",
    ctaEye: "START WITH VIDYAAI", ctaTitle: "Learn, practise or prepare your next class.", cta: "Continue to sign in",
  },
  hi: {
    title: "CGBSE के लिए AI चैट, AI शिक्षिका और पेपर निर्माता | VidyaAI",
    description: "VidyaAI के पाठ्यक्रम-आधारित AI चैट, संपादन योग्य AI पेपर निर्माता और आवाज़ वाली एनिमेटेड AI शिक्षिका से CGBSE कक्षा 10 पढ़ें और पढ़ाएँ।",
    eyebrow: "CGBSE कक्षा 10 · विद्यार्थी और शिक्षक",
    heading: "पाठ्यक्रम-आधारित AI के साथ पूछें, जाँचें और पढ़ाएँ।",
    lead: "VidyaAI स्पष्ट उत्तरों के लिए AI चैट, संपादन योग्य मूल्यांकन के लिए AI पेपर निर्माता और आवाज़ से पाठ पढ़ाने वाली एनिमेटेड AI शिक्षिका को एक CGBSE कार्यक्षेत्र में लाता है।",
    open: "VidyaAI खोलें",
    trust: "AI से मिले उत्तर केवल सीखने में सहायता के लिए हैं। उन्हें आधिकारिक CGBSE सामग्री और शिक्षक मार्गदर्शन से जाँचें।",
    ask: "AI इस्तेमाल करने के तीन शक्तिशाली तरीके", points: ["AI चैट से पूछें", "AI पेपर निर्माता से जाँचें", "AI शिक्षिका के साथ पढ़ाएँ"],
    capEye: "VIDYAAI की मुख्य सुविधाएँ", capTitle: "पूछें, पेपर बनाएँ या AI पाठ शुरू करें", capLead: "तीन केंद्रित AI टूल रोज़मर्रा के प्रश्नों, कक्षा मूल्यांकन और अध्याय शिक्षण को सत्यापित पाठ्यक्रम संदर्भ से जोड़ते हैं।",
    capabilities: [
      ["chat", "AI चैट", "हिंदी, अंग्रेज़ी या हिंग्लिश में पूछें और विद्यार्थी के संदेह व कक्षा प्रश्नों के लिए स्पष्ट पाठ्यक्रम-आधारित उत्तर पाएँ।"],
      ["paper", "AI पेपर निर्माता", "अध्याय और अंक चुनें, संतुलित पेपर बनाएँ, प्रश्न संपादित या जोड़ें और उत्तर-कुंजी सहित डाउनलोड करें।"],
      ["teacher", "AI शिक्षिका", "सत्यापित कक्षा 10 अध्याय को आवाज़, एनिमेशन और साथ-साथ बोर्ड लेखन वाले पाठ में बदलें।"],
    ],
    studentEye: "विद्यार्थियों के लिए", studentTitle: "प्रश्न से वास्तविक समझ तक पहुँचें",
    studentOne: "विद्यार्थी विषय से जुड़े प्रश्न पूछ सकते हैं, कमजोर अवधारणाओं को दोहरा सकते हैं और बोर्ड-शैली सामग्री से अभ्यास कर सकते हैं। उत्तर देने से पहले VidyaAI संबंधित शैक्षिक संदर्भ खोजता है।",
    studentTwo: "साइन-इन कार्यक्षेत्र में पिछले प्रश्नपत्र आसानी से मिलते हैं। विद्यार्थी एक ही लाइब्रेरी में उपलब्ध कक्षा 10 के विषयवार प्रश्नपत्र खोल सकते हैं।", studentLink: "कक्षा 10 प्रश्नपत्र देखने के लिए साइन इन करें",
    teacherEye: "शिक्षकों के लिए", teacherTitle: "AI से पूछें, मूल्यांकन बनाएँ और पढ़ाएँ",
    teacherOne: "शिक्षक AI चैट से सहायता ले सकते हैं, अपने प्रश्नों के साथ पूरी तरह संपादन योग्य पेपर बना सकते हैं या सत्यापित अध्याय संदर्भ से एनिमेटेड AI शिक्षिका पाठ तैयार कर सकते हैं।",
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
  const schema = [{ "@context": "https://schema.org", "@type": "Organization", name: "Gyanix AI Solutions", url: `${origin}/about`, logo: `${origin}/brand/gyanix-ai-solutions-logo.png`, founder: { "@type": "Person", name: "Naveen Chandrawanshi" }, email: "GyanixAiSolutions@gmail.com" }, { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "VidyaAI", applicationCategory: "EducationalApplication", operatingSystem: "Web", url: `${origin}/`, description: t.description, featureList: ["Curriculum-grounded AI Chat in Hindi, English and Hinglish", "Editable AI Paper Creator with answer keys", "Animated voice-led AI Teacher with synchronized board work", "CGBSE Class 10 PYQ library"], audience: [{ "@type": "EducationalAudience", educationalRole: "student" }, { "@type": "EducationalAudience", educationalRole: "teacher" }], creator: { "@type": "Organization", name: "Gyanix AI Solutions" } }];

  return <PublicLayout title={t.title} description={t.description} path="/" schema={schema}>
    <section className="seo-home-hero public-section" aria-labelledby="home-title"><div><p className="public-eyebrow">{t.eyebrow}</p><h1 id="home-title">{t.heading}</h1><p className="seo-home-lead">{t.lead}</p><div className="public-hero-actions"><Link className="public-primary-button" to="/login">{t.open} <Icon name="arrowRight" size={18} /></Link></div><p className="seo-trust-note"><Icon name="shield" size={18} /> {t.trust}</p></div><div className="seo-hero-card"><span className="seo-hero-mark" aria-hidden="true">वि</span><p>{t.ask}</p><strong>समझें · अभ्यास करें · पढ़ाएँ</strong><ul>{t.points.map((point) => <li key={point}>{point}</li>)}</ul></div></section>
    <section className="seo-capabilities public-section"><div className="public-section-heading"><p className="public-eyebrow">{t.capEye}</p><h2>{t.capTitle}</h2><p>{t.capLead}</p></div><div className="seo-card-grid">{t.capabilities.map(([icon, title, text]) => <article key={title}><span aria-hidden="true"><Icon name={icon} size={23} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="seo-split public-section"><div><p className="public-eyebrow">{t.studentEye}</p><h2>{t.studentTitle}</h2><p>{t.studentOne}</p><p>{t.studentTwo}</p><Link className="public-text-link" to="/login">{t.studentLink} <Icon name="arrowRight" size={16} /></Link></div><div><p className="public-eyebrow">{t.teacherEye}</p><h2>{t.teacherTitle}</h2><p>{t.teacherOne}</p><p>{t.teacherTwo}</p><Link className="public-text-link" to="/cgbse-teacher-tools">{t.teacherLink} <Icon name="arrowRight" size={16} /></Link></div></section>
    <section className="seo-grounding public-section"><div><p className="public-eyebrow">{t.responsibleEye}</p><h2>{t.responsibleTitle}</h2></div><div><p>{t.responsibleOne}</p><p>{t.responsibleTwo} <Link to="/ai-use">{t.policy}</Link></p></div></section>
    <section className="public-cta public-section"><div><p className="public-eyebrow">{t.ctaEye}</p><h2>{t.ctaTitle}</h2></div><Link className="public-primary-button" to="/login">{t.cta} <Icon name="arrowRight" size={18} /></Link></section>
  </PublicLayout>;
}
