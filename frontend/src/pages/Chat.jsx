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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const userMessage = { role: "student", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    const response = await api.post("/chat/ask", { question, subject });
    setMessages((prev) => [...prev, userMessage, { role: "assistant", text: response.data.answer, sessionId: response.data.session_id }]);
  };

  const handleFeedback = async (sessionId, understood) => {
    await api.post("/chat/feedback", { session_id: sessionId, understood });
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
                {message.role === "assistant" && message.sessionId && (
                  <button className="feedback-button" onClick={() => handleFeedback(message.sessionId, false)}>
                    I didn't understand
                  </button>
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
