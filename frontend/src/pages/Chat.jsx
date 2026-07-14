import { useEffect, useState } from "react";
import RichMarkdown from "../components/RichMarkdown";
import api from "../api/client";

const subjects = ["Science", "Math", "Hindi", "Social Science", "English"];

export default function Chat() {
  const [subject, setSubject] = useState(subjects[0]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [student, setStudent] = useState({ name: "", class_level: "", exam_date: null });
  const [quizLoading, setQuizLoading] = useState(false);

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
    const userMessage = {
      role: "student",
      text: nextQuestion,
      question: nextQuestion,
      subject: subjectOverride,
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    const response = await api.post("/chat/ask", { question: nextQuestion, subject: subjectOverride });
    const assistantMessage = {
      role: "assistant",
      text: response.data.answer,
      sessionId: response.data.session_id,
      question: nextQuestion,
      subject: subjectOverride,
      chapterOptions: response.data.chapter_options || [],
      feedback: null,
    };
    setMessages((prev) => [
      ...prev,
      assistantMessage,
    ]);
    if (assistantMessage.sessionId && !assistantMessage.chapterOptions.length) {
      await generateActivityQuiz(assistantMessage);
    }
  };

  const generateActivityQuiz = async (message) => {
    setQuizLoading(true);
    try {
      const response = await api.post("/quiz/generate", {
        subject: message.subject || subject || "General",
        chapter: null,
        topic: null,
        source_session_id: message.sessionId,
        source_question: message.question,
        source_answer: message.text,
        quiz_type: "activity",
        count: 2,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "quiz",
          text: "Quick MCQ practice",
          quiz: response.data,
          selectedAnswers: {},
          result: null,
          status: "started",
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const updateQuizMessage = (quizId, updater) => {
    setMessages((prev) => prev.map((message) => (
      message.role === "quiz" && message.quiz?.quiz_id === quizId ? updater(message) : message
    )));
  };

  const handleQuizOption = (quizId, questionId, optionIndex) => {
    updateQuizMessage(quizId, (message) => ({
      ...message,
      selectedAnswers: { ...(message.selectedAnswers || {}), [questionId]: optionIndex },
    }));
  };

  const handleQuizSubmit = async (quizId, selectedAnswers) => {
    const response = await api.post(`/quiz/${quizId}/submit`, { answers: selectedAnswers || {} });
    updateQuizMessage(quizId, (message) => ({
      ...message,
      result: response.data,
      status: "completed",
    }));
  };

  const handleQuizSkip = async (quizId) => {
    try {
      await api.post(`/quiz/${quizId}/skip`);
    } finally {
      updateQuizMessage(quizId, (message) => ({ ...message, status: "skipped" }));
    }
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
    const retryQuestion = message.question || message.text || [...messages].reverse().find((item) => item.role === "student")?.text;
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
              <div key={index} className={`chat-bubble ${message.role === "assistant" ? "assistant" : message.role === "quiz" ? "assistant quiz-bubble" : "student"}`}>
                {message.role !== "quiz" && <RichMarkdown>{message.text}</RichMarkdown>}
                {message.role === "quiz" && (
                  <div className="quiz-card">
                    <div className="quiz-card-head">
                      <div>
                        <strong>Quick MCQ Practice</strong>
                        <span>{message.quiz?.subject} · {message.quiz?.topic}</span>
                      </div>
                      {message.status === "started" && (
                        <button type="button" className="quiz-skip-btn" onClick={() => handleQuizSkip(message.quiz.quiz_id)}>
                          Skip
                        </button>
                      )}
                    </div>
                    {message.status === "skipped" ? (
                      <p className="quiz-status">Skipped. You can continue studying.</p>
                    ) : (
                      <>
                        <div className="quiz-question-list">
                          {message.quiz?.questions?.map((quizQuestion, qIndex) => {
                            const selected = message.selectedAnswers?.[quizQuestion.id];
                            const detail = message.result?.details?.find((item) => item.id === quizQuestion.id);
                            return (
                              <div key={quizQuestion.id} className="quiz-question">
                                <p>{qIndex + 1}. {quizQuestion.prompt}</p>
                                <div className="quiz-options">
                                  {quizQuestion.options.map((option, optionIndex) => (
                                    <button
                                      key={option}
                                      type="button"
                                      className={[
                                        selected === optionIndex ? "selected" : "",
                                        detail?.correct_option === optionIndex ? "correct" : "",
                                        detail && selected === optionIndex && !detail.is_correct ? "wrong" : "",
                                      ].filter(Boolean).join(" ")}
                                      onClick={() => handleQuizOption(message.quiz.quiz_id, quizQuestion.id, optionIndex)}
                                      disabled={Boolean(message.result)}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                                {detail?.explanation && <small>{detail.explanation}</small>}
                              </div>
                            );
                          })}
                        </div>
                        {message.result ? (
                          <p className="quiz-status">Score: {message.result.correct}/{message.result.total} ({message.result.score_percent}%)</p>
                        ) : (
                          <button type="button" className="quiz-submit-btn" onClick={() => handleQuizSubmit(message.quiz.quiz_id, message.selectedAnswers)}>
                            Submit MCQ
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
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
                {message.role === "student" && (
                  <div className="message-signs">
                    <button type="button" className="icon-btn" onClick={() => handleRetry(message)} title="Re-ask question">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
                    </button>
                    <button type="button" className="icon-btn" onClick={() => handleCopy(message.text)} title="Copy question">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
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
            {quizLoading && <div className="chat-bubble assistant">Creating a skippable MCQ quiz...</div>}
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
