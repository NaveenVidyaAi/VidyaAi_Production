import { Link } from "react-router-dom";
import PublicLayout, { OFFICIAL_EMAIL } from "../components/PublicLayout";
import Icon from "../components/Icon";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const pageCopy = {
  en: {
    title: "About Gyanix AI Solutions & VidyaAI", description: "Meet Gyanix AI Solutions, learn about VidyaAI, and discover the applied-AI vision of founder and CEO Naveen Chandrawanshi.", aboutEye: "ABOUT GYANIX AI SOLUTIONS", heading: <>Practical intelligence.<br /><span>Meaningful impact.</span></>, intro: "Gyanix AI Solutions builds thoughtful AI-powered products that simplify complex work and help people make better use of information. VidyaAI is our education-focused product, created to make high-quality learning support more accessible to students and teachers.", talk: "Talk to us", company: "Company", productEye: "OUR EDUCATION PRODUCT", meet: "Meet VidyaAI", productOne: "VidyaAI is an AI learning and teaching workspace designed around the needs of CGBSE students and educators. It brings curriculum-aware assistance, bilingual learning support, practice resources and teacher planning tools into one focused experience.", productTwo: "Our goal is not to replace teachers or traditional learning. It is to give learners clearer explanations and useful practice while giving teachers dependable tools they can review and adapt.", founderEye: "FOUNDER & CEO", role: "Senior Software Engineer · Applied AI Builder", founderOne: "Naveen works at the intersection of software engineering and applied artificial intelligence. His focus includes generative AI, retrieval-augmented systems, multilingual experiences and reliable production software.", founderTwo: "He founded Gyanix AI Solutions with a belief that useful AI should be understandable, responsible and built around genuine human needs. VidyaAI carries that belief into education.", quote: "“AI should not replace human potential; it should remove the barriers that keep people from reaching it.”", principlesEye: "HOW WE BUILD", principlesTitle: "Principles behind our products", ctaEye: "LET'S BUILD SOMETHING USEFUL", ctaTitle: "Have a question about Gyanix or VidyaAI?", contact: "Contact us", principles: [{ icon: "brain", title: "Human-centred AI", copy: "Technology should strengthen understanding and judgment, not replace the people who teach and learn." }, { icon: "shield", title: "Responsible by design", copy: "Clear limitations, careful data practices and human review belong inside the product—not in the fine print." }, { icon: "code", title: "Built for real use", copy: "We focus on dependable software that turns modern AI into practical, accessible everyday workflows." }],
  },
  hi: {
    title: "Gyanix AI Solutions और VidyaAI के बारे में", description: "Gyanix AI Solutions, VidyaAI और संस्थापक एवं CEO नवीन चंद्रवंशी की अनुप्रयुक्त AI दृष्टि के बारे में जानें।", aboutEye: "GYANIX AI SOLUTIONS के बारे में", heading: <>व्यावहारिक बुद्धिमत्ता।<br /><span>सार्थक प्रभाव।</span></>, intro: "Gyanix AI Solutions ऐसे विचारशील AI उत्पाद बनाता है जो जटिल काम को सरल करते हैं और जानकारी का बेहतर उपयोग करने में मदद करते हैं। VidyaAI हमारा शिक्षा-केंद्रित उत्पाद है, जो विद्यार्थियों और शिक्षकों के लिए उच्च गुणवत्ता वाली शिक्षण सहायता को अधिक सुलभ बनाता है।", talk: "हमसे बात करें", company: "कंपनी", productEye: "हमारा शिक्षा उत्पाद", meet: "VidyaAI से परिचय", productOne: "VidyaAI CGBSE विद्यार्थियों और शिक्षकों की जरूरतों के अनुसार बनाया गया AI शिक्षण कार्यक्षेत्र है। इसमें पाठ्यक्रम-संगत सहायता, द्विभाषी शिक्षण, अभ्यास संसाधन और शिक्षक योजना टूल्स एक ही स्थान पर मिलते हैं।", productTwo: "हमारा उद्देश्य शिक्षकों या पारंपरिक पढ़ाई को बदलना नहीं है। हम विद्यार्थियों को स्पष्ट व्याख्या और उपयोगी अभ्यास तथा शिक्षकों को जाँच और संपादन योग्य भरोसेमंद टूल्स देना चाहते हैं।", founderEye: "संस्थापक और CEO", role: "वरिष्ठ सॉफ्टवेयर इंजीनियर · अनुप्रयुक्त AI निर्माता", founderOne: "नवीन सॉफ्टवेयर इंजीनियरिंग और अनुप्रयुक्त कृत्रिम बुद्धिमत्ता के संगम पर काम करते हैं। उनका ध्यान जनरेटिव AI, रिट्रीवल-ऑगमेंटेड सिस्टम, बहुभाषी अनुभव और भरोसेमंद प्रोडक्शन सॉफ्टवेयर पर है।", founderTwo: "उन्होंने Gyanix AI Solutions की स्थापना इस विश्वास के साथ की कि उपयोगी AI समझने योग्य, जिम्मेदार और वास्तविक मानवीय जरूरतों पर आधारित होना चाहिए। VidyaAI इसी विश्वास को शिक्षा में लाता है।", quote: "“AI को मानवीय क्षमता का स्थान नहीं लेना चाहिए; उसे उन बाधाओं को हटाना चाहिए जो लोगों को अपनी क्षमता तक पहुँचने से रोकती हैं।”", principlesEye: "हम कैसे बनाते हैं", principlesTitle: "हमारे उत्पादों के सिद्धांत", ctaEye: "आइए कुछ उपयोगी बनाएँ", ctaTitle: "Gyanix या VidyaAI के बारे में कोई प्रश्न है?", contact: "संपर्क करें", principles: [{ icon: "brain", title: "मानव-केंद्रित AI", copy: "तकनीक को समझ और निर्णय क्षमता मजबूत करनी चाहिए, पढ़ाने और सीखने वाले लोगों का स्थान नहीं लेना चाहिए।" }, { icon: "shield", title: "डिज़ाइन से ही जिम्मेदार", copy: "स्पष्ट सीमाएँ, सावधान डेटा व्यवहार और मानवीय समीक्षा उत्पाद का मूल हिस्सा हैं।" }, { icon: "code", title: "वास्तविक उपयोग के लिए निर्मित", copy: "हम भरोसेमंद सॉफ्टवेयर बनाते हैं जो आधुनिक AI को व्यावहारिक और सुलभ दैनिक कार्यप्रवाह में बदलता है।" }],
  },
};

export default function About() {
  const { language } = usePublicLanguage();
  const t = pageCopy[language];
  return (
    <PublicLayout
      title={t.title}
      description={t.description}
    >
      <section className="about-hero public-section" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <p className="public-eyebrow">{t.aboutEye}</p>
          <h1 id="about-title">{t.heading}</h1>
          <p>{t.intro}</p>
          <div className="public-hero-actions">
            <Link className="public-primary-button" to="/contact">{t.talk} <Icon name="arrowRight" size={18} /></Link>
            <a className="public-secondary-button" href={`mailto:${OFFICIAL_EMAIL}`}><Icon name="mail" size={18} /> {OFFICIAL_EMAIL}</a>
          </div>
        </div>
        <div className="company-logo-card" aria-label="Gyanix AI Solutions official logo">
          <img src="/brand/gyanix-ai-solutions-logo.png" alt="Gyanix AI Solutions" width="1024" height="1024" />
          <p><span>{t.company}</span><strong>Gyanix AI Solutions</strong></p>
        </div>
      </section>

      <section className="product-story public-section" aria-labelledby="vidyaai-story-title">
        <div className="product-story-label">
          <span aria-hidden="true">वि</span>
          <p>{t.productEye}</p>
        </div>
        <div>
          <h2 id="vidyaai-story-title">{t.meet}</h2>
          <p>{t.productOne}</p>
          <p>{t.productTwo}</p>
        </div>
      </section>

      <section className="founder-section public-section" aria-labelledby="founder-title">
        <div className="founder-photo-wrap">
          <div className="founder-photo-accent" aria-hidden="true" />
          <img src="/brand/naveen-chandrawanshi-founder.jpeg" alt="Naveen Chandrawanshi, Founder and CEO of Gyanix AI Solutions" width="472" height="590" loading="lazy" />
        </div>
        <div className="founder-copy">
          <p className="public-eyebrow">{t.founderEye}</p>
          <h2 id="founder-title">Naveen Chandrawanshi</h2>
          <h3>{t.role}</h3>
          <p>{t.founderOne}</p>
          <p>{t.founderTwo}</p>
          <blockquote>
            <Icon name="quote" size={27} />
            <p>{t.quote}</p>
            <cite>— Naveen Chandrawanshi</cite>
          </blockquote>
        </div>
      </section>

      <section className="principles-section public-section" aria-labelledby="principles-title">
        <div className="public-section-heading">
          <p className="public-eyebrow">{t.principlesEye}</p>
          <h2 id="principles-title">{t.principlesTitle}</h2>
        </div>
        <div className="principles-grid">
          {t.principles.map((principle) => (
            <article key={principle.title}>
              <span aria-hidden="true"><Icon name={principle.icon} size={23} /></span>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-cta public-section">
        <div><p className="public-eyebrow">{t.ctaEye}</p><h2>{t.ctaTitle}</h2></div>
        <Link className="public-primary-button" to="/contact">{t.contact} <Icon name="arrowRight" size={18} /></Link>
      </section>
    </PublicLayout>
  );
}
