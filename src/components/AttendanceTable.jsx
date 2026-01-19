import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function AttendanceTable() {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    // We remove the "where type == IN" for now and just get the latest logs
    const q = query(
      collection(db, "attendance_logs"), 
      orderBy("timestamp", "desc"),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveUsers(users);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="mt-4 overflow-x-auto">
      {activeUsers.length === 0 ? (
        <p className="text-gray-400 text-sm italic py-4">No recent attendance activity found.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-slate-50">
              <th className="pb-3 font-semibold">Employee</th>
              <th className="pb-3 font-semibold">Time</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activeUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 font-medium text-slate-700">{user.userName}</td>
                <td className="py-4 text-sm text-slate-500">{user.time || "Just now"}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    user.status === "Late" 
                    ? "bg-red-50 text-red-600" 
                    : "bg-green-50 text-green-600"
                  }`}>
                    {user.status}
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