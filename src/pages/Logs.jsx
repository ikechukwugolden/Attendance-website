import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Search, Calendar, Users, AlertCircle, CheckCircle, History } from "lucide-react";
import StatusBadge from "../components/StatusBadge";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Listen to ALL logs
    const q = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setLogs(fetchedLogs);
    });

    return () => unsubscribe();
  }, []);

  // --- THE FIX: Better Date Filtering ---
  const dailyLogs = logs.filter(log => {
    if (!log.timestamp) return false;
    
    // Convert Firebase timestamp to YYYY-MM-DD
    const dateObj = log.timestamp.toDate();
    const logDateString = dateObj.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
    
    const matchesDate = logDateString === selectedDate;
    const matchesSearch = log.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDate && matchesSearch;
  });

  // Stats for the chosen day
  const total = dailyLogs.length;
  const lateCount = dailyLogs.filter(l => l.status === "Late").length;
  const earlyCount = dailyLogs.filter(l => l.status === "Early").length;

  return (
    <div className="space-y-6 p-4">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-lg">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Staff</p>
          <h3 className="text-4xl font-black">{total}</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Early Birds</p>
          <h3 className="text-4xl font-black text-slate-900">{earlyCount}</h3>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] shadow-sm">
          <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">Late (After 8:30)</p>
          <h3 className="text-4xl font-black text-rose-700">{lateCount}</h3>
        </div>
      </div>

      {/* 2. Calendar and Search */}
      <div className="flex flex-col md:row gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl w-fit">
          <Calendar size={18} className="text-blue-600" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none font-bold text-slate-700 outline-none"
          />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search employee name..."
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 3. The Logs Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Staff Member</th>
                <th className="px-6 py-5">Clock Time</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dailyLogs.length > 0 ? (
                dailyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                          {log.userName?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-sm">
                      {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-20 text-center">
                    <History size={40} className="mx-auto mb-2 text-slate-200" />
                    <p className="text-slate-400 text-xs font-bold uppercase">No history for this date</p>
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