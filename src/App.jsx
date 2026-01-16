import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";

// Component to prevent logged-in users from accessing the login page
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  // If user is logged in, redirect them to dashboard
  return !user ? children : <Navigate to="/dashboard" replace />;
}

// Protected Route wrapper with Sidebar Layout
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  // If not logged in, force them to login
  if (!user) return <Navigate to="/login" replace />;
  
  return <Layout>{children}</Layout>;
}

// Reusable Loading Spinner
const LoadingSpinner = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route: Only accessible if logged out */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Protected Routes: Require Authentication and use Sidebar Layout */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Placeholder routes for the other sidebar links in your screenshot.
            You can replace 'Dashboard' with specific pages (e.g., Employees.jsx) 
            once you create them.
          */}
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute>
                <Dashboard /> 
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/logs" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Global Navigation Logic */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}