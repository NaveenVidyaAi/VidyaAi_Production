import { Link } from "react-router-dom";
import LegalDocument from "../components/LegalDocument";
import { OFFICIAL_EMAIL } from "../components/PublicLayout";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const sections = [
  { id: "purpose", title: "Purpose of this policy" },
  { id: "how-ai-is-used", title: "How VidyaAI uses AI" },
  { id: "provider-processing", title: "AI provider processing" },
  { id: "review", title: "Accuracy and human review" },
  { id: "assessment", title: "Assessment and teacher use" },
  { id: "student-use", title: "Student responsibility" },
  { id: "prohibited", title: "Prohibited AI use" },
  { id: "improvement", title: "Review and product improvement" },
  { id: "reporting", title: "Reporting AI concerns" },
];

const hindiSections = [
  { id: "purpose", title: "इस नीति का उद्देश्य" }, { id: "how-ai-is-used", title: "VidyaAI में AI का उपयोग" }, { id: "provider-processing", title: "AI प्रदाता द्वारा प्रसंस्करण" }, { id: "review", title: "सटीकता और मानवीय समीक्षा" }, { id: "assessment", title: "मूल्यांकन और शिक्षक उपयोग" }, { id: "student-use", title: "विद्यार्थी की जिम्मेदारी" }, { id: "prohibited", title: "प्रतिबंधित AI उपयोग" }, { id: "improvement", title: "समीक्षा और उत्पाद सुधार" }, { id: "reporting", title: "AI संबंधी चिंता की सूचना" },
];

function HindiAIUse() {
  return <LegalDocument eyebrow="जिम्मेदार तकनीक · VIDYAAI" title="जिम्मेदार AI उपयोग नीति" summary="यह नीति बताती है कि VidyaAI में AI कहाँ उपयोग होता है, उसकी सीमाएँ क्या हैं और Gyanix, शिक्षकों तथा विद्यार्थियों की क्या जिम्मेदारियाँ हैं।" icon="brain" sections={hindiSections}>
    <section id="purpose"><h2>1. इस नीति का उद्देश्य</h2><p>VidyaAI सीखने और पढ़ाने में सहायता के लिए जनरेटिव AI उपयोग करता है। यह नीति AI उपयोग को समझने योग्य बनाती है और AI उत्तर को सत्यापित मानवीय निर्णय या आधिकारिक शिक्षण सामग्री समझे जाने से रोकती है।</p></section>
    <section id="how-ai-is-used"><h2>2. VidyaAI में AI का उपयोग</h2><p>AI इन कार्यों में सहायता कर सकता है:</p><ul><li>विद्यार्थी प्रश्नों के उत्तर और व्याख्या;</li><li>अभ्यास क्विज़ और प्रश्न समूह;</li><li>पाठ्यक्रम, पाठ योजना और प्रश्नपत्र प्रारूप;</li><li>सीखने की गतिविधि पर प्रतिक्रिया;</li><li>संबंधित पाठ्यक्रम और पुस्तक सामग्री की खोज तथा सारांश;</li><li>हिंदी और अंग्रेज़ी में भाषा-संगत उत्तर।</li></ul></section>
    <section id="provider-processing"><h2>3. AI प्रदाता द्वारा प्रसंस्करण</h2><p>VidyaAI जनरेशन के लिए अभी Groq द्वारा होस्ट किए AI मॉडल उपयोग करता है। सुविधा के अनुसार उपयोगकर्ता का पाठ, हाल का संदर्भ, कक्षा/विषय, प्राप्त शैक्षिक अंश, शिक्षक निर्देश और सीखने के संकेत प्रदाता को भेजे जा सकते हैं।</p><p>हम जानबूझकर खाते का नाम या ईमेल AI अनुरोध में नहीं जोड़ते, लेकिन प्रश्न या नोट में लिखी कोई भी जानकारी शामिल हो सकती है। पासवर्ड, भुगतान जानकारी, सरकारी पहचान, निजी स्वास्थ्य जानकारी या अनावश्यक निजी विवरण न लिखें।</p><p>अधिक जानकारी के लिए <Link to="/privacy">गोपनीयता नीति</Link> पढ़ें।</p></section>
    <section id="review"><h2>4. सटीकता और मानवीय समीक्षा</h2><div className="legal-callout"><strong>AI गलत हो सकता है।</strong> आत्मविश्वासपूर्ण भाषा के बावजूद जानकारी अधूरी, पुरानी, असंगत या गढ़ी हुई हो सकती है।</div><p>विद्यार्थी महत्वपूर्ण उत्तरों को पाठ्यपुस्तक, आधिकारिक पाठ्यक्रम और शिक्षक मार्गदर्शन से जाँचें। शिक्षक योजनाओं, प्रश्नों, उत्तर-कुंजी और व्याख्याओं को उपयोग से पहले जाँचें।</p></section>
    <section id="assessment"><h2>5. मूल्यांकन और शिक्षक उपयोग</h2><p>AI से बने प्रश्नपत्र और पाठ्यक्रम योजनाएँ पेशेवर समीक्षा के लिए प्रारूप हैं। AI प्रतिक्रिया को आधिकारिक बोर्ड परिणाम, अंतिम ग्रेड, अनुशासनात्मक निष्कर्ष या महत्वपूर्ण शैक्षिक निर्णय का एकमात्र आधार न बनाएँ।</p><p>पाठ्यक्रम-संगति, तथ्य, अंक-वितरण, सुगमता, निष्पक्षता और उपयुक्तता की जाँच शिक्षक की जिम्मेदारी है।</p></section>
    <section id="student-use"><h2>6. विद्यार्थी की जिम्मेदारी</h2><p>VidyaAI का उपयोग अवधारणा समझने, कौशल अभ्यास और स्वतंत्र काम सुधारने के लिए करें। शिक्षक, स्कूल और परीक्षा प्राधिकरण के शैक्षणिक ईमानदारी नियम मानें तथा जहाँ जरूरी हो AI सहायता बताएँ।</p><p>AI से बने काम को पूरी तरह अपना बताना, प्रतिबंधित परीक्षा में सेवा उपयोग करना या शिक्षक को धोखा देना स्वीकार्य नहीं है।</p></section>
    <section id="prohibited"><h2>7. प्रतिबंधित AI उपयोग</h2><p>हानिकारक या गैरकानूनी सामग्री, उत्पीड़न, किसी का रूप धारण करने, मूल्यांकन नियम तोड़ने, गोपनीय डेटा उजागर करने, शैक्षिक रिकॉर्ड बदलने या विद्यार्थी पर स्वचालित उच्च-प्रभाव निर्णय लेने के लिए VidyaAI का उपयोग न करें।</p></section>
    <section id="improvement"><h2>8. समीक्षा और उत्पाद सुधार</h2><p>बातचीत, उत्तर और प्रतिक्रिया अधिकृत मानवीय समीक्षा तथा उत्पाद-सुधार डेटा के उम्मीदवार के रूप में चुने जा सकते हैं। कुछ प्रत्यक्ष पहचानकर्ता कम किए जाते हैं, लेकिन मुक्त पाठ को पूरी तरह गुमनाम न मानें।</p><p>हर बातचीत से VidyaAI मॉडल के भार अपने-आप प्रशिक्षित नहीं होते। समीक्षा किया गया उपयोग आंतरिक अनुमति प्रक्रिया और गोपनीयता नीति के अधीन है।</p></section>
    <section id="reporting"><h2>9. AI संबंधी चिंता की सूचना</h2><p>उत्तर असुरक्षित, भेदभावपूर्ण, गंभीर रूप से गलत, गोपनीयता का उल्लंघन करने वाला या विद्यार्थी के लिए अनुपयुक्त लगे तो उस पर निर्भर न रहें और <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> पर सूचना दें। जाँच के लिए पर्याप्त गैर-संवेदनशील संदर्भ शामिल करें।</p></section>
  </LegalDocument>;
}

export default function AIUse() {
  const { language } = usePublicLanguage();
  if (language === "hi") return <HindiAIUse />;
  return (
    <LegalDocument
      eyebrow="RESPONSIBLE TECHNOLOGY · VIDYAAI"
      title="Responsible AI Use Policy"
      summary="This policy explains where artificial intelligence is used in VidyaAI, what its limitations are, and the responsibilities shared by Gyanix, teachers and learners."
      icon="brain"
      sections={sections}
    >
      <section id="purpose">
        <h2>1. Purpose of this policy</h2>
        <p>VidyaAI uses generative artificial intelligence to support learning and teaching. This policy is intended to make that use understandable and to prevent AI output from being mistaken for verified human judgment or official educational material.</p>
      </section>

      <section id="how-ai-is-used">
        <h2>2. How VidyaAI uses AI</h2>
        <p>AI may be used to generate or assist with:</p>
        <ul>
          <li>answers and explanations for student questions;</li>
          <li>practice quizzes and question sets;</li>
          <li>curriculum plans, lesson plans and test-paper drafts;</li>
          <li>feedback based on learning activity and weak-topic signals;</li>
          <li>retrieval and summarisation of relevant curriculum, textbook and model-paper material;</li>
          <li>language-aware responses in Hindi and English.</li>
        </ul>
      </section>

      <section id="provider-processing">
        <h2>3. AI provider processing</h2>
        <p>VidyaAI currently uses Groq-hosted AI models for generation. Depending on the feature, relevant user-entered text, recent conversation context, selected class or subject, retrieved educational excerpts, teacher instructions and learning signals may be sent to that provider to produce a response.</p>
        <p>We do not deliberately add a user’s account email or name to an AI request, but anything a user types into a question, note or instruction may be included. Do not enter passwords, payment information, government identifiers, private health information or unnecessary personal details.</p>
        <p>See our <Link to="/privacy">Privacy Policy</Link> for a fuller description of information handling.</p>
      </section>

      <section id="review">
        <h2>4. Accuracy and human review</h2>
        <div className="legal-callout"><strong>AI can be wrong.</strong> It may generate incomplete, outdated, inconsistent or fabricated information, even when the answer sounds confident.</div>
        <p>Students should compare important answers with textbooks, official curriculum material and teacher guidance. Teachers should review generated plans, questions, answer keys, rubrics and explanations before distributing or relying on them.</p>
      </section>

      <section id="assessment">
        <h2>5. Assessment and teacher use</h2>
        <p>AI-generated question papers and curriculum plans are drafts for professional review. AI feedback about an answer is supportive guidance and must not be treated as an official board result, final grade, disciplinary finding or sole basis for an important educational decision.</p>
        <p>Teachers remain responsible for checking curriculum alignment, factual accuracy, mark allocation, accessibility, fairness and suitability for their learners.</p>
      </section>

      <section id="student-use">
        <h2>6. Student responsibility</h2>
        <p>VidyaAI should be used to understand concepts, practise skills and improve independent work. Students should follow the academic-integrity rules of their teacher, school and examination authority, and should disclose AI assistance when required.</p>
        <p>Submitting AI-generated work as entirely one’s own, using the service during a restricted examination, or using generated answers to deceive a teacher is not acceptable.</p>
      </section>

      <section id="prohibited">
        <h2>7. Prohibited AI use</h2>
        <p>Users must not use VidyaAI to create harmful or unlawful material; harass or exploit another person; impersonate a student or teacher; bypass assessment rules; expose confidential data; manipulate educational records; or make automated high-impact decisions about a learner.</p>
      </section>

      <section id="improvement">
        <h2>8. Review and product improvement</h2>
        <p>Conversations, responses and feedback may be stored and selected as candidates for authorised human review and product-improvement datasets. Some direct identifiers are minimised in the review workflow, but users should not assume that all free-text information is automatically anonymous.</p>
        <p>VidyaAI does not automatically retrain model weights from each conversation. Any reviewed use of interaction data is governed by internal approval workflows and the practices described in our Privacy Policy.</p>
      </section>

      <section id="reporting">
        <h2>9. Reporting AI concerns</h2>
        <p>If an AI response appears unsafe, discriminatory, seriously inaccurate, privacy-invasive or inappropriate for a student, stop relying on it and report the concern to <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>. Include the subject and enough non-sensitive context for us to investigate.</p>
      </section>
    </LegalDocument>
  );
}
