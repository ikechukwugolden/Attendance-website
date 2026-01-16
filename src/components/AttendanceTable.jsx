import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function AttendanceTable() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Query for the latest 10 attendance records
    const q = query(
      collection(db, "attendance_logs"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Employee</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Check-In</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Department</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-900">{log.userName}</td>
              <td className="px-6 py-4 text-gray-600">
                {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  log.status === "On-Time" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {log.status}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-500">{log.department}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}