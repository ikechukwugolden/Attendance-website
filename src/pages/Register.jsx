import { useState } from "react";
// Optimized: importing auth, db, and googleProvider from your config
import { auth, db, googleProvider } from "../lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc"; 

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // 🔵 Optimized Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Uses the central provider from your lib/firebase.js
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      
      await setDoc(userRef, {
        uid: user.uid,
        fullName: user.displayName,
        email: user.email,
        role: "admin",
        hasCompletedSetup: false,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast.success("Welcome to Attendly!");
      navigate("/setup-business");
    } catch (error) {
      console.error(error);
      toast.error("Google Sign-In failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      await updateProfile(user, { displayName: formData.fullName });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        role: "admin", 
        hasCompletedSetup: false, 
        createdAt: serverTimestamp(),
      });

      toast.success("Account created! Let's calibrate your station.");
      navigate("/setup-business");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="flex w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* LEFT: FORM SIDE */}
        <div className="w-full lg:w-[45%] p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-xl tracking-tight">Attendly</span>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">Create Admin Account</h2>
          <p className="text-slate-500 text-sm mb-6 font-medium">Start managing your team today.</p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-2xl transition-all mb-6 text-sm shadow-sm"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-400 tracking-widest bg-white px-4">Or use email</div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-700" 
              onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
              required 
            />
            <input 
              type="email" 
              placeholder="Business Email" 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-700" 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="Create Password" 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-700" 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />

            <button 
              disabled={isLoading} 
              className="w-full mt-4 bg-blue-600 hover:bg-slate-900 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl disabled:opacity-50 uppercase text-xs tracking-[0.2em]"
            >
              {isLoading ? "Authenticating..." : "Get Started"}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Already have a station? <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
          </p>
        </div>

        {/* RIGHT: IMAGE SIDE */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-900/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80" 
            className="absolute inset-0 w-full h-full object-cover"
            alt="Business team"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[3rem] max-w-sm">
              <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">One QR. One Team.</h3>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-widest opacity-80 leading-relaxed">
                Automate your attendance flow in minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}