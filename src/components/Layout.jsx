import { LogOut, LayoutDashboard, Users, Clock, Settings } from "lucide-react";
import { auth } from "../lib/firebase";

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 text-xl font-bold text-blue-600">Attendly</div>
        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" active />
          <NavItem icon={<Users size={20}/>} label="Employees" />
          <NavItem icon={<Clock size={20}/>} label="Logs" />
          <NavItem icon={<Settings size={20}/>} label="Settings" />
        </nav>
        <button 
          onClick={() => auth.signOut()}
          className="p-4 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} /> <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between">
          <h1 className="font-semibold text-slate-700">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
          </div>
        </header>
        <div className="p-8 overflow-y-auto bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
      {icon} <span className="font-medium">{label}</span>
    </div>
  );
}