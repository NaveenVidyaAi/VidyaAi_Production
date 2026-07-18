import { useState } from "react";
import PublicLayout, { OFFICIAL_EMAIL } from "../components/PublicLayout";
import Icon from "../components/Icon";

const initialForm = { name: "", email: "", topic: "General enquiry", message: "" };

function validateField(name, value) {
  const cleanValue = value.trim();
  if (name === "name" && cleanValue.length < 2) return "Please enter your name.";
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) return "Enter a valid email address.";
  if (name === "message" && cleanValue.length < 20) return "Please add at least 20 characters so we can understand your request.";
  return "";
}

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setStatus({ type: "", message: "" });
    if (errors[name]) setErrors((current) => ({ ...current, [name]: validateField(name, value) }));
  };

  const validateOnBlur = (event) => {
    const { name, value } = event.target;
    setErrors((current) => ({ ...current, [name]: validateField(name, value) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {
      name: validateField("name", form.name),
      email: validateField("email", form.email),
      message: validateField("message", form.message),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setStatus({ type: "error", message: "Please correct the highlighted fields before continuing." });
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
    setStatus({ type: "success", message: "Your email application is opening with this message. Review it there and press Send." });
    window.location.assign(`mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <PublicLayout
      title="Contact Gyanix AI Solutions"
      description="Contact Gyanix AI Solutions for VidyaAI product support, school partnerships, privacy questions and general enquiries."
    >
      <section className="contact-hero public-section" aria-labelledby="contact-title">
        <p className="public-eyebrow">CONTACT GYANIX AI SOLUTIONS</p>
        <h1 id="contact-title">Let’s start a useful conversation.</h1>
        <p>Questions about VidyaAI, partnerships, product feedback or support are welcome. Write to our team and we’ll respond as soon as we can.</p>
      </section>

      <section className="contact-layout public-section" aria-label="Contact options">
        <aside className="contact-details">
          <div className="contact-detail-icon" aria-hidden="true"><Icon name="mail" size={25} /></div>
          <p className="public-eyebrow">OFFICIAL EMAIL</p>
          <h2>Email our team directly</h2>
          <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>
          <p>Use this address for product help, business enquiries, privacy questions and responsible disclosure.</p>

          <div className="contact-response-note">
            <Icon name="shield" size={20} />
            <p><strong>Privacy note</strong><span>This form opens your email application. VidyaAI does not store the form contents on its server.</span></p>
          </div>
        </aside>

        <div className="contact-form-card">
          <div className="contact-form-heading">
            <p className="public-eyebrow">SEND A MESSAGE</p>
            <h2>How can we help?</h2>
            <p>Complete the form and we’ll prepare an email addressed to our official inbox.</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form-grid">
              <div className="contact-field">
                <label htmlFor="contact-name">Your name <span className="contact-required" aria-hidden="true">*</span></label>
                <input id="contact-name" name="name" value={form.name} onChange={updateField} onBlur={validateOnBlur} autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} placeholder="Enter your full name" />
                {errors.name && <small id="contact-name-error" className="contact-field-error">{errors.name}</small>}
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">Your email <span className="contact-required" aria-hidden="true">*</span></label>
                <input id="contact-email" name="email" type="email" inputMode="email" value={form.email} onChange={updateField} onBlur={validateOnBlur} autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} placeholder="you@example.com" />
                {errors.email && <small id="contact-email-error" className="contact-field-error">{errors.email}</small>}
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-topic">What is this about?</label>
              <select id="contact-topic" name="topic" value={form.topic} onChange={updateField}>
                <option>General enquiry</option>
                <option>VidyaAI product support</option>
                <option>School or teacher partnership</option>
                <option>Privacy or data request</option>
                <option>Responsible security disclosure</option>
              </select>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">Your message <span className="contact-required" aria-hidden="true">*</span></label>
              <textarea id="contact-message" name="message" rows="7" value={form.message} onChange={updateField} onBlur={validateOnBlur} required aria-invalid={Boolean(errors.message)} aria-describedby={`contact-message-help${errors.message ? " contact-message-error" : ""}`} placeholder="Tell us how we can help…" />
              <div className="contact-field-meta">
                {errors.message ? <small id="contact-message-error" className="contact-field-error">{errors.message}</small> : <small id="contact-message-help">Please avoid including passwords or highly sensitive information.</small>}
                <small>{form.message.length} characters</small>
              </div>
            </div>

            {status.message && <p className={`contact-form-status${status.type === "error" ? " error" : ""}`} role={status.type === "error" ? "alert" : "status"}>{status.message}</p>}

            <button className="public-primary-button contact-submit" type="submit">
              Continue to email <Icon name="mail" size={18} />
            </button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
