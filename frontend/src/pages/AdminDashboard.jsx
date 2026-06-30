import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

/* ─────────────────── tiny SVG bar chart ─────────────────── */
function BarChart({ data, labelKey, valueKey, color = "#6366f1" }) {
  if (!data || data.length === 0) return <p className="adm-empty">No data</p>;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="adm-barchart">
      {data.map((d, i) => (
        <div key={i} className="adm-bar-row">
          <span className="adm-bar-label" title={d[labelKey]}>{d[labelKey]}</span>
          <div className="adm-bar-track">
            <div
              className="adm-bar-fill"
              style={{ width: `${Math.round((d[valueKey] / max) * 100)}%`, background: color }}
            />
          </div>
          <span className="adm-bar-value">{d[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

function GroupedBarChart({ data }) {
  if (!data || data.length === 0) return <p className="adm-empty">No data</p>;
  const max = Math.max(...data.map((d) => Math.max(d.questions || 0, d.active_users || 0)), 1);
  return (
    <div className="adm-barchart">
      {data.map((d) => (
        <div key={d.date} className="adm-bar-row adm-bar-row-stacked">
          <span className="adm-bar-label" title={d.date}>{new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
          <div className="adm-dual-bars">
            <div className="adm-bar-track">
              <div className="adm-bar-fill" style={{ width: `${Math.round(((d.questions || 0) / max) * 100)}%`, background: "#126b52" }} />
            </div>
            <div className="adm-bar-track">
              <div className="adm-bar-fill" style={{ width: `${Math.round(((d.active_users || 0) / max) * 100)}%`, background: "#2563eb" }} />
            </div>
          </div>
          <span className="adm-bar-value">{d.questions}/{d.active_users}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────── donut chart (SVG) ─────────────────── */
const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899"];
function DonutChart({ data, labelKey, valueKey }) {
  if (!data || data.length === 0) return <p className="adm-empty">No data</p>;
  const total = data.reduce((s, d) => s + d[valueKey], 0) || 1;
  let offset = 0;
  const R = 60, cx = 70, cy = 70, stroke = 28;
  const circumference = 2 * Math.PI * R;
  return (
    <div className="adm-donut-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {data.map((d, i) => {
          const pct = d[valueKey] / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const seg = (
            <circle
              key={i}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circumference}
              style={{ transition: "stroke-dasharray 0.4s" }}
            />
          );
          offset += pct;
          return seg;
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fill="#374151" fontWeight="600">{total}</text>
      </svg>
      <ul className="adm-legend">
        {data.map((d, i) => (
          <li key={i}><span style={{ background: COLORS[i % COLORS.length] }} />{d[labelKey]}: {d[valueKey]}</li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────── stat card ─────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="adm-stat-card" style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <p className="adm-stat-label">{label}</p>
      <strong className="adm-stat-value">{value ?? "—"}</strong>
      {sub && <span className="adm-stat-sub">{sub}</span>}
    </div>
  );
}

/* ─────────────────── user detail drawer ─────────────────── */
function UserDrawer({ user, onClose }) {
  if (!user) return null;
  const subjectData = Object.entries(user.subjects || {}).map(([subject, questions]) => ({ subject, questions }));
  return (
    <div className="adm-drawer-overlay" onClick={onClose}>
      <aside className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="adm-drawer-close" onClick={onClose}>✕</button>
        <h2 className="adm-drawer-name">{user.name}</h2>
        <p className="adm-drawer-email">{user.email} · Class {user.class_level} · {user.medium}</p>

        <div className="adm-drawer-stats">
          <StatCard label="Questions" value={user.total_questions} accent="#6366f1" />
          <StatCard label="Time Spent" value={`${user.estimated_minutes} min`} accent="#10b981" />
          <StatCard label="Accuracy" value={`${user.feedback?.accuracy_score ?? 0}%`} sub={`${user.feedback?.positive ?? 0} up / ${user.feedback?.negative ?? 0} down`} accent="#d95d39" />
          <StatCard label="Quiz Score" value={`${user.quiz?.avg_quiz_score ?? 0}%`} sub={`${user.quiz?.quizzes_completed ?? 0}/${user.quiz?.quizzes_started ?? 0} completed`} accent="#2563eb" />
          <StatCard label="Improvement" value={`${user.quiz?.improvement ?? 0}%`} sub={`Latest: ${user.quiz?.latest_quiz_score ?? 0}%`} accent="#126b52" />
          <StatCard label="Last Active" value={user.last_active ? new Date(user.last_active).toLocaleDateString("en-IN") : "Never"} accent="#f59e0b" />
          <StatCard label="Joined" value={user.joined ? new Date(user.joined).toLocaleDateString("en-IN") : "—"} accent="#3b82f6" />
        </div>

        <h3 className="adm-section-title">Subject-wise Questions</h3>
        <BarChart data={subjectData} labelKey="subject" valueKey="questions" color="#6366f1" />

        {user.weak_topics?.length > 0 && (
          <>
            <h3 className="adm-section-title">Weak Topics</h3>
            <ul className="adm-tag-list">
              {user.weak_topics.map((t, i) => <li key={i} className="adm-tag adm-tag-red">{t}</li>)}
            </ul>
          </>
        )}

        {user.recent_questions?.length > 0 && (
          <>
            <h3 className="adm-section-title">Recent Questions</h3>
            <ol className="adm-q-list">
              {user.recent_questions.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </>
        )}
      </aside>
    </div>
  );
}

/* ─────────────────── main page ─────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [topSubjects, setTopSubjects] = useState([]);
  const [sourceMix, setSourceMix] = useState([]);
  const [feedbackMix, setFeedbackMix] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [quizSubjectPerformance, setQuizSubjectPerformance] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("total_questions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // training export state
  const [exportMinHits, setExportMinHits] = useState(1);
  const [exportExcludeWeak, setExportExcludeWeak] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [dash, userList] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/users"),
        ]);
        setSummary(dash.data.summary);
        setTopSubjects(dash.data.top_subjects || []);
        setSourceMix(dash.data.answer_source_mix || []);
        setFeedbackMix(dash.data.feedback_mix || []);
        setDailyActivity(dash.data.daily_activity || []);
        setQuizSubjectPerformance(dash.data.summary?.quiz_subject_performance || []);
        setUsers(userList.data.users || []);
      } catch (err) {
        if (err?.response?.status === 403) {
          setError("Access denied. Admin only.");
        } else {
          setError("Failed to load admin data.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleExport() {
    setExporting(true);
    setExportResult(null);
    setExportError("");
    try {
      const resp = await api.post(
        `/admin/export-training-data?min_hits=${exportMinHits}&exclude_weak=${exportExcludeWeak}`
      );
      setExportResult(resp.data);
    } catch (err) {
      setExportError(err?.response?.data?.detail || "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function handleStudentMetricsExport() {
    const response = await api.get("/admin/export-student-metrics", { responseType: "blob" });
    const downloadUrl = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
    const link = document.createElement("a");
    const disposition = response.headers["content-disposition"] || "";
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "vidyaai_student_metrics.csv";
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  const filtered = users
    .filter((u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const getValue = (user) => sortKey === "accuracy_score" ? (user.feedback?.accuracy_score ?? 0) : (user[sortKey] ?? 0);
      if (sortKey === "avg_quiz_score") return (b.quiz?.avg_quiz_score ?? 0) - (a.quiz?.avg_quiz_score ?? 0);
      if (sortKey === "improvement") return (b.quiz?.improvement ?? 0) - (a.quiz?.improvement ?? 0);
      return getValue(b) - getValue(a);
    });

  if (loading) return <div className="adm-loading">Loading admin data...</div>;
  if (error) return <div className="adm-error">{error} <button onClick={() => navigate("/dashboard")}>← Back</button></div>;

  return (
    <div className="adm-shell">
      <header className="adm-header">
        <div>
          <h1 className="adm-title">VidyaAI Admin Dashboard</h1>
          <p className="adm-subtitle">Real-time usage analytics for all registered students</p>
        </div>
        <div className="adm-header-actions">
          <button className="adm-export-btn" onClick={handleStudentMetricsExport}>Export Excel CSV</button>
          <button className="adm-back-btn" onClick={() => navigate("/dashboard")}>← Student View</button>
        </div>
      </header>

      {/* ── Summary KPIs ── */}
      <section className="adm-kpis">
        <StatCard label="Total Users" value={summary?.total_users} accent="#6366f1" />
        <StatCard label="Total Questions" value={summary?.total_questions} sub={`24h: ${summary?.questions_24h}`} accent="#10b981" />
        <StatCard label="Active Users (24h)" value={summary?.active_users_24h} sub={`Avg Q/user: ${summary?.avg_questions_per_user}`} accent="#f59e0b" />
        <StatCard label="Study Time (est.)" value={`${summary?.estimated_minutes_total} min`} sub="Across all users" accent="#3b82f6" />
        <StatCard label="Cache Hits" value={summary?.cache_hits_total} sub={`${summary?.cache_entries} unique Qs cached`} accent="#8b5cf6" />
        <StatCard label="Retention Rate" value={`${summary?.retention_rate ?? 0}%`} sub={`${summary?.retained_users ?? 0} weekly active users`} accent="#126b52" />
        <StatCard label="Engagement Rate" value={summary?.engagement_rate ?? 0} sub="Avg questions/study session" accent="#2563eb" />
        <StatCard label="Accuracy Score" value={`${summary?.accuracy_score ?? 0}%`} sub={`${summary?.thumbs_up ?? 0} up / ${summary?.thumbs_down ?? 0} down`} accent="#d95d39" />
        <StatCard label="DAU / WAU" value={`${summary?.dau ?? 0} / ${summary?.wau ?? 0}`} sub={`${summary?.dau_wau_ratio ?? 0}% stickiness`} accent="#c07616" />
        <StatCard label="Study Sessions" value={summary?.study_sessions ?? 0} sub="30 min inactivity split" accent="#0f8c6b" />
        <StatCard label="Quizzes Completed" value={summary?.quizzes_completed ?? 0} sub={`${summary?.quiz_completion_rate ?? 0}% completion`} accent="#2563eb" />
        <StatCard label="Avg Quiz Score" value={`${summary?.avg_quiz_score ?? 0}%`} sub={`${summary?.avg_improvement ?? 0}% avg improvement`} accent="#126b52" />
        <StatCard label="Skipped Quizzes" value={summary?.quizzes_skipped ?? 0} sub={`${summary?.quiz_skip_rate ?? 0}% skip rate`} accent="#d95d39" />
      </section>

      {/* ── Charts row ── */}
      <section className="adm-charts-row">
        <div className="adm-chart-card">
          <h3>Questions by Subject</h3>
          <BarChart data={topSubjects} labelKey="subject" valueKey="questions" color="#6366f1" />
        </div>
        <div className="adm-chart-card">
          <h3>Answer Source Mix</h3>
          <DonutChart data={sourceMix} labelKey="source" valueKey="count" />
        </div>
        <div className="adm-chart-card">
          <h3>Student Activity: Questions / Active Users</h3>
          <GroupedBarChart data={dailyActivity} />
          <div className="adm-chart-note"><span className="adm-dot adm-dot-green" /> Questions <span className="adm-dot adm-dot-blue" /> Active users</div>
        </div>
        <div className="adm-chart-card">
          <h3>Feedback Accuracy Pie</h3>
          <DonutChart data={feedbackMix} labelKey="label" valueKey="count" />
        </div>
        <div className="adm-chart-card">
          <h3>Quiz Score by Subject</h3>
          <BarChart data={quizSubjectPerformance} labelKey="subject" valueKey="avg_score" color="#126b52" />
        </div>
      </section>

      {/* ── User table ── */}
      <section className="adm-users-section">
        <div className="adm-users-toolbar">
          <h3>All Users ({filtered.length})</h3>
          <div className="adm-toolbar-controls">
            <input
              className="adm-search"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="adm-sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="total_questions">Sort: Most Questions</option>
              <option value="estimated_minutes">Sort: Most Time</option>
              <option value="accuracy_score">Sort: Accuracy Score</option>
              <option value="avg_quiz_score">Sort: Quiz Score</option>
              <option value="improvement">Sort: Improvement</option>
            </select>
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Class</th>
                <th>Questions</th>
                <th>Time (min)</th>
                <th>Subjects</th>
                <th>Weak Topics</th>
                <th>Accuracy</th>
                <th>Quiz</th>
                <th>Improvement</th>
                <th>Last Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const subjectList = Object.keys(u.subjects || {}).join(", ") || "—";
                return (
                  <tr key={u.id} className="adm-table-row">
                    <td className="adm-td-muted">{i + 1}</td>
                    <td><strong>{u.name}</strong></td>
                    <td className="adm-td-muted">{u.email}</td>
                    <td>{u.class_level}</td>
                    <td>
                      <span className="adm-badge adm-badge-blue">{u.total_questions}</span>
                    </td>
                    <td>
                      <span className="adm-badge adm-badge-green">{u.estimated_minutes}</span>
                    </td>
                    <td className="adm-td-muted">{subjectList}</td>
                    <td>
                      {u.weak_topics?.length > 0
                        ? <span className="adm-badge adm-badge-red">{u.weak_topics.length} weak</span>
                        : <span className="adm-td-muted">—</span>}
                    </td>
                    <td>
                      <span className="adm-badge adm-badge-amber">{u.feedback?.accuracy_score ?? 0}%</span>
                    </td>
                    <td>
                      <span className="adm-badge adm-badge-blue">{u.quiz?.avg_quiz_score ?? 0}%</span>
                    </td>
                    <td>
                      <span className={`adm-badge ${(u.quiz?.improvement ?? 0) >= 0 ? "adm-badge-green" : "adm-badge-red"}`}>{u.quiz?.improvement ?? 0}%</span>
                    </td>
                    <td className="adm-td-muted">
                      {u.last_active ? new Date(u.last_active).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td>
                      <button className="adm-view-btn" onClick={() => setSelectedUser(u)}>View</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="13" style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Training Data Export ── */}
      <section className="adm-export-section">
        <div className="adm-export-header">
          <div>
            <h3>Export Training Data</h3>
            <p>Pull live Q&amp;A from the database → <code>training_data/train.jsonl</code> + <code>test.jsonl</code> for fine-tuning.</p>
          </div>
        </div>

        <div className="adm-export-controls">
          <label className="adm-export-label">
            Min. cache hits
            <input
              type="number"
              min={1}
              max={100}
              value={exportMinHits}
              onChange={(e) => setExportMinHits(Number(e.target.value))}
              className="adm-export-input"
            />
            <span className="adm-export-hint">Only export Q&amp;As used ≥ this many times (higher = more validated)</span>
          </label>

          <label className="adm-export-label adm-export-checkbox">
            <input
              type="checkbox"
              checked={exportExcludeWeak}
              onChange={(e) => setExportExcludeWeak(e.target.checked)}
            />
            Exclude subjects flagged as weak (single-hit answers in weak-topic subjects)
          </label>

          <button
            className="adm-export-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Export to train.jsonl"}
          </button>
        </div>

        {exportError && (
          <div className="adm-export-error">{exportError}</div>
        )}

        {exportResult && (
          <div className={`adm-export-result ${exportResult.status === "nothing_new" ? "adm-export-result-warn" : "adm-export-result-ok"}`}>
            {exportResult.status === "nothing_new" ? (
              <p>All {exportResult.total_in_cache} cached Q&amp;As are already exported — nothing new.</p>
            ) : (
              <>
                <p><strong>Export complete.</strong></p>
                <ul>
                  <li>Total in qa_cache: <strong>{exportResult.total_in_cache}</strong></li>
                  <li>Already exported: <strong>{exportResult.already_exported}</strong></li>
                  <li>New records added: <strong>{exportResult.new_records}</strong>
                    &nbsp;(train: <strong>{exportResult.train_added}</strong>, test: <strong>{exportResult.test_added}</strong>)
                  </li>
                  <li>Saved to: <code>training_data/train.jsonl</code> + <code>test.jsonl</code></li>
                </ul>
                <p className="adm-export-next">Next: run <code>python -m training.fine_tune_qlora</code> to start QLoRA training.</p>
              </>
            )}
          </div>
        )}
      </section>

      {selectedUser && <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}
