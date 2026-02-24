import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import { db } from "../lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, where, 
  setDoc, doc, writeBatch, getDocs, updateDoc 
} from "firebase/firestore"; 
import { useAuth } from "../context/AuthContext";
import { detectPatterns } from "../services/analyticsEngine";
import { toast } from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Sparkles, Activity, ShieldAlert, Zap, Download, 
  Printer, Copy, X, RotateCcw, Settings, Home, Calendar 
} from "lucide-react"; 

import StatsGrid from "../components/StatsGrid";
import AttendanceChart from "../components/AttendanceChart";
import AttendanceTable from "../components/AttendanceTable";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cloudDismissed, setCloudDismissed] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);
  const lastLogId = useRef(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    presentCount: 0,
    lateCount: 0,
    checkedOutCount: 0
  });

  const scanUrl = useMemo(() => 
    user?.uid ? `${window.location.origin}/scan?bid=${user.uid}` : "", 
    [user?.uid]
  );

  // 1. Business Profile & Access Guard
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // --- AUTO-EXPIRY GUARD ---
        if (data.plan === 'pro' && data.expiresAt) {
          const now = new Date();
          const expiry = data.expiresAt.toDate();

          if (now > expiry) {
            await updateDoc(doc(db, "users", user.uid), {
              plan: 'free',
              subscriptionActive: false
            });
            toast.error("Pro subscription expired. Downgraded to Free.", {
              icon: "⚠️",
              style: { borderRadius: '20px', background: '#0f172a', color: '#fff' }
            });
          }
        }
        setBusinessProfile(data);
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // 2. Dismissed Alerts Listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "dismissed_alerts"), where("businessId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCloudDismissed(snapshot.docs.map(doc => doc.id));
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // 3. Main Logs Listener
  useEffect(() => {
    if (!user?.uid) return;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "attendance_logs"),
      where("businessId", "==", user.uid),
      where("timestamp", ">=", startOfToday),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (fetchedLogs.length > 0) {
        const newestLog = fetchedLogs[0];
        if (lastLogId.current && newestLog.id !== lastLogId.current) {
          const isCheckOut = newestLog.type === "Check_Out" || newestLog.status === "Checked-Out";
          const icon = isCheckOut ? "🚪" : newestLog.status === "Late" ? "⏰" : "✅";
          toast(`${newestLog.userName} is ${newestLog.status}!`, {
            icon,
            style: { borderRadius: '24px', background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: '900', padding: '16px 24px' }
          });
        }
        lastLogId.current = newestLog.id;
      }
      
      setLogs(fetchedLogs);

      const userLatestStatus = {};
      fetchedLogs.forEach(log => {
        if (!userLatestStatus[log.userId]) userLatestStatus[log.userId] = log.type;
      });

      setStats({
        totalCount: fetchedLogs.length,
        presentCount: Object.values(userLatestStatus).filter(type => type === "QR_Scan").length,
        lateCount: fetchedLogs.filter(l => l.status === "Late" && l.type === "QR_Scan").length,
        checkedOutCount: fetchedLogs.filter(l => l.type === "Check_Out").length
      });
    }, (error) => console.error("Firebase Query Error:", error));
    return () => unsubscribe();
  }, [user?.uid]);

  // 4. Intelligence Engine
  useEffect(() => {
    if (user?.uid && logs.length > 0) {
      const patterns = detectPatterns(logs);
      const activeAlerts = patterns.filter(p => {
        const cleanUserName = String(p.userName).replace(/[^a-zA-Z0-9]/g, '_');
        const alertKey = `${user.uid}_${cleanUserName}_${p.type}`;
        return !cloudDismissed.includes(alertKey);
      });
      setAlerts(activeAlerts);
    } else {
      setAlerts([]);
    }
  }, [logs, cloudDismissed, user?.uid]);

  const handleDismissAlert = async (userName, type) => {
    if (!user?.uid) return;
    const cleanUserName = String(userName).replace(/[^a-zA-Z0-9]/g, '_');
    const alertKey = `${user.uid}_${cleanUserName}_${type}`;
    try {
      await setDoc(doc(db, "dismissed_alerts", alertKey), {
        businessId: user.uid,
        dismissedAt: new Date(),
        userName,
        type
      });
    } catch (error) { toast.error("Sync failed"); }
  };

  const handleResetAlerts = async () => {
    if (!window.confirm("Restore all hidden intelligence alerts?")) return;
    try {
      const q = query(collection(db, "dismissed_alerts"), where("businessId", "==", user.uid));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      toast.success("Intelligence reset");
    } catch (error) { toast.error("Reset failed"); }
  };

  const downloadQR = () => {
    const canvas = document.getElementById("terminal-qr");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${businessProfile?.businessName || 'terminal'}-qr.png`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* STATUS BANNER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-4 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${businessProfile?.plan === 'pro' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Zap size={20} fill={businessProfile?.plan === 'pro' ? "currentColor" : "none"} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Subscription Status</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black italic text-slate-900 uppercase">
                {businessProfile?.plan === 'pro' ? 'Enterprise Terminal' : 'Standard (Free)'}
              </span>
              {businessProfile?.plan === 'pro' && businessProfile.expiresAt && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Calendar size={10} /> {businessProfile.expiresAt.toDate().toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link 
          to="/settings" 
          className="px-6 py-3 bg-slate-900 text-white hover:bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
        >
          {businessProfile?.plan === 'pro' ? 'Manage Billing' : 'Upgrade to Pro'}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* QR Terminal Card */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={60} className="text-blue-600" />
          </div>
          <div className="flex justify-between w-full mb-6 px-2">
            <button onClick={() => { navigator.clipboard.writeText(scanUrl); toast.success("Link Copied!"); }} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"><Copy size={18} /></button>
            <button onClick={downloadQR} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"><Download size={18} /></button>
          </div>
          <div className="w-20 h-20 rounded-[2rem] mb-4 shadow-2xl ring-8 ring-slate-50 overflow-hidden flex items-center justify-center bg-slate-100">
            {businessProfile?.photoURL ? (
              <img src={businessProfile.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <div className="text-slate-400 font-black text-2xl uppercase">{businessProfile?.businessName?.charAt(0) || "A"}</div>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">{businessProfile?.businessName || "Terminal Active"}</h2>
          <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.3em] mb-8">BID: {user?.uid?.slice(0, 8)}</p>
          <div className="p-8 bg-slate-900 rounded-[3rem] shadow-2xl mb-8 transform group-hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => navigate("/settings")}>
            {scanUrl && <QRCodeCanvas id="terminal-qr" value={scanUrl} size={160} level="H" fgColor="#ffffff" bgColor="transparent" />}
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">Live Secure Terminal</p>
          </div>
        </div>

        {/* Overview & Intelligence */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Overview</h1>
              <p className="text-slate-400 font-bold text-sm ml-1">Real-time personnel monitoring</p>
            </div>
            
            <div className="flex gap-2">
              <Link to="/welcome" className="flex items-center gap-2 p-4 bg-white text-slate-400 border border-slate-100 rounded-2xl hover:text-blue-600 transition-all shadow-xl group/home">
                <Home size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Home</span>
              </Link>
              
              <button onClick={() => navigate("/settings")} className="p-4 bg-white text-slate-400 border border-slate-100 rounded-2xl hover:text-blue-600 transition-all shadow-xl">
                <Settings size={20} />
              </button>

              <button onClick={() => window.print()} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
                <Printer size={20} />
              </button>
            </div>
          </div>
          
          <StatsGrid stats={stats} />
          
          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-blue-400 font-black flex items-center gap-3 text-xs uppercase tracking-[0.3em]">
                <ShieldAlert size={18} className="animate-pulse" /> Intelligence Alerts
              </h3>
              {cloudDismissed.length > 0 && (
                <button onClick={handleResetAlerts} className="flex items-center gap-2 text-[10px] font-black text-blue-400/40 hover:text-blue-400 uppercase tracking-widest transition-all">
                  <RotateCcw size={12} /> Reset Hidden ({cloudDismissed.length})
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                  <div key={i} className="group relative bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-all border-l-4 border-l-blue-500">
                    <button onClick={() => handleDismissAlert(alert.userName, alert.type)} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 text-white/50 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                    <p className="text-white font-black text-sm mb-1 italic">{alert.userName}</p>
                    <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest leading-tight pr-8">{alert.issue}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-6 flex flex-col items-center justify-center opacity-20">
                  <Zap size={24} className="text-white mb-2" />
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">No anomalies detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 bg-white p-4 rounded-[3.5rem] border border-slate-100 shadow-2xl min-h-[450px]">
          <AttendanceChart logs={logs} />
        </div>
        <div className="xl:col-span-4 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col h-[520px]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Live Activity</h3>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">Syncing</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AttendanceTable logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}