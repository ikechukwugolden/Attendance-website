import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees"; 
import Logs from "./pages/Logs";           
import Reports from "./pages/Reports";     
import Settings from "./pages/Settings"; // Ensure you have this file or use a placeholder

// Components
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";

// Loading Component
const LoadingSpinner = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-gray-500 font-medium tracking-tight">Verifying session...</p>
  </div>
);

// Helper for Guest-only routes (Login)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  // If user is already logged in, send them to dashboard
  return !user ? children : <Navigate to="/dashboard" replace />;
}

// Helper for Authenticated-only routes
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  // If NO user, force redirect to Login
  if (!user) return <Navigate to="/login" replace />;
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* 1. Public Authentication Route */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          {/* 2. Protected App Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* 3. Global Navigation Logic - FIXES THE REDIRECT ISSUE */}
          {/* If path is exactly "/", try to go to dashboard (which will check auth) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* If user hits an unknown page or logs out, go to LOGIN, not dashboard */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}