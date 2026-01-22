import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { 
  Search, Calendar, History, Download, 
  Loader2, Users, Clock, ChevronLeft, ChevronRight 
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";

export default function Logs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (!user?.uid) return;

    // Multi-tenant Query
    const q = query(
      collection(db, "attendance_logs"),
      where("businessId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setLogs(fetchedLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Filtering & Stats ---
  const dailyLogs = logs.filter(log => {
    if (!log.timestamp) return false;
    const logDate = log.timestamp.toDate().toLocaleDateString('en-CA');
    return logDate === selectedDate && 
           log.userName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // --- CSV Export Logic ---
  const exportToCSV = () => {
    if (dailyLogs.length === 0) return toast.error("No data for this date");
    const headers = "Name,Email,Date,Time,Status\n";
    const rows = dailyLogs.map(l => (
      `${l.userName},${l.userEmail},${l.timestamp.toDate().toLocaleDateString()},${l.timestamp.toDate().toLocaleTimeString()},${l.status}`
    )).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_${selectedDate}.csv`;
    link.click();
  };

  // --- Calendar Generator Logic ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* 1. Header & Export */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Analytics</h2>
          <p className="text-slate-500 font-medium">Track patterns and export workforce data.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200"
        >
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* 2. Monthly Streak Calendar */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Monthly Overview</h3>
          <div className="flex gap-2">
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><ChevronLeft size={20}/></button>
            <span className="font-bold text-slate-700 min-w-[120px] text-center">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><ChevronRight size={20}/></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase mb-2">{d}</div>
          ))}
          {getDaysInMonth(viewDate).map((date, idx) => {
            const dateStr = date.toLocaleDateString('en-CA');
            const dayLogs = logs.filter(l => l.timestamp?.toDate().toLocaleDateString('en-CA') === dateStr);
            const hasLates = dayLogs.some(l => l.status === "Late");
            const isToday = new Date().toLocaleDateString('en-CA') === dateStr;

            return (
              <div 
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all border
                  ${selectedDate === dateStr ? 'ring-2 ring-blue-500 border-transparent shadow-lg' : 'border-slate-50 hover:bg-slate-50'}
                  ${isToday ? 'bg-blue-50/50' : ''}
                `}
              >
                <span className={`text-xs font-black ${selectedDate === dateStr ? 'text-blue-600' : 'text-slate-400'}`}>
                  {date.getDate()}
                </span>
                {dayLogs.length > 0 && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${hasLates ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Daily Detail Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Search staff..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest min-w-[140px] text-center">
            {total} Check-ins
          </div>
        </div>

        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-50">
            {dailyLogs.length > 0 ? (
              dailyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                        {log.userName?.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-400 font-mono text-xs">
                    {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="py-20 text-center text-slate-300">
                  <History size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Activity Records</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}