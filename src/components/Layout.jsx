import { useState, useEffect } from "react";
import { LogOut, LayoutDashboard, Users, Clock, Settings, Menu, X, FileBarChart, ShieldCheck } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { calculateAttendanceStatus } from "../services/shiftService"; 
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // --- REFINED FLOATING PUNCH LOGIC ---
  const handleFloatingPunch = async () => {
    if (!user) return toast.error("Please login first");
    
    setIsPunching(true);
    const loadingToast = toast.loading("Verifying location & status...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // 1. Fetch this business's specific shift settings
          // (Assumes user.businessId or similar is available in context)
          const adminRef = doc(db, "users", user.uid); 
          const adminSnap = await getDoc(adminRef);
          const settings = adminSnap.exists() ? adminSnap.data().settings : { shiftStart: "09:00", gracePeriod: 5 };

          // 2. Use shared service for status
          const { status, minutesLate } = calculateAttendanceStatus(
            new Date(), 
            settings.shiftStart, 
            settings.gracePeriod
          );

          await addDoc(collection(db, "attendance_logs"), {
            businessId: user.uid, // Ensuring multi-tenant ownership
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0],
            status: status,
            minutesLate: minutesLate,
            location: { lat: position.coords.latitude, lng: position.coords.longitude },
            timestamp: serverTimestamp(),
            type: "Check-In"
          });

          toast.success(`Success! Marked as ${status}`, { id: loadingToast });
        } catch (error) {
          toast.error("Process failed. Please try again.", { id: loadingToast });
        } finally {
          setIsPunching(false);
        }
      },
      () => {
        toast.error("GPS Access Denied. Location is required.", { id: loadingToast });
        setIsPunching(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const getHeaderTitle = (path) => {
    const titles = {
      "/dashboard": "System Overview",
      "/employees": "Staff Directory",
      "/logs": "Real-time Attendance",
      "/reports": "Analytics & Export",
      "/settings": "Business Configuration"
    };
    return titles[path] || "Attendly";
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative text-slate-900">
      
      {/* 🚀 FLOATING PUNCH BUTTON (Mobile & Desktop) */}
      <button 
        onClick={handleFloatingPunch}
        disabled={isPunching}
        className="fixed bottom-8 right-8 z-[100] group"
      >
        {!isPunching && (
          <span className="absolute inset-0 rounded-[2rem] bg-indigo-500 animate-ping opacity-20"></span>
        )}
        
        <div className={`
          relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 
          rounded-[2rem] shadow-2xl transition-all duration-300 active:scale-90
          ${isPunching ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-black'}
        `}>
          {isPunching ? (
            <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
          ) : (
            <div className="flex flex-col items-center">
              <ShieldCheck size={28} className="text-indigo-400" />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Punch</span>
            </div>
          )}
        </div>
      </button>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-md" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-all duration-350 ease-in-out
        lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-xl rotate-12 flex items-center justify-center text-white font-black italic">A</div>
             <span className="text-2xl font-black text-slate-800 tracking-tighter">Attendly</span>
          </div>
          <button className="lg:hidden p-2 bg-slate-50 rounded-xl" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" path="/dashboard" />
          <NavItem icon={<Users size={20}/>} label="Employees" path="/employees" />
          <NavItem icon={<Clock size={20}/>} label="Logs" path="/logs" />
          <NavItem icon={<FileBarChart size={20}/>} label="Analytics" path="/reports" />
          <div className="my-6 border-t border-slate-100" />
          <NavItem icon={<Settings size={20}/>} label="Settings" path="/settings" />
        </nav>

        <div className="p-6 bg-slate-50/50 m-4 rounded-[2rem] border border-slate-100">
           <button onClick={() => auth.signOut()} className="flex items-center gap-3 text-slate-500 hover:text-red-500 transition-colors w-full font-bold text-sm">
             <LogOut size={18} /> 
             <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center px-8 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600"><Menu size={20} /></button>
            <h1 className="font-black text-slate-900 text-lg tracking-tight">{getHeaderTitle(location.pathname)}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-none">{user?.displayName || "Admin Account"}</p>
              <p className="text-[10px] text-indigo-500 font-black uppercase mt-1 tracking-widest">Administrator</p>
            </div>
            <div className="w-11 h-11 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xs shadow-lg shadow-slate-200">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 overflow-y-auto flex-1 scrollbar-hide">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, path }) {
  const active = useLocation().pathname === path;
  return (
    <Link to={path} className={`
      flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 group
      ${active 
        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02]' 
        : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}
    `}>
      <span className={`${active ? "text-indigo-400" : "group-hover:text-indigo-500"} transition-colors`}>{icon}</span>
      <span className="font-bold text-sm tracking-tight">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
    </Link>
  );
}