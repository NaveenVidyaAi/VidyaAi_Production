import { Link } from "react-router-dom";
import LegalDocument from "../components/LegalDocument";
import { OFFICIAL_EMAIL } from "../components/PublicLayout";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const sections = [
  { id: "scope", title: "Scope and responsibility" },
  { id: "collection", title: "Information we process" },
  { id: "use", title: "How information is used" },
  { id: "ai-providers", title: "AI and service providers" },
  { id: "review", title: "Admin review and improvement" },
  { id: "browser-storage", title: "Browser storage and cookies" },
  { id: "children", title: "Children and parental involvement" },
  { id: "retention", title: "Retention and deletion" },
  { id: "security", title: "Security" },
  { id: "rights", title: "Your choices and rights" },
  { id: "transfers", title: "Processing locations" },
  { id: "updates", title: "Updates and contact" },
];

const hindiSections = [
  { id: "scope", title: "दायरा और जिम्मेदारी" }, { id: "collection", title: "हम कौन-सी जानकारी संसाधित करते हैं" }, { id: "use", title: "जानकारी का उपयोग" }, { id: "ai-providers", title: "AI और सेवा प्रदाता" }, { id: "review", title: "प्रशासक समीक्षा और सुधार" }, { id: "browser-storage", title: "ब्राउज़र संग्रहण और कुकीज़" }, { id: "children", title: "बच्चे और अभिभावक" }, { id: "retention", title: "रखरखाव और मिटाना" }, { id: "security", title: "सुरक्षा" }, { id: "rights", title: "आपके विकल्प और अधिकार" }, { id: "transfers", title: "प्रसंस्करण स्थान" }, { id: "updates", title: "अपडेट और संपर्क" },
];

function HindiPrivacy() {
  return <LegalDocument eyebrow="गोपनीयता · GYANIX AI SOLUTIONS" title="गोपनीयता नीति" summary="यह नीति बताती है कि विद्यार्थियों, शिक्षकों और प्रशासकों द्वारा VidyaAI उपयोग करने पर कौन-सी निजी और शिक्षण जानकारी संसाधित होती है।" icon="lock" sections={hindiSections}>
    <section id="scope"><h2>1. दायरा और जिम्मेदारी</h2><p>यह नीति Gyanix AI Solutions द्वारा संचालित VidyaAI के सार्वजनिक वेबसाइट, विद्यार्थी और शिक्षक कार्यक्षेत्र, प्रशासनिक टूल्स, सहायता संचार और AI सुविधाओं पर लागू होती है।</p><p>जानकारी क्यों और कैसे संसाधित होती है, इसका निर्णय Gyanix AI Solutions करता है। अनुरोध <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> पर भेजें।</p></section>
    <section id="collection"><h2>2. हम कौन-सी जानकारी संसाधित करते हैं</h2><h3>आपके द्वारा दी गई जानकारी</h3><ul><li>नाम, ईमेल, भूमिका, कक्षा और शिक्षण माध्यम;</li><li>प्रश्न, निर्देश, पाठ्यक्रम विवरण, नोट और अन्य दर्ज पाठ;</li><li>क्विज़ उत्तर, प्रतिक्रिया, विषय, पसंद और सहायता संदेश।</li></ul><h3>शिक्षण और उपयोग रिकॉर्ड</h3><ul><li>AI उत्तर, स्रोत, क्विज़ स्कोर और समय;</li><li>विषय, कमजोर टॉपिक संकेत, लक्ष्य और सीखने की जानकारी;</li><li>ब्राउज़र में सहेजे शिक्षक संसाधन और गुणवत्ता समीक्षा रिकॉर्ड।</li></ul><h3>तकनीकी जानकारी</h3><p>सर्वर IP पता, अनुरोध पथ, समय, ब्राउज़र/डिवाइस जानकारी और सुरक्षा लॉग संसाधित कर सकते हैं। हम विज्ञापन ट्रैकर, भुगतान, सटीक स्थान, माइक्रोफ़ोन या कैमरा सुविधाओं का उपयोग नहीं करते।</p></section>
    <section id="use"><h2>3. जानकारी का उपयोग</h2><p>जानकारी का उपयोग सुविधाएँ देने, उत्तर और योजनाएँ बनाने, संबंधित शिक्षण सामग्री खोजने, प्रगति समझने, सेवा सुरक्षित और बेहतर करने, सहायता अनुरोधों का उत्तर देने तथा कानूनी दायित्व पूरा करने के लिए होता है।</p></section>
    <section id="ai-providers"><h2>4. AI और सेवा प्रदाता</h2><p>VidyaAI अभी Groq द्वारा होस्ट किए गए AI मॉडल उपयोग करता है। अनुरोधित परिणाम बनाने के लिए संबंधित प्रश्न, कक्षा/विषय, शैक्षिक अंश, हाल का संदर्भ और शिक्षक निर्देश Groq को भेजे जा सकते हैं।</p><p>हम जानबूझकर खाते का नाम या ईमेल AI अनुरोध में नहीं जोड़ते, लेकिन प्रश्न में लिखी निजी जानकारी भेजे गए पाठ का हिस्सा हो सकती है। अनावश्यक निजी जानकारी न लिखें।</p><p>होस्टिंग, डेटाबेस और नेटवर्क प्रदाता भी हमारी ओर से जानकारी संसाधित कर सकते हैं। कानून, वैध प्रक्रिया या सुरक्षा की जरूरत पर जानकारी साझा की जा सकती है।</p></section>
    <section id="review"><h2>5. प्रशासक समीक्षा और उत्पाद सुधार</h2><p>अधिकृत प्रशासक सहायता, मॉडरेशन, विश्लेषण और गुणवत्ता के लिए प्रोफ़ाइल, हाल के प्रश्न, विषय, क्विज़ मेट्रिक्स, प्रतिक्रिया और कमजोर-टॉपिक संकेत देख सकते हैं।</p><p>कुछ बातचीत मानवीय समीक्षा के लिए चुनी जा सकती है। समीक्षा प्रक्रिया में कुछ पहचानकर्ता कम किए जाते हैं, फिर भी मुक्त पाठ में उपयोगकर्ता की दी जानकारी रह सकती है।</p><div className="legal-callout"><strong>स्वचालित मॉडल प्रशिक्षण नहीं:</strong> बातचीत अपने-आप AI मॉडल के भार नहीं बदलती। डेटा केवल अधिकृत मानवीय समीक्षा और नियंत्रित सुधार प्रक्रिया में उम्मीदवार बन सकता है।</div></section>
    <section id="browser-storage"><h2>6. ब्राउज़र संग्रहण और कुकीज़</h2><p>VidyaAI विज्ञापन कुकीज़ का उपयोग नहीं करता। लोकल स्टोरेज में पहुँच टोकन, भूमिका, भाषा, अध्ययन पसंद और शिक्षक कार्यक्षेत्र के कुछ संसाधन रखे जाते हैं।</p><p>लॉग आउट टोकन और भूमिका हटाता है, लेकिन कुछ पसंद तब तक रह सकती हैं जब तक ब्राउज़र में VidyaAI साइट डेटा साफ न किया जाए।</p></section>
    <section id="children"><h2>7. बच्चे और अभिभावक की भागीदारी</h2><p>VidyaAI स्कूल शिक्षा के लिए है और 18 वर्ष से कम आयु के लोग इसका उपयोग कर सकते हैं। लागू कानून के अनुसार अभिभावक, शिक्षक या अधिकृत स्कूल को निगरानी और आवश्यक अनुमति सुनिश्चित करनी चाहिए।</p><p>हम बच्चों को लक्षित व्यवहार-आधारित विज्ञापन नहीं दिखाते। बच्चे की जानकारी देखने, सुधारने, मिटाने या सुरक्षा चिंता के लिए अभिभावक हमसे संपर्क कर सकते हैं। वर्तमान में इन-प्रोडक्ट आयु सत्यापन उपलब्ध नहीं है।</p></section>
    <section id="retention"><h2>8. रखरखाव और मिटाना</h2><p>जानकारी सेवा देने, इतिहास बनाए रखने, सुरक्षा, जाँच, गुणवत्ता सुधार और कानून के लिए उचित अवधि तक रखी जाती है। अलग रिकॉर्ड की अवधि अलग हो सकती है।</p><p>अभी स्व-सेवा गोपनीयता डैशबोर्ड नहीं है। योग्य पहुँच, सुधार और मिटाने के अनुरोध आधिकारिक ईमेल से लिए जाते हैं; कुछ डेटा बैकअप, सुरक्षा रिकॉर्ड या कानूनी रिकॉर्ड में अस्थायी रूप से रह सकता है।</p></section>
    <section id="security"><h2>9. सुरक्षा</h2><p>हम अनधिकृत पहुँच और प्रकटीकरण सीमित करने के लिए तकनीकी और संगठनात्मक उपाय उपयोग करते हैं, लेकिन कोई ऑनलाइन प्रणाली पूर्ण सुरक्षा की गारंटी नहीं दे सकती।</p><p>पासवर्ड, कार्ड डेटा, आधार विवरण या अनावश्यक संवेदनशील जानकारी VidyaAI या सामान्य ईमेल में न भेजें। डेटा उजागर होने की आशंका पर तुरंत संपर्क करें।</p></section>
    <section id="rights"><h2>10. आपके विकल्प और अधिकार</h2><p>लागू कानून के अधीन आप निजी डेटा की जानकारी, सुधार, योग्य डेटा मिटाने, भविष्य के प्रसंस्करण की सहमति वापस लेने या शिकायत समाधान का अनुरोध कर सकते हैं।</p><p>अपने खाते से जुड़े ईमेल से <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> पर “VidyaAI Privacy Request” विषय के साथ लिखें। पहचान और अधिकार सत्यापित करने के लिए उचित जानकारी माँगी जा सकती है।</p></section>
    <section id="transfers"><h2>11. प्रसंस्करण स्थान</h2><p>सेवा संरचना के अनुसार VidyaAI और उसके प्रदाता भारत या अन्य देशों के सर्वर पर जानकारी संसाधित कर सकते हैं। सीमा-पार प्रसंस्करण लागू कानून और प्रदाता प्रतिबद्धताओं के अनुसार किया जाएगा।</p></section>
    <section id="updates"><h2>12. अपडेट और संपर्क</h2><p>सुविधा, प्रदाता या कानूनी दायित्व बदलने पर नीति अपडेट हो सकती है। ऊपर का संस्करण और प्रभावी तिथि वर्तमान प्रकाशित नीति बताते हैं।</p><p>गोपनीयता अनुरोध के लिए <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> और अन्य प्रश्नों के लिए <Link to="/contact">संपर्क पृष्ठ</Link> उपयोग करें।</p></section>
  </LegalDocument>;
}

export default function Privacy() {
  const { language } = usePublicLanguage();
  if (language === "hi") return <HindiPrivacy />;
  return (
    <LegalDocument
      eyebrow="PRIVACY · GYANIX AI SOLUTIONS"
      title="Privacy Policy"
      summary="This policy describes the personal and learning information processed when students, teachers and administrators use VidyaAI."
      icon="lock"
      sections={sections}
    >
      <section id="scope">
        <h2>1. Scope and responsibility</h2>
        <p>This Privacy Policy applies to VidyaAI, a product operated by Gyanix AI Solutions. It covers the public website, student and teacher workspaces, administrative tools, support communications and the AI-assisted features described below.</p>
        <p>Gyanix AI Solutions is responsible for deciding why and how information is processed for VidyaAI. Privacy questions and requests may be sent to <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>.</p>
      </section>

      <section id="collection">
        <h2>2. Information we process</h2>
        <h3>Information you provide</h3>
        <ul>
          <li>profile and access details such as name, email address, selected role, class and learning medium;</li>
          <li>questions, prompts, teacher instructions, syllabus details, notes and other text entered into VidyaAI;</li>
          <li>quiz answers, feedback, selected subjects, learning preferences and support messages;</li>
          <li>information included voluntarily in any message sent to our official email address.</li>
        </ul>

        <h3>Learning and usage records</h3>
        <ul>
          <li>AI answers and cited sources associated with a question;</li>
          <li>quiz questions, selected answers, correct answers, scores, completion status and timestamps;</li>
          <li>subjects, topics, weak-topic signals, streaks, targets and estimated learning insights;</li>
          <li>teacher-generated curriculum, lesson and assessment resources saved in the browser;</li>
          <li>feedback records and operational metadata used to investigate quality.</li>
        </ul>

        <h3>Technical information</h3>
        <p>Our servers and network software may process IP address, request path, timestamps, browser/device information, error details and related security logs. We do not currently use advertising trackers, payment collection, precise location, microphone or camera features.</p>
      </section>

      <section id="use">
        <h2>3. How information is used</h2>
        <p>We use information to:</p>
        <ul>
          <li>provide student, teacher and administrator features;</li>
          <li>generate responses, quizzes, lesson plans, curriculum plans and assessment drafts;</li>
          <li>retrieve relevant educational material and maintain conversation context;</li>
          <li>calculate quiz progress, weak-topic indicators and learning insights;</li>
          <li>maintain, troubleshoot, protect and understand the service;</li>
          <li>respond to support, privacy and product-feedback requests;</li>
          <li>review quality and create human-reviewed product-improvement candidates;</li>
          <li>comply with applicable legal obligations and lawful requests.</li>
        </ul>
      </section>

      <section id="ai-providers">
        <h2>4. AI and service providers</h2>
        <p>VidyaAI currently uses Groq-hosted AI models. Relevant prompt text, selected subject or class, retrieved educational excerpts, recent conversation context, teacher instructions and certain learning signals may be sent to Groq to produce a requested result.</p>
        <p>We do not deliberately attach account names or email addresses to AI prompts, but personal information typed inside a question, note or instruction may be transmitted as part of that text. Please avoid entering information that is unnecessary for the educational request.</p>
        <p>We also rely on hosting, database, networking and software providers to operate VidyaAI. Those providers process information on our behalf or under their own applicable terms. We may disclose information when required by law, to respond to a valid legal process, or to protect users and the service.</p>
      </section>

      <section id="review">
        <h2>5. Admin review and product improvement</h2>
        <p>Authorised VidyaAI administrators can access operational and learning information such as profile details, recent questions, subjects, quiz metrics, feedback and weak-topic signals for support, moderation, analytics and product-quality work.</p>
        <p>Stored conversations may be copied into a candidate review workflow. Some identifiers, including the internal student identifier and common email or mobile-number patterns, are minimised in that workflow; however, free text may still contain information supplied by the user. Approved administrators may also export reviewed examples or question-and-answer records for improvement work.</p>
        <div className="legal-callout"><strong>No automatic model retraining:</strong> A conversation does not automatically change AI model weights. Interaction records may instead become candidates for authorised human review and controlled improvement workflows.</div>
      </section>

      <section id="browser-storage">
        <h2>6. Browser storage and cookies</h2>
        <p>The current VidyaAI application does not use advertising cookies. It uses browser local storage to keep an access token, selected role, language and study preferences, and—in the teacher workspace—a limited history of generated resources.</p>
        <p>Logging out removes the current access token and role, but some preferences or locally saved resources may remain on that device until you clear VidyaAI site data in the browser. Clearing site data can remove this information and may sign you out.</p>
      </section>

      <section id="children">
        <h2>7. Children and parental involvement</h2>
        <p>VidyaAI is designed for school education and may be used by people under 18. A parent, lawful guardian, teacher or authorised school should supervise use and ensure that any permission required by applicable law has been obtained.</p>
        <p>We do not currently use targeted advertising or behavioural advertising directed at children. Parents or guardians may contact us to ask what information is associated with a child, request correction or deletion where applicable, or raise a safety concern.</p>
        <p>An in-product age-verification and parental-consent workflow is not currently available. If verifiable parental consent is required for a child’s use, contact <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> before the child uses the service.</p>
      </section>

      <section id="retention">
        <h2>8. Retention and deletion</h2>
        <p>We keep information for as long as reasonably needed to provide VidyaAI, maintain learning history, protect the service, investigate issues, improve quality and meet legal requirements. Different records may therefore be retained for different periods.</p>
        <p>VidyaAI does not currently provide a self-service privacy dashboard or automated retention scheduler. Eligible access, correction and deletion requests are handled through our official email. Some information may remain temporarily in backups, security records, reviewed improvement datasets or records that must be retained by law.</p>
      </section>

      <section id="security">
        <h2>9. Security</h2>
        <p>We use technical and organisational measures intended to limit unauthorised access, alteration and disclosure, including access restrictions for administrative functions and separation of application services. No website, transmission or storage system can be guaranteed completely secure.</p>
        <p>Never send passwords, payment-card data, Aadhaar details or other unnecessary sensitive information through a VidyaAI prompt or ordinary email. If you believe data or an account has been exposed, contact us promptly.</p>
      </section>

      <section id="rights">
        <h2>10. Your choices and rights</h2>
        <p>Subject to applicable law, you may ask us to provide information about personal data we process, correct inaccurate information, erase eligible information, withdraw consent for future processing, or address a grievance.</p>
        <p>Send a request from the email address associated with your use to <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> with the subject “VidyaAI Privacy Request”. We may ask for reasonable information to verify identity and authority, especially for a request made for a child.</p>
      </section>

      <section id="transfers">
        <h2>11. Processing locations</h2>
        <p>VidyaAI and its providers may process information on servers located in India or other countries, depending on service infrastructure. Where applicable, we will handle cross-border processing in accordance with legal restrictions and provider commitments.</p>
      </section>

      <section id="updates">
        <h2>12. Updates and contact</h2>
        <p>We may update this policy when VidyaAI features, providers or legal obligations change. The version and effective date at the top identify the currently published policy, and earlier versions should be retained for reference.</p>
        <p>For privacy questions, data requests or grievances, email <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>. For other enquiries, use our <Link to="/contact">Contact page</Link>.</p>
      </section>
    </LegalDocument>
  );
}
