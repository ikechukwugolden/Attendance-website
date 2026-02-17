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

// Improved Protected Route
function ProtectedRoute({ children }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  
  // If not logged in, go to login
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // If logged in but setup is missing, forced redirect to setup
  if (userData && userData.hasCompletedSetup === false) {
    return <Navigate to="/setup-business" replace />;
  }

  // Wrap the page in the Layout (Sidebar/Header)
  return <Layout>{children}</Layout>;
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

          {/* Public Scan Page (Terminal) */}
          <Route path="/scan" element={<ScanPage />} />

          {/* Admin Setup Flow */}
          <Route path="/setup-business" element={<AuthOnlyRoute><SetupBusiness /></AuthOnlyRoute>} />

          {/* Core App Routes - All Wrapped in ProtectedRoute */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          {/* 🟢 NAVIGATION FIX: If this points to Dashboard, it feels like it didn't move. 
              Point it to Settings or a dedicated Terminal View instead */}
          <Route path="/qr-terminal" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Root Handling */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Logic components to keep code clean
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
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/register" replace />;
}