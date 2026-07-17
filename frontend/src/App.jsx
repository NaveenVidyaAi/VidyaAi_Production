import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));

function RoleHome() {
  const hasToken = Boolean(localStorage.getItem("vidyaai_token"));
  const role = localStorage.getItem("vidyaai_role");
  if (!hasToken) return <Navigate to="/login" replace />;
  return <Navigate to={role === "teacher" ? "/teacher" : "/dashboard"} replace />;
}

function App() {
  return (
    <Suspense fallback={<div className="route-loader" role="status"><span /><strong>VidyaAI</strong><small>Loading your workspace…</small></div>}>
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Routes>
    </Suspense>
  );
}

export default App;
