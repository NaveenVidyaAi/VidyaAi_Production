import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PublicLanguageProvider } from "./contexts/PublicLanguageContext";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const AIUse = lazy(() => import("./pages/AIUse"));
const Home = lazy(() => import("./pages/Home"));
const TeacherTools = lazy(() => import("./pages/TeacherTools"));
const GameZone = lazy(() => import("./pages/GameZone"));

function AnimatedRoutes() {
  const location = useLocation();
  return (
      <div key={location.pathname} className="route-motion-frame">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/game-zone" element={<GameZone />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
          <Route path="/ai-use" element={<AIUse />} />
          <Route path="/cgbse-class-10-model-papers" element={<Navigate to="/login" replace />} />
          <Route path="/cgbse-teacher-tools" element={<TeacherTools />} />
          <Route path="/ai-policy" element={<Navigate to="/ai-use" replace />} />
        </Routes>
      </div>
  );
}

function App() {
  return (
    <PublicLanguageProvider>
      <Suspense fallback={<div className="route-loader" role="status"><span /><strong>VidyaAI</strong><small>Loading your workspace…</small></div>}>
        <AnimatedRoutes />
      </Suspense>
    </PublicLanguageProvider>
  );
}

export default App;
