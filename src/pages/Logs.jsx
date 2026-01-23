import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { 
  Search, History, Download, 
  Loader2, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";

export default function Logs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (!user?.uid) return;

    // 🟢 FETCH LOGS: Only those belonging to THIS admin's businessId
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
    }, (error) => {
      console.error("Firestore Error:", error);
      if (error.code === 'failed-precondition') {
        toast.error("Database indexing required. Check console for link.");
      } else {
        toast.error("Permission denied or connection lost.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Filtering Logic ---
  const dailyLogs = logs.filter(log => {
    if (!log.timestamp) return false;
    
    // Convert Firestore Timestamp to YYYY-MM-DD for comparison
    const logDate = log.timestamp.toDate().toLocaleDateString('en-CA');
    const matchesDate = logDate === selectedDate;
    const matchesSearch = log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDate && matchesSearch;
  });

  // --- CSV Export ---
  const exportToCSV = () => {
    if (dailyLogs.length === 0) return toast.error("No data for this date");
    const headers = "Name,Email,Date,Time,Status,Distance(m)\n";
    const rows = dailyLogs.map(l => (
      `${l.userName},${l.userEmail},${l.timestamp.toDate().toLocaleDateString()},${l.timestamp.toDate().toLocaleTimeString()},${l.status},${Math.round(l.distanceFromOffice || 0)}`
    )).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_${selectedDate}.csv`;
    link.click();
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Records...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Intelligence</h2>
          <p className="text-slate-400 font-bold text-sm">Real-time attendance & GPS verification.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-emerald-500 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-200"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Monthly Calendar View */}
      <div className="bg-white p-6 md:p-8 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.3em]">Select Log Date</h3>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronLeft size={20}/></button>
            <span className="font-black text-slate-900 text-sm uppercase tracking-tighter w-32 text-center">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronRight size={20}/></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-slate-200 uppercase tracking-widest">{d}</div>
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
                  aspect-square rounded-2xl md:rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all border-2
                  ${selectedDate === dateStr ? 'bg-slate-900 border-slate-900 shadow-xl scale-105 md:scale-110' : 'border-transparent hover:border-slate-100 hover:bg-slate-50'}
                  ${isToday && selectedDate !== dateStr ? 'bg-blue-50 border-blue-100 text-blue-600' : ''}
                `}
              >
                <span className={`text-sm font-black ${selectedDate === dateStr ? 'text-white' : 'text-slate-900'}`}>
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

      {/* Details Table */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" placeholder="Search staff name or email..."
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-200 whitespace-nowrap">
            {dailyLogs.length} Records for {new Date(selectedDate).toLocaleDateString('default', { day: 'numeric', month: 'short' })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Member</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Check-in Time</th>
                <th className="px-10 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dailyLogs.length > 0 ? (
                dailyLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-slate-200 group-hover:bg-blue-600 transition-colors">
                          {log.userName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 italic tracking-tight">{log.userName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-slate-900 font-black text-sm italic">
                      {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-24 text-center">
                    <History size={48} className="mx-auto mb-4 text-slate-100" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No activity detected for this date</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}