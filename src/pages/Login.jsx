import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activePanel, setActivePanel] = useState("email"); // email or social

  useEffect(() => {
    // Add floating animation class to body for particles
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    setActivePanel("social");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (error) {
      console.error("Google Sign-In Error:", error.message);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Email login:", { email, password });
      // Add your actual email/password login logic here
      // navigate("/dashboard");
    } catch (error) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    setActivePanel("social");
    console.log("Microsoft login");
  };

  return (
    <>
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.3 + Math.random() * 0.4
            }}
          />
        ))}
      </div>

      <div className="min-h-screen flex relative">
        {/* Left Panel - Login Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
          <div className="mx-auto w-full max-w-md animate-fade-in">
            {/* Brand Logo with Animation */}
            <div className="mb-10">
              <div className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-xl tracking-tighter">AT</span>
                </div>
                <div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    AttendancePro
                  </span>
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Enterprise Time Tracking Platform
                  </p>
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-gradient-to-r from-blue-500 to-transparent"></div>
                <p className="text-gray-600">Sign in to your account to continue</p>
              </div>
            </div>

            {/* Login Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <button
                onClick={() => setActivePanel("email")}
                className={`flex-1 py-3 text-sm font-medium transition-all duration-300 relative ${
                  activePanel === "email" 
                    ? "text-blue-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Email Login
                {activePanel === "email" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActivePanel("social")}
                className={`flex-1 py-3 text-sm font-medium transition-all duration-300 relative ${
                  activePanel === "social" 
                    ? "text-blue-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Social Login
                {activePanel === "social" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                )}
              </button>
            </div>

            {/* Email/Password Form */}
            <form 
              onSubmit={handleEmailLogin} 
              className={`space-y-6 transition-all duration-500 ${
                activePanel === "email" ? "opacity-100 visible" : "opacity-0 invisible h-0 absolute"
              }`}
            >
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                  <span>Email address</span>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Secure
                  </span>
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 group-hover:border-blue-400"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <a 
                    href="#" 
                    className="text-sm text-blue-600 hover:text-blue-500 hover:underline transition-colors flex items-center gap-1 group"
                  >
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pl-11 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 group-hover:border-blue-400"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isPasswordVisible ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-80 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </form>

            {/* Social Login Buttons */}
            <div className={`space-y-4 transition-all duration-500 ${
              activePanel === "social" ? "opacity-100 visible" : "opacity-0 invisible h-0 absolute"
            }`}>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-300 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                {isLoading ? (
                  <div className="relative flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-700 font-medium">Signing in...</span>
                  </div>
                ) : (
                  <>
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="w-5 h-5 relative z-10"
                    />
                    <span className="text-gray-700 font-medium relative z-10">Continue with Google</span>
                    <svg className="w-4 h-4 text-gray-400 ml-auto relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>

              <button
                onClick={handleMicrosoftLogin}
                className="w-full group relative flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-300 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                  <path fill="#0078d4" d="M0 0h24v24H0z" />
                  <path fill="#fff" d="M11.5 3v8.5H3v-5c0-1.93 1.57-3.5 3.5-3.5h5z" />
                  <path fill="#fff" d="M11.5 11.5V21h-5c-1.93 0-3.5-1.57-3.5-3.5v-6h8.5z" />
                  <path fill="#fff" d="M21 11.5V16c0 1.93-1.57 3.5-3.5 3.5h-5v-8.5H21z" />
                  <path fill="#fff" d="M21 3h-5v8.5H21V6.5C21 4.57 19.43 3 17.5 3z" />
                </svg>
                <span className="text-gray-700 font-medium relative z-10">Continue with Microsoft</span>
                <svg className="w-4 h-4 text-gray-400 ml-auto relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              {/* Additional Auth Options */}
              <div className="relative pt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-gray-500 text-sm">More options</span>
                </div>
              </div>

              <button className="w-full group flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all duration-300 bg-white">
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="text-gray-700 font-medium">Single Sign-On (SSO)</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 animate-shake p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Authentication Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security & Footer */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>SSL Secured</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>GDPR Compliant</span>
                </div>
              </div>
              <p className="text-center text-gray-500 text-sm">
                Don't have an account?{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500 font-medium hover:underline transition-colors group">
                  Contact administrator
                  <svg className="w-4 h-4 inline ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </p>
              <p className="text-center text-gray-400 text-xs mt-4">
                © {new Date().getFullYear()} AttendancePro v2.4.1 • All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Enhanced Illustration */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Animated Background Particles */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${12 + Math.random() * 8}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>

            {/* Main Content Container */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="relative w-full max-w-2xl">
                {/* Glowing Orbs */}
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                
                {/* Glassmorphism Card */}
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-white/20">
                  {/* Animated Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-400/20 rounded-xl flex items-center justify-center border border-white/10">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white">Real-time Dashboard</h3>
                    </div>
                    <p className="text-white/70 text-sm">Live workforce analytics and insights</p>
                  </div>

                  {/* Animated Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                      { value: "98%", label: "Accuracy", color: "from-emerald-500 to-emerald-400" },
                      { value: "24/7", label: "Tracking", color: "from-blue-500 to-blue-400" },
                      { value: "1K+", label: "Employees", color: "from-violet-500 to-violet-400" }
                    ].map((stat, index) => (
                      <div 
                        key={index}
                        className={`bg-gradient-to-br ${stat.color}/20 to-transparent border border-white/10 rounded-xl p-4 text-center backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
                      >
                        <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                          {stat.value}
                        </div>
                        <div className="text-sm text-white/80 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Animated Office Visualization */}
                  <div className="relative h-64 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl overflow-hidden mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Animated Building */}
                      <div className="relative">
                        <div className="w-56 h-48 bg-gradient-to-b from-white/20 to-white/5 rounded-t-2xl border border-white/10 backdrop-blur-sm">
                          {/* Animated Windows */}
                          <div className="grid grid-cols-4 gap-3 p-5">
                            {[...Array(12)].map((_, i) => (
                              <div 
                                key={i}
                                className="w-5 h-7 bg-blue-400/40 rounded animate-pulse"
                                style={{ animationDelay: `${i * 0.2}s` }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Animated People */}
                        <div className="absolute -bottom-6 left-10 flex items-end space-x-5">
                          {[
                            { height: 20, delay: 0 },
                            { height: 28, delay: 0.3 },
                            { height: 24, delay: 0.6 },
                            { height: 18, delay: 0.9 }
                          ].map((person, i) => (
                            <div 
                              key={i}
                              className="w-10 h-12 bg-gradient-to-t from-blue-400/60 to-blue-300/40 rounded-t-lg animate-bounce"
                              style={{ 
                                animationDelay: `${person.delay}s`,
                                height: `${person.height}px`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rotating Testimonials */}
                  <div className="text-center">
                    <div className="inline-block bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full px-6 py-3 border border-white/10">
                      <p className="text-white text-lg font-medium italic">
                        "Streamline your workforce management"
                      </p>
                      <p className="text-white/60 text-sm mt-2">
                        Trusted by Fortune 500 companies
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Security Badges */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                  {['ISO 27001', 'SOC 2', 'GDPR'].map((badge, i) => (
                    <div 
                      key={i}
                      className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-xs text-white/80 hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Add these styles to your index.css */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .login-page {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
        }
      `}</style>
    </>
  );
}