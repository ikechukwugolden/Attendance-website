import { Users, Clock, ShieldCheck, BarChart3, MapPin, Zap, CheckCircle, Activity } from "lucide-react";
import { useState, useEffect } from "react";

export default function ModernLoader({ title = "Writing Attendance", subtitle = "Syncing real-time data", showFeatures = true }) {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Users size={24} />,
      title: "Real-Time Tracking",
      description: "Monitor employee attendance instantly with live updates"
    },
    {
      icon: <MapPin size={24} />,
      title: "Geo-Verification",
      description: "Prevent buddy punching with location-based verification"
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Smart Analytics",
      description: "Comprehensive reports and attendance insights"
    },
    {
      icon: <Zap size={24} />,
      title: "Instant QR Scanning",
      description: "One-tap attendance confirmation with QR codes"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Animated Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="relative w-28 h-28">
              {/* Outer rotating ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-400 animate-spin"
                style={{ animationDuration: "2s" }}
              ></div>

              {/* Middle pulsing ring */}
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-500 border-l-purple-400 animate-spin"
                style={{ animationDuration: "3s", animationDirection: "reverse" }}
              ></div>

              {/* Inner core */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <div className="animate-pulse">
                  <Users className="text-white" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Animated text */}
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            <span className="inline-block animate-pulse">✓</span> {title}
          </h2>
          <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">{subtitle}</p>
        </div>

        {/* Stats Cards - Animated Progress */}
        <div className="space-y-3 mb-12">
          <div className="flex gap-3">
            {/* Stat 1: Loading users */}
            <div
              className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 animate-fade-in"
              style={{ animationDelay: "0s", animationDuration: "0.8s" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Users</span>
              </div>
              <p className="text-2xl font-black text-emerald-400">--</p>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>

            {/* Stat 2: Loading timestamps */}
            <div
              className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 animate-fade-in"
              style={{ animationDelay: "0.1s", animationDuration: "0.8s" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logs Today</span>
              </div>
              <p className="text-2xl font-black text-blue-400">--</p>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full animate-pulse w-2/3"></div>
              </div>
            </div>
          </div>

          {/* Stat 3: Check-in status */}
          <div
            className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-4 border border-purple-400/20 animate-fade-in"
            style={{ animationDelay: "0.2s", animationDuration: "0.8s" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Processing</span>
                  <span className="text-sm font-black text-white">Initializing System</span>
                </div>
              </div>
              <div className="text-right">
                <div className="w-8 h-8 rounded-lg border-2 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div
          className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 space-y-6 animate-fade-in"
          style={{ animationDelay: "0.3s", animationDuration: "0.8s" }}
        >
          <div>
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Today's Summary</h3>

            <div className="space-y-3">
              {/* Summary Row 1 */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs font-semibold text-slate-300">Check-ins</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Summary Row 2 */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-xs font-semibold text-slate-300">Gate Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Summary Row 3 */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                  <span className="text-xs font-semibold text-slate-300">Verifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.15s" }}></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.3s" }}></span>
            </div>
            <p className="text-[10px] text-center text-slate-500 font-semibold uppercase tracking-wide">Loading attendance gateway...</p>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in forwards ease-out;
        }
      `}</style>
    </div>
  );
}
