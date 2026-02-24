import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti"; // Install this: npm install canvas-confetti

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    // 🎊 Trigger celebration confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#ffffff']
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <CheckCircle2 size={40} />
          </div>

          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 mb-2">
            Payment Secured
          </h1>
          <p className="text-slate-500 font-medium mb-8">
            Your terminal has been upgraded to <span className="text-blue-600 font-bold">Attendly Pro</span>. Geo-Guard is now active.
          </p>

          <div className="space-y-3 mb-10">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <ShieldCheck className="text-blue-600" size={20} />
              <span className="text-xs font-black uppercase text-slate-700">Geo-Fencing Enabled</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Crown className="text-amber-500" size={20} />
              <span className="text-xs font-black uppercase text-slate-700">Priority Support Active</span>
            </div>
          </div>

          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            Enter Pro Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}