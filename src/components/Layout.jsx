import { useState, useEffect } from "react";
// Added FileBarChart to the imports
import { LogOut, LayoutDashboard, Users, Clock, Settings, Menu, X, FileBarChart } from "lucide-react";
import { auth } from "../lib/firebase";
import { Link, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const getHeaderTitle = (path) => {
    switch (path) {
      case "/dashboard": return "Overview";
      case "/employees": return "Employees";
      case "/logs":      return "Attendance Logs";
      case "/reports":   return "Reports & Analytics"; // Added this case
      case "/settings":  return "Settings";
      default:           return "Attendly";
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="text-xl font-bold text-blue-600 tracking-tight">Attendly</div>
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" path="/dashboard" />
          <NavItem icon={<Users size={20}/>} label="Employees" path="/employees" />
          <NavItem icon={<Clock size={20}/>} label="Logs" path="/logs" />
          {/* ADDED THE REPORTS ITEM HERE */}
          <NavItem icon={<FileBarChart size={20}/>} label="Reports" path="/reports" />
          <NavItem icon={<Settings size={20}/>} label="Settings" path="/settings" />
        </nav>

        <button 
          onClick={() => auth.signOut()}
          className="p-4 m-4 flex items-center gap-3 text-red-500 hover:bg-red-50 rounded-xl transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-slate-800 text-base md:text-lg">
              {getHeaderTitle(location.pathname)}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none">Admin User</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Admin</p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 border-2 border-white shadow-sm rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, path }) {
  const location = useLocation();
  const active = location.pathname === path;

  return (
    <Link 
      to={path} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={active ? "text-white" : "text-slate-400"}>{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
    </Link>
  );
}