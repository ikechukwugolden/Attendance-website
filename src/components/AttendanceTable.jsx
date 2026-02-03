import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Clock, User as UserIcon, LogOut, Smartphone, MousePointer2 } from "lucide-react";

export default function AttendanceTable() {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "attendance_logs"),
      where("businessId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveUsers(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 🟢 Enhanced styles for the "Checked-Out" label
  const getStatusStyles = (status) => {
    switch (status) {
      case "Late":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "Checked-Out":
      case "Check_Out": // Fallback for type field
        return "bg-slate-100 text-slate-500 border-slate-200 opacity-80";
      default:
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
    }
  };

  if (loading) return <div className="py-10 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px] tracking-widest">Refreshing Live Feed...</div>;

  return (
    <div className="mt-4 w-full overflow-x-auto custom-scrollbar">
      {activeUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
          <Clock className="text-slate-200 mb-2" size={32} />
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
              const isOut = log.status === "Checked-Out" || log.type === "Check_Out";
              
              return (
                <tr key={log.id} className="group hover:bg-slate-50 transition-all">
                  <td className="py-4 px-4 bg-white group-hover:bg-slate-50 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      {/* 🟢 Icon swaps to LogOut when user is checked out */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm ${isOut ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-500"}`}>
                        {isOut ? <LogOut size={16} /> : <UserIcon size={16} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm tracking-tight ${isOut ? "text-slate-400 line-through decoration-slate-200" : "text-slate-700"}`}>
                          {log.userName}
                        </span>
                        <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                          {log.type === "QR_Scan" ? <Smartphone size={8}/> : <MousePointer2 size={8}/>}
                          {log.type?.replace('_', ' ') || 'Log'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 bg-white group-hover:bg-slate-50 border-y border-transparent group-hover:border-slate-100">
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md ${isOut ? "text-slate-400 bg-slate-50" : "text-slate-500 bg-slate-50"}`}>
                      {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right bg-white group-hover:bg-slate-50 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusStyles(log.status)}`}>
                      {isOut ? "Checked-Out" : log.status}
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