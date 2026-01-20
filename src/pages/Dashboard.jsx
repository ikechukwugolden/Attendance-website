import { useState, useEffect, useRef } from "react"; 
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { detectPatterns } from "../services/analyticsEngine";
import { toast } from "react-hot-toast";

// Component Imports
import StatsGrid from "../components/StatsGrid";
import AttendanceChart from "../components/AttendanceChart";
import AttendanceTable from "../components/AttendanceTable";
import PunchButton from "../components/PunchButton";

export default function Dashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const lastLogId = useRef(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    presentCount: 0,
    lateCount: 0,
    earlyCount: 0 // Added early count for better stats
  });

  useEffect(() => {
    if (!user) return;

    let q;
    // Admins see everyone, staff see only their own logs
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
      
      // Real-time Toast Notifications
      if (fetchedLogs.length > 0) {
        const newestLog = fetchedLogs[0];
        if (lastLogId.current && newestLog.id !== lastLogId.current) {
          toast.success(`${newestLog.userName || 'Someone'} clocked in!`);
        }
        lastLogId.current = newestLog.id;
      }

      setLogs(fetchedLogs);
      
      // Advanced Stat Calculations
      const late = fetchedLogs.filter(l => l.status === "Late").length;
      const early = fetchedLogs.filter(l => l.status === "Early").length;
      
      setStats({
        totalCount: fetchedLogs.length,
        presentCount: fetchedLogs.length,
        lateCount: late,
        earlyCount: early
      });
    }, (error) => {
      console.error("Dashboard Sync Error:", error);
      if (error.code === 'permission-denied') {
        toast.error("Access restricted. Ensure your role is set to 'admin'.");
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            {user?.role === 'admin' ? "Executive Overview" : "My Attendance Hub"}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            {user?.role === 'admin' ? "Monitoring workforce punctuality" : "Tracking your daily arrival times"}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <PunchButton />
        </div>
      </div>

      <StatsGrid stats={stats} />

      {/* Admin Behavioral Alerts */}
      {user?.role === 'admin' && alerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-sm">
          <h3 className="text-rose-800 font-bold flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            System Intelligence: Attendance Flags
          </h3>
          <ul className="mt-2 space-y-1">
            {alerts.slice(0, 3).map((alert, i) => (
              <li key={i} className="text-xs text-rose-700 font-medium bg-white/50 p-2 rounded-lg">
                <span className="font-black underline">{alert.userName}</span>: {alert.issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart - Height increased for visibility */}
        <div className="lg:col-span-2">
           <AttendanceChart logs={logs} /> 
        </div>

        {/* Live Feed Table */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <h3 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-widest">
            {user?.role === 'admin' ? "Live Stream" : "My Log History"}
          </h3>
          <div className="h-[400px] overflow-y-auto custom-scrollbar">
            <AttendanceTable logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}