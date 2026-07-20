import { Link } from "react-router-dom";
import LegalDocument from "../components/LegalDocument";
import { OFFICIAL_EMAIL } from "../components/PublicLayout";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const sections = [
  { id: "agreement", title: "Agreement to these terms" },
  { id: "eligibility", title: "Eligibility and younger users" },
  { id: "accounts", title: "Accounts and access" },
  { id: "service", title: "What VidyaAI provides" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "content", title: "Content and intellectual property" },
  { id: "privacy", title: "Privacy and learning data" },
  { id: "availability", title: "Availability and termination" },
  { id: "disclaimers", title: "Disclaimers and liability" },
  { id: "law", title: "Governing law and disputes" },
  { id: "changes", title: "Changes and contact" },
];

const hindiSections = [
  { id: "agreement", title: "इन शर्तों से सहमति" }, { id: "eligibility", title: "पात्रता और कम आयु के उपयोगकर्ता" }, { id: "accounts", title: "खाते और पहुँच" }, { id: "service", title: "VidyaAI क्या प्रदान करता है" }, { id: "acceptable-use", title: "स्वीकार्य उपयोग" }, { id: "content", title: "सामग्री और बौद्धिक संपदा" }, { id: "privacy", title: "गोपनीयता और शिक्षण डेटा" }, { id: "availability", title: "उपलब्धता और समाप्ति" }, { id: "disclaimers", title: "अस्वीकरण और दायित्व" }, { id: "law", title: "लागू कानून और विवाद" }, { id: "changes", title: "परिवर्तन और संपर्क" },
];

function HindiTerms() {
  return <LegalDocument eyebrow="कानूनी · GYANIX AI SOLUTIONS" title="नियम और शर्तें" summary="ये शर्तें Gyanix AI Solutions के शैक्षिक प्रौद्योगिकी उत्पाद VidyaAI तक पहुँच और उसके उपयोग के नियम समझाती हैं।" sections={hindiSections}>
    <section id="agreement"><h2>1. इन शर्तों से सहमति</h2><p>VidyaAI का उपयोग करके आप इन नियम और शर्तों, हमारी <Link to="/privacy">गोपनीयता नीति</Link> और <Link to="/ai-use">जिम्मेदार AI उपयोग नीति</Link> से सहमत होते हैं। असहमत होने पर सेवा का उपयोग न करें।</p><p>“VidyaAI”, “Gyanix”, “हम” और “हमारा” से Gyanix AI Solutions और VidyaAI उत्पाद का अर्थ है। “आप” से उपयोगकर्ता या उस उपयोग को अधिकृत करने वाले अभिभावक, शिक्षक, स्कूल अथवा संगठन का अर्थ है।</p></section>
    <section id="eligibility"><h2>2. पात्रता और कम आयु के उपयोगकर्ता</h2><p>VidyaAI विद्यार्थियों और शिक्षकों के लिए बनाया गया है। 18 वर्ष से कम आयु के उपयोगकर्ताओं को लागू स्थिति के अनुसार अभिभावक, शिक्षक या अधिकृत स्कूल की जानकारी और निगरानी में सेवा का उपयोग करना चाहिए।</p><p>अनुमति से जुड़ी चिंता के लिए <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> पर संपर्क करें। समीक्षा के दौरान हम पहुँच सीमित कर सकते हैं।</p></section>
    <section id="accounts"><h2>3. खाते और पहुँच</h2><p>सही जानकारी दें, उचित विद्यार्थी या शिक्षक भूमिका चुनें और किसी अन्य व्यक्ति का रूप धारण न करें। अपने ब्राउज़र सत्र, उपकरण और पहुँच क्रेडेंशियल की सुरक्षा आपकी जिम्मेदारी है।</p><p>टोकन साझा करना, दूसरे उपयोगकर्ता की जानकारी प्राप्त करने की कोशिश करना या लिखित अनुमति के बिना स्वचालित पहुँच वर्जित है।</p></section>
    <section id="service"><h2>4. VidyaAI क्या प्रदान करता है</h2><p>VidyaAI AI-सहायित व्याख्या, अध्ययन सहायता, क्विज़, प्रश्नपत्र पहुँच, पाठ्यक्रम और पाठ योजना तथा संबंधित शैक्षिक टूल्स प्रदान करता है। सुविधाएँ समय के साथ बदल सकती हैं।</p><div className="legal-callout"><strong>महत्वपूर्ण:</strong> AI से बनी सामग्री सहायता है; यह आधिकारिक बोर्ड प्रकाशन, प्रमाणित उत्तर या परीक्षा परिणाम की गारंटी नहीं है। महत्वपूर्ण सामग्री की मानवीय जाँच आवश्यक है।</div><p>VidyaAI एक स्वतंत्र शैक्षिक प्रौद्योगिकी उत्पाद है और स्पष्ट उल्लेख के बिना CGBSE या किसी सरकारी प्राधिकरण से संबद्ध या समर्थित नहीं है।</p></section>
    <section id="acceptable-use"><h2>5. स्वीकार्य उपयोग</h2><p>VidyaAI का उपयोग वैध पढ़ाई, शिक्षण और शैक्षिक तैयारी के लिए करें। इसका उपयोग नकल, धोखाधड़ी, उत्पीड़न, हानिकारक सामग्री, सुरक्षा भंग, बड़े पैमाने पर स्क्रैपिंग या सेवा बाधित करने के लिए न करें।</p><ul><li>पासवर्ड, कार्ड विवरण, सरकारी पहचान या अनावश्यक संवेदनशील जानकारी न भेजें;</li><li>अधिकारों का उल्लंघन करके प्लेटफ़ॉर्म या सामग्री का पुनर्विक्रय न करें;</li><li>किसी विद्यार्थी से जुड़े महत्वपूर्ण निर्णय का एकमात्र आधार AI उत्तर को न बनाएँ।</li></ul></section>
    <section id="content"><h2>6. सामग्री और बौद्धिक संपदा</h2><p>Gyanix AI Solutions VidyaAI सॉफ्टवेयर, इंटरफ़ेस, ब्रांड और मूल उत्पाद सामग्री का स्वामी या लाइसेंसधारी है। तृतीय-पक्ष शैक्षिक सामग्री अपने संबंधित स्वामियों के अधिकारों के अधीन रहती है।</p><p>आप अपनी भेजी सामग्री के लिए जिम्मेदार हैं और सेवा चलाने, सुरक्षित रखने तथा सुधारने के लिए उसके आवश्यक प्रसंस्करण की अनुमति देते हैं। AI सामग्री अन्य उपयोगकर्ताओं की सामग्री जैसी हो सकती है; उपयोग से पहले अनुमति और श्रेय की जरूरत जाँचें।</p></section>
    <section id="privacy"><h2>7. गोपनीयता और शिक्षण डेटा</h2><p>VidyaAI खाता जानकारी, प्रश्न, उत्तर, क्विज़ गतिविधि, प्रतिक्रिया और तकनीकी रिकॉर्ड संसाधित करता है। कुछ संबंधित पाठ बाहरी AI प्रदाता द्वारा संसाधित हो सकता है। विवरण के लिए <Link to="/privacy">गोपनीयता नीति</Link> पढ़ें।</p><p>शैक्षिक अनुरोध के लिए अनावश्यक निजी या गोपनीय जानकारी दर्ज न करें।</p></section>
    <section id="availability"><h2>8. उपलब्धता और समाप्ति</h2><p>रखरखाव, सुरक्षा, कानूनी या संचालन कारणों से हम सुविधाएँ बदल, सीमित, निलंबित या बंद कर सकते हैं। निर्बाध उपलब्धता की गारंटी नहीं है।</p><p>शर्तों के उल्लंघन, जोखिम या कानूनी आवश्यकता पर पहुँच सीमित की जा सकती है। आप कभी भी उपयोग बंद कर सकते हैं और योग्य निजी डेटा हटाने का अनुरोध कर सकते हैं।</p></section>
    <section id="disclaimers"><h2>9. अस्वीकरण और दायित्व</h2><p>VidyaAI “जैसा उपलब्ध है” आधार पर दिया जाता है। AI प्रश्न गलत समझ सकता है, संदर्भ छोड़ सकता है या गलत और पुरानी जानकारी दे सकता है। शैक्षिक परिणाम की गारंटी नहीं है।</p><p>लागू कानून की अधिकतम सीमा तक Gyanix AI Solutions जनरेटेड सामग्री पर निर्भरता, सेवा बाधा, अनधिकृत उपयोग या तृतीय-पक्ष सामग्री से हुई अप्रत्यक्ष हानि के लिए जिम्मेदार नहीं होगा। कानूनी रूप से अपवर्जित न किए जा सकने वाले अधिकार अप्रभावित रहते हैं।</p></section>
    <section id="law"><h2>10. लागू कानून और विवाद</h2><p>ये शर्तें भारत के कानूनों द्वारा नियंत्रित हैं। औपचारिक कार्यवाही से पहले समाधान के लिए हमसे संपर्क करें। विवाद भारत में वैध क्षेत्राधिकार वाली अदालत या प्राधिकरण द्वारा संभाला जाएगा।</p></section>
    <section id="changes"><h2>11. परिवर्तन और संपर्क</h2><p>सेवा या लागू आवश्यकताओं में बदलाव पर हम इन शर्तों को संशोधित कर सकते हैं। ऊपर दिया संस्करण और प्रभावी तिथि वर्तमान प्रकाशित शर्तें बताते हैं।</p><p>प्रश्न <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a> पर भेजें।</p></section>
  </LegalDocument>;
}

export default function Terms() {
  const { language } = usePublicLanguage();
  if (language === "hi") return <HindiTerms />;
  return (
    <LegalDocument
      eyebrow="LEGAL · GYANIX AI SOLUTIONS"
      title="Terms & Conditions"
      summary="These terms explain the rules for accessing and using VidyaAI, an educational technology product of Gyanix AI Solutions."
      sections={sections}
    >
      <section id="agreement">
        <h2>1. Agreement to these terms</h2>
        <p>By accessing or using VidyaAI, you agree to these Terms & Conditions, our <Link to="/privacy">Privacy Policy</Link> and our <Link to="/ai-use">Responsible AI Use Policy</Link>. If you do not agree, please do not use the service.</p>
        <p>“VidyaAI”, “Gyanix”, “we”, “us” and “our” refer to Gyanix AI Solutions and the VidyaAI product. “You” refers to the person using the service or the parent, guardian, teacher, school or organisation authorising that use.</p>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility and younger users</h2>
        <p>VidyaAI is designed for students and educators. Users under 18 should use the service with the knowledge and supervision of a parent, lawful guardian, teacher or authorised school, as applicable.</p>
        <p>A parent or guardian who believes a child has provided personal information without appropriate permission may contact us at <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>. We may restrict access while reviewing an age, safety or consent concern.</p>
      </section>

      <section id="accounts">
        <h2>3. Accounts and access</h2>
        <p>You must provide accurate information, select the appropriate student or teacher role, and avoid impersonating another person. You are responsible for activity performed through your browser session and for keeping any access credentials or devices under your control.</p>
        <p>Do not share access tokens, attempt to obtain another user’s information, claim a professional or teacher role you do not hold, or use automated methods to access the service without written permission.</p>
      </section>

      <section id="service">
        <h2>4. What VidyaAI provides</h2>
        <p>VidyaAI provides AI-assisted explanations, study support, quizzes, model-paper access, curriculum and lesson planning, question-paper creation and related educational tools. Features may change as the product improves.</p>
        <div className="legal-callout"><strong>Important:</strong> AI-generated material is assistance, not an official board publication, certified answer, professional assessment or guaranteed examination result. Teachers and learners must review important output before relying on it.</div>
        <p>VidyaAI is an independent educational technology product. Unless expressly stated otherwise, it is not affiliated with, sponsored by or endorsed by CGBSE or any government authority.</p>
      </section>

      <section id="acceptable-use">
        <h2>5. Acceptable use</h2>
        <p>You may use VidyaAI for lawful learning, teaching, lesson preparation and educational administration. You must not:</p>
        <ul>
          <li>use the service for cheating, impersonation, fraud or academic misconduct;</li>
          <li>upload or submit unlawful, abusive, discriminatory, sexually exploitative or harmful material;</li>
          <li>attempt to bypass security, probe systems, scrape content at scale or disrupt availability;</li>
          <li>submit passwords, payment-card details, government identifiers or unnecessary sensitive information in prompts;</li>
          <li>copy, resell or commercially redistribute the platform or generated resources in a way that violates applicable rights;</li>
          <li>use AI output as the sole basis for a high-impact decision about a student.</li>
        </ul>
      </section>

      <section id="content">
        <h2>6. Content and intellectual property</h2>
        <p>Gyanix AI Solutions owns or licenses the VidyaAI software, interface, branding and original product content. Educational documents, textbooks, board materials and third-party resources remain subject to the rights of their respective owners.</p>
        <p>You retain responsibility for information and material you submit. You give us permission to process it only as needed to operate, secure, evaluate and improve the service as described in the Privacy Policy.</p>
        <p>AI output may resemble material generated for other users and may not qualify for exclusive ownership. You are responsible for checking whether your intended use requires attribution, permission or additional review.</p>
      </section>

      <section id="privacy">
        <h2>7. Privacy and learning data</h2>
        <p>Use of VidyaAI involves processing account/profile information, prompts, responses, quiz activity, feedback and technical records. Some relevant prompt and learning context is processed by an external AI provider. Our <Link to="/privacy">Privacy Policy</Link> explains these practices in detail.</p>
        <p>Please avoid entering personal or confidential information that is not needed for your educational request.</p>
      </section>

      <section id="availability">
        <h2>8. Availability and termination</h2>
        <p>We may update, limit, suspend or discontinue features for maintenance, safety, legal, operational or product reasons. We do not promise uninterrupted availability or that every feature will remain unchanged.</p>
        <p>We may restrict access when these terms are violated, when use creates risk for other users or the service, or when required by law. You may stop using VidyaAI at any time and may request deletion of eligible personal data by contacting us.</p>
      </section>

      <section id="disclaimers">
        <h2>9. Disclaimers and liability</h2>
        <p>VidyaAI is provided on an “as available” basis. AI systems can misunderstand questions, omit context, generate outdated material or provide incorrect answers. Educational results depend on many factors and are not guaranteed.</p>
        <p>To the maximum extent permitted by applicable law, Gyanix AI Solutions will not be responsible for indirect, incidental or consequential loss arising from reliance on generated output, service interruption, unauthorised use, or material supplied by third parties. Nothing in these terms excludes rights or liability that cannot legally be excluded.</p>
      </section>

      <section id="law">
        <h2>10. Governing law and disputes</h2>
        <p>These terms are governed by the laws of India. Before beginning formal proceedings, please contact us so we can attempt to resolve the concern in good faith. Any dispute will be handled by a court or authority with lawful jurisdiction in India.</p>
      </section>

      <section id="changes">
        <h2>11. Changes and contact</h2>
        <p>We may revise these terms when the service or applicable requirements change. The version and effective date at the top identify the terms currently published. Material changes will be communicated through the website or product where reasonably possible.</p>
        <p>Questions about these terms may be sent to <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>.</p>
      </section>
    </LegalDocument>
  );
}
