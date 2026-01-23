import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Create User in Firebase Auth
      const { user } = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // 2. Update Auth Profile (Display Name)
      await updateProfile(user, { displayName: formData.fullName });

      // 3. 🟢 THE MOST IMPORTANT PART: Create Firestore Document
      // This tells the app: "This user is an ADMIN who needs to SETUP their business"
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        role: "admin", // Sets them as the boss
        hasCompletedSetup: false, // Triggers the /setup-business page
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
          <p className="text-slate-500 text-sm mb-8 font-medium">Start managing your team today.</p>

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
              {isLoading ? "Creating Station..." : "Get Started"}
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