import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages & Components
import LandingPage from "./pages/LandingPage"; 
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
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900">
    <div className="animate-spin rounded-[1.5rem] h-12 w-12 border-4 border-slate-700 border-t-blue-600 shadow-xl"></div>
    <p className="mt-8 text-white font-black uppercase text-[10px] tracking-[0.3em]">Securing Connection</p>
  </div>
);

// Improved Protected Route
function ProtectedRoute({ children }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (userData && userData.hasCompletedSetup === false) {
    return <Navigate to="/setup-business" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* 🏠 The "Smart" Redirect (Root) */}
          <Route path="/" element={<RootRedirect />} />

          {/* 🚀 Dedicated Landing Page Route (Bypasses Redirects) */}
          <Route path="/welcome" element={<LandingPage />} />

          {/* Public Auth Pages */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Public Scan Page (Terminal) */}
          <Route path="/scan" element={<ScanPage />} />

          {/* Admin Setup Flow */}
          <Route path="/setup-business" element={<AuthOnlyRoute><SetupBusiness /></AuthOnlyRoute>} />

          {/* Core App Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          <Route path="/qr-terminal" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Catch-all: Redirect unknown to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Logic components
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function AuthOnlyRoute({ children }) {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (userData?.hasCompletedSetup) return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}