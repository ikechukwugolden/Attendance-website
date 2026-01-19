import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activePanel, setActivePanel] = useState("email");

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Reset link sent to your inbox.");
      setError("");
    } catch (err) {
      setError("Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      {/* Container Card with Image on Right */}
      <div className="flex w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        
        {/* LEFT: FORM SIDE (Reduced Width) */}
        <div className="w-full lg:w-[45%] p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-xl tracking-tight">AttendancePro</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-8">Manage your workforce with ease.</p>

          {/* Status Messages */}
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">{error}</div>}
          {message && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100">{message}</div>}

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button onClick={() => setActivePanel("email")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activePanel === 'email' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>EMAIL</button>
            <button onClick={() => setActivePanel("social")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activePanel === 'social' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>SOCIAL</button>
          </div>

          {activePanel === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" onChange={(e) => setEmail(e.target.value)} required />
              <div className="relative">
                <input type={isPasswordVisible ? "text" : "password"} placeholder="Password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute right-4 top-3 text-slate-400 text-xs font-bold">{isPasswordVisible ? "HIDE" : "SHOW"}</button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-blue-600 hover:underline">FORGOT PASSWORD?</button>
              </div>
              <button disabled={isLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50">
                {isLoading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          ) : (
            <button onClick={() => signInWithPopup(auth, googleProvider).then(() => navigate("/dashboard"))} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 py-3 rounded-xl font-semibold transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </button>
          )}
        </div>

        {/* RIGHT: IMAGE SIDE */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-900/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Dashboard Background" 
            className="absolute inset-0 w-full h-full object-cover scale-110"
          />
          
          {/* Glass Card Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl max-w-sm">
              <div className="w-16 h-1 bg-blue-400 mb-6 mx-auto rounded-full"></div>
              <h3 className="text-2xl font-bold text-white mb-4">Precision Attendance</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Streamline your payroll and employee tracking with our ISO-certified cloud infrastructure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}