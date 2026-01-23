import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages & Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import SetupBusiness from "./pages/SetupBusiness";
import ScanPage from "./pages/ScanPage";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees"; 
import Logs from "./pages/Logs"; 
import Reports from "./pages/Reports"; 
import Settings from "./pages/Settings"; 
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";

const LoadingSpinner = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-[1.5rem] h-12 w-12 border-4 border-slate-200 border-t-blue-600 shadow-xl"></div>
    <p className="mt-8 text-slate-900 font-black uppercase text-[10px] tracking-[0.3em]">Securing Connection</p>
  </div>
);

// 1. PUBLIC ROUTE: If logged in, go to dashboard. If not, show the page (Register/Login).
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

// 2. PROTECTED ROUTE: Requires Auth + Completed Setup
function ProtectedRoute({ children }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/register" state={{ from: location }} replace />;
  
  if (userData && !userData.hasCompletedSetup) {
    return <Navigate to="/setup-business" replace />;
  }

  return <Layout>{children}</Layout>;
}

// 3. AUTH ONLY ROUTE: For the Setup page itself
function AuthOnlyRoute({ children }) {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/register" replace />;
  
  if (userData?.hasCompletedSetup && window.location.pathname === "/setup-business") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public Auth Pages */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          
          {/* Public Scan Page (No Auth required so staff can scan) */}
          <Route path="/scan" element={<ScanPage />} />

          {/* Admin Setup Flow */}
          <Route path="/setup-business" element={<AuthOnlyRoute><SetupBusiness /></AuthOnlyRoute>} />

          {/* Protected Dashboard & Management */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/*  REDIRECTION FIX: Default to Register */}
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}