import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

function RoleHome() {
  const hasToken = Boolean(localStorage.getItem("vidyaai_token"));
  const role = localStorage.getItem("vidyaai_role");
  if (!hasToken) return <Navigate to="/login" replace />;
  return <Navigate to={role === "teacher" ? "/teacher" : "/dashboard"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleHome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
    </Routes>
  );
}

export default App;
