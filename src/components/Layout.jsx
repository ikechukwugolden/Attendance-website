import { useState, useEffect } from "react";
import { LogOut, LayoutDashboard, Users, Clock, Settings, Menu, X, FileBarChart } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // --- FLOATING PUNCH LOGIC ---
  const handleFloatingPunch = async () => {
    if (!user) return toast.error("Please login first");
    
    setIsPunching(true);
    const loadingToast = toast.loading("Verifying location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const now = new Date();
          const status = now.getHours() >= 9 ? "Late" : "On-Time";

          await addDoc(collection(db, "attendance_logs"), {
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0],
            status: status,
            location: { lat: position.coords.latitude, lng: position.coords.longitude },
            timestamp: serverTimestamp(),
            type: "Check-In"
          });

          toast.success(`Clocked In: ${status}`, { id: loadingToast });
        } catch (error) {
          toast.error("Database error", { id: loadingToast });
        } finally {
          setIsPunching(false);
        }
      },
      () => {
        toast.error("GPS Access Denied", { id: loadingToast });
        setIsPunching(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const getHeaderTitle = (path) => {
    switch (path) {
      case "/dashboard": return "Overview";
      case "/employees": return "Employees";
      case "/logs":      return "Attendance Logs";
      case "/reports":   return "Reports & Analytics";
      case "/settings":  return "Settings";
      default:           return "Attendly";
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
      
      {/* 🚀 FUNCTIONAL FLOATING ATTENDANCE BUTTON */}
      <button 
        onClick={handleFloatingPunch}
        disabled={isPunching}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] group disabled:opacity-80"
      >
        {!isPunching && (
          <span className="absolute inset-0 rounded-2xl bg-blue-400 animate-ping opacity-25"></span>
        )}
        
        <div className={`
          relative flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 
          rounded-2xl shadow-2xl transition-all duration-200 active:scale-95
          ${isPunching ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-blue-500/40 hover:bg-blue-700'}
        `}>
          {isPunching ? (
            <div className="w-6 h-6 border-3 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <>
              <Clock size={28} strokeWidth={2.5} />
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Punch</span>
            </>
          )}

          {/* Tooltip */}
          {!isPunching && (
            <span className="absolute right-24 scale-0 group-hover:scale-100 origin-right transition-all bg-slate-900 text-white text-[10px] font-black py-2 px-4 rounded-xl uppercase tracking-widest whitespace-nowrap">
              Instant Clock-In
            </span>
          )}
        </div>
      </button>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 
        lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="text-xl font-bold text-blue-600 tracking-tight italic">Attendly</div>
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" path="/dashboard" />
          <NavItem icon={<Users size={20}/>} label="Employees" path="/employees" />
          <NavItem icon={<Clock size={20}/>} label="Logs" path="/logs" />
          <NavItem icon={<FileBarChart size={20}/>} label="Reports" path="/reports" />
          <NavItem icon={<Settings size={20}/>} label="Settings" path="/settings" />
        </nav>

        <button onClick={() => auth.signOut()} className="p-4 m-4 flex items-center gap-3 text-red-500 hover:bg-red-50 rounded-xl transition-all group">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Menu size={24} /></button>
            <h1 className="font-bold text-slate-800 text-base md:text-lg tracking-tight">{getHeaderTitle(location.pathname)}</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none tracking-tight">Admin User</p>
              <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs">AD</div>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, path }) {
  const active = useLocation().pathname === path;
  return (
    <Link to={path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
      <span className={active ? "text-white" : "text-slate-400"}>{icon}</span>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </Link>
  );
}