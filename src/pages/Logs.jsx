import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Search, Calendar, Clock, Users, RefreshCw, BellRing } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import toast from 'react-hot-toast'; // Make sure this is installed

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Logic to detect NEW entries for the popup
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isInitialLoading) {
          const newEntry = change.doc.data();
          // Pop up a notification when a new person clocks in
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-blue-600`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {newEntry.userName?.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-slate-900">New Clock In!</p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-bold text-blue-600">{newEntry.userName}</span> just clocked in from {newEntry.department}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ), { duration: 4000 });
        }
      });

      const fetchedLogs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setLogs(fetchedLogs);
      setIsInitialLoading(false);
    });

    return () => unsubscribe();
  }, [isInitialLoading]);

  // Filter logic for the table
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const logDate = log.timestamp?.toDate().toISOString().split('T')[0];
    return matchesSearch && logDate === selectedDate;
  });

  const totalEntriesForDay = logs.filter(log => 
    log.timestamp?.toDate().toISOString().split('T')[0] === selectedDate
  ).length;

  const latestPerson = logs[0];

  return (
    <div className="space-y-6">
      {/* 1. Header with Live Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Live Attendance</h2>
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mt-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Live Cloud Sync Active</span>
          </div>
        </div>

        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Calendar size={16} className="text-slate-400" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-bold text-slate-700 outline-none border-none p-0 cursor-pointer"
          />
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={120} />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Entries</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-slate-900">{totalEntriesForDay}</h3>
            <span className="text-slate-400 font-bold text-sm">people</span>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-900/20 relative overflow-hidden">
          <div className="absolute right-6 top-6">
            <BellRing size={20} className="text-blue-400 animate-bounce" />
          </div>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Latest Activity</p>
          <h3 className="text-2xl font-bold text-white truncate pr-10">
            {latestPerson ? latestPerson.userName : "No entries yet"}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-blue-400">
            <Clock size={14} />
            <span className="text-xs font-bold">
              {latestPerson?.timestamp ? latestPerson.timestamp.toDate().toLocaleTimeString() : "--:--"}
            </span>
            <span className="text-white/30 px-2">•</span>
            <span className="text-xs uppercase font-black text-white/40 tracking-widest">{latestPerson?.department || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* 3. Log Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none"
            />
          </div>
          <div className="text-[10px] font-bold text-slate-400 italic">Showing {filteredLogs.length} logs</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 py-5">Staff Member</th>
                <th className="px-6 py-5 text-center">Time</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {log.userName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-none mb-1">{log.userName}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-black text-slate-700 text-sm">
                    {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-[10px] font-mono text-slate-300">ID-{log.id.slice(0, 5)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}