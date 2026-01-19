import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
// FIXED: Verified all icons are imported properly from lucide-react
import { Search, Calendar, Filter } from "lucide-react";
import StatusBadge from "../components/StatusBadge";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Real-time data stream with descending order
    const q = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Attendance Logs</h2>
        <div className="flex gap-2 w-full sm:w-auto">
           <button className="flex items-center justify-center gap-2 flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Calendar size={16} /> Select Date
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by employee or department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
            <Filter size={18} />
          </button>
        </div>

        {/* Table Wrapper for Responsiveness */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Employee</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Department</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Check-In</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{log.userName || "Unknown"}</td>
                    <td className="px-6 py-4 text-slate-600">{log.department || "General"}</td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {log.timestamp 
                        ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : <span className="text-blue-400 animate-pulse font-medium">Syncing...</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {log.location ? `${log.location.lat.toFixed(4)}, ${log.location.lng.toFixed(4)}` : "No GPS"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                    No logs found matching your search.
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