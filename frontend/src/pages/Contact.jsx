import { useState } from "react";
import PublicLayout, { OFFICIAL_EMAIL } from "../components/PublicLayout";
import Icon from "../components/Icon";
import { usePublicLanguage } from "../contexts/PublicLanguageContext";

const initialForm = { name: "", email: "", topic: "General enquiry", message: "" };

function validateField(name, value, hi = false) {
  const cleanValue = value.trim();
  if (name === "name" && cleanValue.length < 2) return hi ? "कृपया अपना नाम लिखें।" : "Please enter your name.";
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) return hi ? "मान्य ईमेल पता लिखें।" : "Enter a valid email address.";
  if (name === "message" && cleanValue.length < 20) return hi ? "अपना अनुरोध समझाने के लिए कम से कम 20 अक्षर लिखें।" : "Please add at least 20 characters so we can understand your request.";
  return "";
}

export default function Contact() {
  const { language } = usePublicLanguage();
  const hi = language === "hi";
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setStatus({ type: "", message: "" });
    if (errors[name]) setErrors((current) => ({ ...current, [name]: validateField(name, value, hi) }));
  };

  const validateOnBlur = (event) => {
    const { name, value } = event.target;
    setErrors((current) => ({ ...current, [name]: validateField(name, value, hi) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {
      name: validateField("name", form.name, hi),
      email: validateField("email", form.email, hi),
      message: validateField("message", form.message, hi),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setStatus({ type: "error", message: hi ? "आगे बढ़ने से पहले चिह्नित फ़ील्ड ठीक करें।" : "Please correct the highlighted fields before continuing." });
      const firstInvalidField = Object.keys(nextErrors).find((field) => nextErrors[field]);
      document.getElementById(`contact-${firstInvalidField}`)?.focus();
      return;
    }

    const subject = `[VidyaAI · ${form.topic}] Message from ${form.name.trim()}`;
    const body = [
      `Name: ${form.name.trim()}`,
      `Reply email: ${form.email.trim()}`,
      `Topic: ${form.topic}`,
      "",
      form.message.trim(),
    ].join("\n");
    setStatus({ type: "success", message: hi ? "आपका ईमेल ऐप यह संदेश लेकर खुल रहा है। वहाँ जाँचकर भेजें दबाएँ।" : "Your email application is opening with this message. Review it there and press Send." });
    window.location.assign(`mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <PublicLayout
      title={hi ? "Gyanix AI Solutions से संपर्क करें" : "Contact Gyanix AI Solutions"}
      description={hi ? "VidyaAI सहायता, स्कूल साझेदारी, गोपनीयता प्रश्न और सामान्य पूछताछ के लिए Gyanix AI Solutions से संपर्क करें।" : "Contact Gyanix AI Solutions for VidyaAI product support, school partnerships, privacy questions and general enquiries."}
    >
      <section className="contact-hero public-section" aria-labelledby="contact-title">
        <p className="public-eyebrow">{hi ? "GYANIX AI SOLUTIONS से संपर्क" : "CONTACT GYANIX AI SOLUTIONS"}</p>
        <h1 id="contact-title">{hi ? "आइए एक उपयोगी बातचीत शुरू करें।" : "Let’s start a useful conversation."}</h1>
        <p>{hi ? "VidyaAI, साझेदारी, उत्पाद प्रतिक्रिया या सहायता से जुड़े प्रश्नों का स्वागत है। हमारी टीम को लिखें; हम यथाशीघ्र उत्तर देंगे।" : "Questions about VidyaAI, partnerships, product feedback or support are welcome. Write to our team and we’ll respond as soon as we can."}</p>
      </section>

      <section className="contact-layout public-section" aria-label="Contact options">
        <aside className="contact-details">
          <div className="contact-detail-icon" aria-hidden="true"><Icon name="mail" size={25} /></div>
          <p className="public-eyebrow">{hi ? "आधिकारिक ईमेल" : "OFFICIAL EMAIL"}</p>
          <h2>{hi ? "हमारी टीम को सीधे ईमेल करें" : "Email our team directly"}</h2>
          <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>
          <p>{hi ? "इस पते का उपयोग उत्पाद सहायता, व्यावसायिक पूछताछ, गोपनीयता प्रश्न और जिम्मेदार सुरक्षा सूचना के लिए करें।" : "Use this address for product help, business enquiries, privacy questions and responsible disclosure."}</p>

          <div className="contact-response-note">
            <Icon name="shield" size={20} />
            <p><strong>{hi ? "गोपनीयता सूचना" : "Privacy note"}</strong><span>{hi ? "यह फ़ॉर्म आपका ईमेल ऐप खोलता है। VidyaAI फ़ॉर्म की सामग्री अपने सर्वर पर संग्रहीत नहीं करता।" : "This form opens your email application. VidyaAI does not store the form contents on its server."}</span></p>
          </div>
        </aside>

        <div className="contact-form-card">
          <div className="contact-form-heading">
            <p className="public-eyebrow">{hi ? "संदेश भेजें" : "SEND A MESSAGE"}</p>
            <h2>{hi ? "हम कैसे मदद कर सकते हैं?" : "How can we help?"}</h2>
            <p>{hi ? "फ़ॉर्म पूरा करें; हम अपने आधिकारिक इनबॉक्स के लिए ईमेल तैयार कर देंगे।" : "Complete the form and we’ll prepare an email addressed to our official inbox."}</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form-grid">
              <div className="contact-field">
                <label htmlFor="contact-name">{hi ? "आपका नाम" : "Your name"} <span className="contact-required" aria-hidden="true">*</span></label>
                <input id="contact-name" name="name" value={form.name} onChange={updateField} onBlur={validateOnBlur} autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} placeholder={hi ? "अपना पूरा नाम लिखें" : "Enter your full name"} />
                {errors.name && <small id="contact-name-error" className="contact-field-error">{errors.name}</small>}
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">{hi ? "आपका ईमेल" : "Your email"} <span className="contact-required" aria-hidden="true">*</span></label>
                <input id="contact-email" name="email" type="email" inputMode="email" value={form.email} onChange={updateField} onBlur={validateOnBlur} autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} placeholder="you@example.com" />
                {errors.email && <small id="contact-email-error" className="contact-field-error">{errors.email}</small>}
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-topic">{hi ? "यह किस विषय में है?" : "What is this about?"}</label>
              <select id="contact-topic" name="topic" value={form.topic} onChange={updateField}>
                <option value="General enquiry">{hi ? "सामान्य पूछताछ" : "General enquiry"}</option>
                <option value="VidyaAI product support">{hi ? "VidyaAI उत्पाद सहायता" : "VidyaAI product support"}</option>
                <option value="School or teacher partnership">{hi ? "स्कूल या शिक्षक साझेदारी" : "School or teacher partnership"}</option>
                <option value="Privacy or data request">{hi ? "गोपनीयता या डेटा अनुरोध" : "Privacy or data request"}</option>
                <option value="Responsible security disclosure">{hi ? "जिम्मेदार सुरक्षा सूचना" : "Responsible security disclosure"}</option>
              </select>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">{hi ? "आपका संदेश" : "Your message"} <span className="contact-required" aria-hidden="true">*</span></label>
              <textarea id="contact-message" name="message" rows="7" value={form.message} onChange={updateField} onBlur={validateOnBlur} required aria-invalid={Boolean(errors.message)} aria-describedby={`contact-message-help${errors.message ? " contact-message-error" : ""}`} placeholder={hi ? "बताएँ कि हम कैसे मदद कर सकते हैं…" : "Tell us how we can help…"} />
              <div className="contact-field-meta">
                {errors.message ? <small id="contact-message-error" className="contact-field-error">{errors.message}</small> : <small id="contact-message-help">{hi ? "पासवर्ड या अत्यंत संवेदनशील जानकारी शामिल न करें।" : "Please avoid including passwords or highly sensitive information."}</small>}
                <small>{form.message.length} {hi ? "अक्षर" : "characters"}</small>
              </div>
            </div>

            {status.message && <p className={`contact-form-status${status.type === "error" ? " error" : ""}`} role={status.type === "error" ? "alert" : "status"}>{status.message}</p>}

            <button className="public-primary-button contact-submit" type="submit">
              {hi ? "ईमेल पर आगे बढ़ें" : "Continue to email"} <Icon name="mail" size={18} />
            </button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
