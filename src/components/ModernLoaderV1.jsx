import { Users, Clock, ShieldCheck, BarChart3, MapPin, Zap, CheckCircle, Activity, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function ModernLoaderV1({ progress = null }) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [autoProgress, setAutoProgress] = useState(0);

  // Use passed progress or auto-progress
  const currentProgress = progress !== null ? progress : autoProgress;

  const features = [
    {
      icon: <Users size={32} />,
      title: "Real-Time Tracking",
      description: "Monitor employee attendance instantly with live updates across your organization"
    },
    {
      icon: <MapPin size={32} />,
      title: "Geo-Verification",
      description: "Prevent buddy punching with location-based verification and security checks"
    },
    {
      icon: <BarChart3 size={32} />,
      title: "Smart Analytics",
      description: "Comprehensive reports, insights, and attendance patterns at a glance"
    },
    {
      icon: <Zap size={32} />,
      title: "Instant QR Scanning",
      description: "One-tap attendance confirmation with secure QR codes and devices"
    }
  ];

  const loadingSteps = [
    { label: "Initializing", icon: <Activity size={16} /> },
    { label: "Loading Database", icon: <BarChart3 size={16} /> },
    { label: "Syncing Data", icon: <Users size={16} /> },
    { label: "Finalizing", icon: <CheckCircle size={16} /> }
  ];

  // Auto-progress simulation
  useEffect(() => {
    if (progress !== null) return; // Don't auto-progress if external progress is provided
    
    const interval = setInterval(() => {
      setAutoProgress((prev) => {
        if (prev >= 95) return prev; // Slow down near the end
        return prev + Math.random() * 15;
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, [progress]);

  useEffect(() => {
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(featureInterval);
  }, []);

  useEffect(() => {
    const stepProgress = Math.min(Math.floor(currentProgress / 25), 3);
    setLoadingStep(stepProgress);
  }, [currentProgress]);

  const currentFeature = features[activeFeature];
  const displayProgress = Math.round(currentProgress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Main Content Container */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Loading Animation */}
          <div className="flex flex-col items-center justify-center">
            {/* Version Badge */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full">
              <Sparkles size={14} className="text-blue-400 animate-spin" style={{animationDuration: '2s'}} />
              <span className="text-[11px] font-black text-blue-300 uppercase tracking-widest">Version 1.0</span>
            </div>

            {/* Main Loader */}
            <div className="mb-8">
              <div className="relative w-40 h-40 mx-auto">
                {/* Outer rotating ring */}
                <div
                  className="absolute inset-0 rounded-full border-3 border-transparent border-t-blue-500 border-r-blue-400"
                  style={{
                    animation: "spin 2s linear infinite"
                  }}
                ></div>

                {/* Middle pulsing ring */}
                <div
                  className="absolute inset-3 rounded-full border-2 border-transparent border-b-purple-500 border-l-purple-400"
                  style={{
                    animation: "spin 3s linear infinite reverse"
                  }}
                ></div>

                {/* Inner glowing core */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/50">
                  <div className="animate-pulse">
                    <Users className="text-white" size={48} />
                  </div>
                </div>

                {/* Orbiting dots */}
                <div className="absolute inset-0" style={{animation: "spin 4s linear infinite"}}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400"></div>
                </div>
              </div>
            </div>

            {/* Progress Percentage - Large Display */}
            <div className="mb-6 text-center">
              <div className="inline-block">
                <div className="text-6xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {displayProgress}%
                </div>
              </div>
            </div>

            {/* Main Text */}
            <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tight">
              Attendance Hub
            </h2>
            <p className="text-slate-400 text-sm font-semibold text-center tracking-wide uppercase mb-8">
              Welcome to the new generation of workforce tracking
            </p>

            {/* Full Width Progress Bar */}
            <div className="w-full max-w-sm mb-8">
              <div className="bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${displayProgress}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-2 text-center">
                {displayProgress === 100 ? "Complete!" : loadingSteps[Math.min(Math.floor(displayProgress / 25), 3)].label}
              </p>
            </div>

            {/* Loading Steps */}
            <div className="flex gap-2 mb-6">
              {loadingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-300 ${
                    idx === loadingStep
                      ? "bg-blue-500/30 border-blue-400 text-blue-300"
                      : idx < loadingStep
                      ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-400"
                      : "bg-white/5 border-white/10 text-slate-500"
                  }`}
                >
                  {step.icon}
                  <span className="text-[10px] font-bold uppercase hidden sm:inline">{step.label}</span>
                </div>
              ))}
            </div>

            {/* Bouncing dots */}
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                ></span>
              ))}
            </div>
          </div>

          {/* Right Side - Feature Showcase */}
          <div className="hidden md:flex flex-col gap-6">
            {/* Current Feature Highlight */}
            <div
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 transition-all duration-500 min-h-[280px]"
              key={activeFeature}
              style={{
                animation: "fadeIn 0.5s ease-in-out"
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/30">
                  <div className="text-blue-300">{currentFeature.icon}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feature</span>
                  <p className="text-sm font-black text-white">{activeFeature + 1}/4</p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">{currentFeature.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">{currentFeature.description}</p>
              
              {/* Feature indicator dots */}
              <div className="flex gap-2">
                {features.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === activeFeature ? "bg-blue-500 w-8" : "bg-white/20 w-2"
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Info Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Loading</div>
                <div className="text-2xl font-black text-white">{displayProgress}%</div>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Status</div>
                <div className="text-sm font-bold text-white">{loadingSteps[Math.min(Math.floor(displayProgress / 25), 3)].label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
            🚀 Powered by Next-Gen Attendance System
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
