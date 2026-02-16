import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Clock, LogOut, Smartphone, Activity } from "lucide-react";

export default function AttendanceTable() {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Set up the "Today" filter to match your dashboard logic
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "attendance_logs"),
      where("businessId", "==", user.uid),
      where("timestamp", ">=", startOfToday), // Filter for today only
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveUsers(logs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusStyles = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("late")) return "bg-rose-50 text-rose-600 border-rose-100";
    if (s.includes("out") || s.includes("check")) return "bg-slate-100 text-slate-500 border-slate-200 opacity-80";
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  };

  if (loading) return (
    <div className="py-10 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px] tracking-widest">
      Refreshing Live Feed...
    </div>
  );

  return (
    <div className="mt-4 w-full overflow-x-auto custom-scrollbar">
      {activeUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
          <Activity className="text-slate-200 mb-2" size={32} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No activity today</p>
        </div>
      ) : (
        <table className="w-full min-w-[500px] text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="px-4 pb-2">Employee</th>
              <th className="px-4 pb-2">Time</th>
              <th className="px-4 pb-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {activeUsers.map(log => {
              // Safety check for timestamp
              const timeString = log.timestamp?.toDate 
                ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "--:--";

              const isOut = log.status?.toLowerCase().includes("out") || log.type === "Check_Out";
              
              return (
                <tr key={log.id} className={`group transition-all ${isOut ? "opacity-60" : "opacity-100"}`}>
                  <td className="py-4 px-4 bg-white group-hover:bg-slate-50 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm border ${isOut ? "border-slate-200" : "border-blue-100"}`}>
                          {log.userPhoto ? (
                            <img 
                              src={log.userPhoto} 
                              alt={log.userName} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                              {log.userName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        {!isOut && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className={`font-bold text-sm tracking-tight ${isOut ? "text-slate-400" : "text-slate-900"}`}>
                          {log.userName || "Unknown User"}
                        </span>
                        <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                          {log.type === "QR_Scan" ? <Smartphone size={8}/> : <LogOut size={8}/>}
                          {log.type?.replace('_', ' ') || 'Log'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 bg-white group-hover:bg-slate-50 border-y border-transparent group-hover:border-slate-100 transition-colors">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded-md text-slate-500 bg-slate-50">
                      {timeString}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right bg-white group-hover:bg-slate-50 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100 transition-colors">
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm transition-all ${getStatusStyles(log.status)}`}>
                      {log.status || "Present"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}