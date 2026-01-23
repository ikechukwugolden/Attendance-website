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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activePanel, setActivePanel] = useState("email");

  // 🟢 SMART REDIRECT LOGIC
  // This ensures that even if an Admin logs in from a new device, 
  // they are sent to the right place based on their setup status.
  const handleSmartRedirect = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // If they are an admin but haven't finished setup, send them to calibrate
        if (userData.role === "admin" && !userData.hasCompletedSetup) {
          navigate("/setup-business");
        } else {
          navigate("/dashboard");
        }
      } else {
        // If no document exists (like a first-time Google user), send to setup
        navigate("/setup-business");
      }
    } catch (err) {
      navigate("/dashboard");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await handleSmartRedirect(res.user);
      toast.success("Authentication Successful");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
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
      toast.error("Google sign-in failed.");
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
            <span className="font-bold text-xl tracking-tight text-slate-900">Attendly</span>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium italic">Secure terminal access.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
            <button 
              onClick={() => setActivePanel("email")} 
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${activePanel === 'email' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >EMAIL</button>
            <button 
              onClick={() => setActivePanel("social")} 
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${activePanel === 'social' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >SOCIAL</button>
          </div>

          {activePanel === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-700" 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <div className="relative">
                <input 
                  type={isPasswordVisible ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-700" 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                  className="absolute right-5 top-4 text-slate-400 text-[10px] font-black uppercase tracking-widest"
                >
                  {isPasswordVisible ? "HIDE" : "SHOW"}
                </button>
              </div>

              <div className="flex justify-between items-center px-1">
                <Link to="/register" className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest">Create Station</Link>
                <button type="button" className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Help?</button>
              </div>

              <button 
                disabled={isLoading} 
                className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl disabled:opacity-50 uppercase text-xs tracking-[0.2em]"
              >
                {isLoading ? "Verifying..." : "Sign In"}
              </button>
            </form>
          ) : (
            <button 
              onClick={handleGoogleLogin} 
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-blue-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>
          )}
        </div>

        {/* RIGHT: DECORATIVE SIDE */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-900/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80" 
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
            alt="Office"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[3rem] max-w-sm">
              <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Authorized Access</h3>
              <div className="w-12 h-1 bg-blue-400 mb-6 mx-auto rounded-full"></div>
              <p className="text-blue-100 text-xs font-medium leading-relaxed uppercase tracking-[0.2em] opacity-80">
                Precision Workforce Tracking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}