import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // 🟢 Multi-tenant auth
import { Clock, User as UserIcon } from "lucide-react";

export default function AttendanceTable() {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // 🟢 Multi-tenant query: only get logs for this business
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

  if (loading) return <div className="py-10 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px] tracking-widest">Refreshing Live Feed...</div>;

  return (
    <div className="mt-4 overflow-x-auto">
      {activeUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
          <Clock className="text-slate-200 mb-2" size={32} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No activity today</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
              <th className="pb-4">Employee</th>
              <th className="pb-4">Time</th>
              <th className="pb-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activeUsers.map(log => (
              <tr key={log.id} className="group hover:bg-slate-50/50 transition-all">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <UserIcon size={14} />
                    </div>
                    <span className="font-bold text-slate-700 text-sm tracking-tight">{log.userName}</span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${log.status === "Late"
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}