import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import api from "../api/client";

const subjects = ["Science", "Math", "Hindi", "Social Science", "English"];

export default function Chat() {
  const [subject, setSubject] = useState(subjects[0]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [student, setStudent] = useState({ name: "", class_level: "", exam_date: null });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/auth/me");
        setStudent(response.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadProfile();
  }, []);

  const askQuestion = async (nextQuestion, subjectOverride = subject) => {
    if (!nextQuestion.trim()) return;
    const userMessage = { role: "student", text: nextQuestion };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    const response = await api.post("/chat/ask", { question: nextQuestion, subject: subjectOverride });
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: response.data.answer,
        sessionId: response.data.session_id,
        question: nextQuestion,
        subject: subjectOverride,
        chapterOptions: response.data.chapter_options || [],
        feedback: null,
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await askQuestion(question);
  };

  const handleChapterOption = async (option) => {
    const optionSubject = option.subject || subject || "Hindi";
    setSubject(optionSubject);
    await askQuestion(option.prompt || `class 10 ${optionSubject} chapter ${option.section}`, optionSubject);
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleFeedback = async (messageIndex, sessionId, understood) => {
    if (!sessionId) return;
    setMessages((prev) => prev.map((message, index) => (
      index === messageIndex ? { ...message, feedback: understood ? "up" : "down" } : message
    )));
    try {
      await api.post("/chat/feedback", { session_id: sessionId, understood });
    } catch {
      setMessages((prev) => prev.map((message, index) => (
        index === messageIndex ? { ...message, feedback: null } : message
      )));
    }
  };

  const handleRetry = async (message) => {
    const retryQuestion = message.question || [...messages].reverse().find((item) => item.role === "student")?.text;
    if (!retryQuestion) return;
    await askQuestion(retryQuestion, message.subject || subject);
  };

  return (
    <div className="page-shell chat-page">
      <div className="chat-topbar">
        <div>
          <h1>VidyaAI</h1>
          <p>{student.name} · Class {student.class_level}</p>
        </div>
        <div>{student.exam_date ? `${Math.max(Math.ceil((new Date(student.exam_date) - new Date()) / (1000 * 60 * 60 * 24)), 0)} days to board exam` : "Set your exam date"}</div>
      </div>
      <div className="chat-grid">
        <aside className="chat-sidebar">
          <h2>Subjects</h2>
          {subjects.map((subjectOption) => (
            <button key={subjectOption} className={subjectOption === subject ? "active" : ""} onClick={() => setSubject(subjectOption)}>
              {subjectOption}
            </button>
          ))}
        </aside>
        <main className="chat-main">
          <div className="chat-window">
            {messages.map((message, index) => (
              <div key={index} className={`chat-bubble ${message.role === "assistant" ? "assistant" : "student"}`}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
                {message.role === "assistant" && message.chapterOptions?.length > 0 && (
                  <div className="chapter-option-list">
                    {message.chapterOptions.map((option) => (
                      <button key={option.section} type="button" onClick={() => handleChapterOption(option)}>
                        <span>{option.section}</span>
                        {option.title}
                      </button>
                    ))}
                  </div>
                )}
                {message.role === "assistant" && (
                  <div className="message-signs">
                    <button type="button" className="icon-btn" onClick={() => handleCopy(message.text)} title="Copy">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button type="button" className="icon-btn" onClick={() => handleRetry(message)} title="Retry">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
                    </button>
                    {message.sessionId && !message.chapterOptions?.length && (
                      <>
                        <button
                          type="button"
                          className={`icon-btn feedback-icon positive${message.feedback === "up" ? " active" : ""}`}
                          onClick={() => handleFeedback(index, message.sessionId, true)}
                          title="Good answer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                        </button>
                        <button
                          type="button"
                          className={`icon-btn feedback-icon negative${message.feedback === "down" ? " active" : ""}`}
                          onClick={() => handleFeedback(index, message.sessionId, false)}
                          title="Needs improvement"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V3"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((subjectOption) => (
                <option key={subjectOption} value={subjectOption}>{subjectOption}</option>
              ))}
            </select>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask your question in Hindi or English" />
            <button type="submit">Send</button>
          </form>
        </main>
      </div>
    </div>
  );
}
