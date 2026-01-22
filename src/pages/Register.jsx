import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, Users, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite"); // Captures the Admin UID if present

  const [role, setRole] = useState(inviteId ? "staff" : "admin");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 🟢 Store User in Firestore
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: formData.email,
        displayName: formData.fullName,
        role: role,
        businessId: role === "staff" ? inviteId : null, // Links staff to admin
        createdAt: new Date(),
      });

      toast.success("Account Created!");
      
      // Redirect based on role
      if (role === "admin") {
        navigate("/setup-business");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black text-slate-800 text-center mb-2">Join Attendly</h2>
        <p className="text-slate-400 text-center text-sm font-medium mb-8">Start tracking with precision.</p>

        {/* ROLE SWITCHER - Only show if no invite link is present */}
        {!inviteId && (
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button 
              onClick={() => setRole("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${role === 'admin' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              <Briefcase size={14} /> Admin
            </button>
            <button 
              onClick={() => setRole("staff")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${role === 'staff' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              <Users size={14} /> Staff
            </button>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input 
            type="text" placeholder="Full Name" required
            className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          />
          <input 
            type="email" placeholder="Email Address" required
            className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          <button 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}