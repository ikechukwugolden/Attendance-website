import { useState, useEffect, useRef } from "react"; 
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // Added Auth context
import { detectPatterns } from "../services/analyticsEngine";
import { toast } from "react-hot-toast";

// Component Imports
import StatsGrid from "../components/StatsGrid";
import AttendanceChart from "../components/AttendanceChart";
import AttendanceTable from "../components/AttendanceTable";
import PunchButton from "../components/PunchButton";

export default function Dashboard() {
  const { user } = useAuth(); // Get current logged in user
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const lastLogId = useRef(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    presentCount: 0,
    lateCount: 0,
    onLeave: 0
  });

  useEffect(() => {
    if (!user) return;

    // RULE SYNC: If user is admin, show all logs. If not, only show theirs.
    // This prevents the "Missing or insufficient permissions" red error.
    let q;
    if (user.role === 'admin') {
      q = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"));
    } else {
      q = query(
        collection(db, "attendance_logs"), 
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Real-time Notification logic
      if (fetchedLogs.length > 0) {
        const newestLog = fetchedLogs[0];
        if (lastLogId.current && newestLog.id !== lastLogId.current) {
          toast.success(`${newestLog.userName || 'Someone'} clocked in!`);
        }
        lastLogId.current = newestLog.id;
      }

      setLogs(fetchedLogs);
      
      // Calculate Stats
      const late = fetchedLogs.filter(l => l.status === "Late").length;
      setStats({
        totalCount: fetchedLogs.length,
        presentCount: fetchedLogs.length,
        lateCount: late,
        onLeave: 0
      });
    }, (error) => {
      console.error("Dashboard Sync Error:", error);
      // If rules fail, show a helpful message
      if (error.code === 'permission-denied') {
        toast.error("Access restricted. Update your role to 'admin' in Firestore.");
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (logs.length > 0 && user?.role === 'admin') {
      const patterns = detectPatterns(logs);
      setAlerts(patterns);
    }
  }, [logs, user]);

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            {user?.role === 'admin' ? "Admin Dashboard" : "My Attendance"}
          </h1>
          <p className="text-gray-500 text-xs md:text-sm">
            {user?.role === 'admin' ? "Real-time employee insights" : "View your punch history"}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          {/* Ensure PunchButton uses the shared user context */}
          <PunchButton />
        </div>
      </div>

      <StatsGrid stats={stats} />

      {/* Behavioral Flags - Only for Admins */}
      {user?.role === 'admin' && alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
          <h3 className="text-amber-800 font-bold flex items-center gap-2 text-sm md:text-base">
            ⚠️ Attention Required: Behavioral Flags
          </h3>
          <ul className="mt-2 space-y-1">
            {alerts.slice(0, 3).map((alert, i) => (
              <li key={i} className="text-xs md:text-sm text-amber-700">
                <span className="font-bold">{alert.userName}</span>: {alert.issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white p-3 md:p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base">Attendance Trends</h3>
            <div className="h-[250px] md:h-[350px]">
               <AttendanceChart data={logs} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-100 shadow-sm overflow-hidden order-1 lg:order-2">
          <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base">
            {user?.role === 'admin' ? "Live Check-ins" : "Recent Activity"}
          </h3>
          <div className="overflow-x-auto">
            <AttendanceTable logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}