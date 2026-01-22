import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages & Components (Keep your existing imports...)
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

// 1. PUBLIC ROUTE FIX
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  // If logged in, send them to dashboard
  return !user ? children : <Navigate to="/dashboard" replace />;
}

// 2. PROTECTED ROUTE FIX (The logic you were missing)
function ProtectedRoute({ children }) {
  const { user, userData, loading } = useAuth(); // 🟢 Added userData here
  const location = useLocation();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // 🟢 CHECK FIRESTORE DATA: If setup isn't finished, force them to setup
  if (userData && !userData.hasCompletedSetup) {
    return <Navigate to="/setup-business" replace />;
  }

  return <Layout>{children}</Layout>;
}

// 3. AUTH ONLY ROUTE FIX (For the Setup page itself)
function AuthOnlyRoute({ children }) {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  
  // If they've ALREADY finished setup and try to go to /setup-business, 
  // send them back to the dashboard.
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
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          
          {/* Setup & Scan */}
          <Route path="/setup-business" element={<AuthOnlyRoute><SetupBusiness /></AuthOnlyRoute>} />
          <Route path="/scan" element={<AuthOnlyRoute><ScanPage /></AuthOnlyRoute>} />

          {/* Main App */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}