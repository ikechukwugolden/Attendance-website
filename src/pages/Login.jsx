import { auth, googleProvider, db } from "../lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activePanel, setActivePanel] = useState("email");

  // 🟢 SMART REDIRECT LOGIC
  const handleSmartRedirect = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // If they are an admin but haven't set up their business name yet
        if (userData.role === "admin" && !userData.businessName) {
          navigate("/setup-business");
        } else {
          navigate("/dashboard");
        }
      } else {
        // Fallback if document doesn't exist yet
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Redirect error:", err);
      navigate("/dashboard");
    }
  };

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
      const res = await signInWithEmailAndPassword(auth, email, password);
      await handleSmartRedirect(res.user);
    } catch (err) {
      setError("Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await handleSmartRedirect(res.user);
    } catch (err) {
      setError("Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="flex w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700 border border-slate-100">
        
        {/* LEFT: FORM SIDE */}
        <div className="w-full lg:w-[45%] p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-xl tracking-tight">Attendly</span>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">Log in to manage your station.</p>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100">{error}</div>}
          {message && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100">{message}</div>}

          <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
            <button onClick={() => setActivePanel("email")} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${activePanel === 'email' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>EMAIL</button>
            <button onClick={() => setActivePanel("social")} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${activePanel === 'social' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>SOCIAL</button>
          </div>

          {activePanel === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <input type="email" placeholder="Email" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-700" onChange={(e) => setEmail(e.target.value)} required />
              <div className="relative">
                <input type={isPasswordVisible ? "text" : "password"} placeholder="Password" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-700" onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute right-5 top-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">{isPasswordVisible ? "HIDE" : "SHOW"}</button>
              </div>
              <div className="flex justify-between items-center px-1">
                <Link to="/register" className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest">Create Account</Link>
                <button type="button" onClick={handleForgotPassword} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Forgot Password?</button>
              </div>
              <button disabled={isLoading} className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl disabled:opacity-50 uppercase text-xs tracking-[0.2em]">
                {isLoading ? "Verifying..." : "Sign In"}
              </button>
            </form>
          ) : (
            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-blue-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>
          )}
        </div>

        {/* RIGHT: IMAGE SIDE */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-900/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Dashboard Background" 
            className="absolute inset-0 w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[3rem] max-w-sm">
              <div className="w-12 h-1 bg-blue-400 mb-6 mx-auto rounded-full"></div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Secure Access</h3>
              <p className="text-blue-100 text-xs font-medium leading-relaxed uppercase tracking-widest opacity-80">
                Authorized Personnel Only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}