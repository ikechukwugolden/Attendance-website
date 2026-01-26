import { useState, useEffect, useRef } from "react"; 
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { detectPatterns } from "../services/analyticsEngine";
import { toast } from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react"; 
import { Sparkles, Activity, ShieldAlert, Zap, Download, Printer, Copy } from "lucide-react";

import StatsGrid from "../components/StatsGrid";
import AttendanceChart from "../components/AttendanceChart";
import AttendanceTable from "../components/AttendanceTable";

export default function Dashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const lastLogId = useRef(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    presentCount: 0,
    lateCount: 0,
    earlyCount: 0
  });

  const scanUrl = `${window.location.origin}/scan?bid=${user?.uid}`;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "attendance_logs"), 
      where("businessId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (fetchedLogs.length > 0) {
        const newestLog = fetchedLogs[0];
        if (lastLogId.current && newestLog.id !== lastLogId.current) {
          toast(`${newestLog.userName} is ${newestLog.status}!`, {
            icon: newestLog.status === "On-Time" ? "✅" : "⚠️",
            style: { 
              borderRadius: '24px', 
              background: '#0f172a', 
              color: '#fff',
              fontSize: '12px',
              fontWeight: '900',
              padding: '16px 24px'
            }
          });
        }
        lastLogId.current = newestLog.id;
      }

      setLogs(fetchedLogs);
      
      const today = new Date().toLocaleDateString();
      const todayLogs = fetchedLogs.filter(l => 
        l.timestamp?.toDate().toLocaleDateString() === today
      );

      setStats({
        totalCount: fetchedLogs.length,
        presentCount: todayLogs.length,
        lateCount: todayLogs.filter(l => l.status === "Late").length,
        earlyCount: todayLogs.filter(l => l.status === "Early").length
      });
    });

    return () => unsubscribe();
  }, [user]);

  // 🛡️ Enhanced Pattern Detection
  useEffect(() => {
    if (logs.length > 0) {
      const patterns = detectPatterns(logs);
      setAlerts(patterns || []);
    }
  }, [logs]);

  const downloadQR = () => {
    const canvas = document.getElementById("terminal-qr");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `terminal-qr-${user?.businessName || 'business'}.png`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* QR TERMINAL CARD */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={60} className="text-blue-600" />
          </div>

          <div className="flex justify-between w-full mb-6 px-2">
            <button onClick={() => {
              navigator.clipboard.writeText(scanUrl);
              toast.success("Link copied!");
            }} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all">
              <Copy size={18} />
            </button>
            <button onClick={downloadQR} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all">
              <Download size={18} />
            </button>
          </div>

          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.businessName || 'Admin'}&background=0f172a&color=fff`} 
            className="w-20 h-20 rounded-[2rem] mb-4 shadow-2xl object-cover ring-8 ring-slate-50" 
            alt="Logo" 
          />
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">
            {user?.businessName || "Terminal Active"}
          </h2>
          <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.3em] mb-8">Ref: {user?.uid?.slice(0, 8)}</p>
          
          <div className="p-8 bg-slate-900 rounded-[3rem] shadow-2xl shadow-blue-900/20 mb-8 transform group-hover:scale-105 transition-transform duration-500">
            <QRCodeCanvas 
              id="terminal-qr"
              value={scanUrl} 
              size={160}
              level="H"
              fgColor="#ffffff"
              bgColor="transparent"
            />
          </div>
          
          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">
              Live Secure Terminal
            </p>
          </div>
        </div>

        {/* STATS & INTELLIGENCE */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Overview</h1>
                  <p className="text-slate-400 font-bold text-sm ml-1">Real-time personnel behavior</p>
                </div>
                <button onClick={() => window.print()} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
                  <Printer size={20} />
                </button>
            </div>

            <StatsGrid stats={stats} />
            
            {/* 🟢 REFINED INTELLIGENCE SECTION */}
            <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl shadow-blue-900/20 relative overflow-hidden transition-all duration-500">
                <h3 className="text-blue-400 font-black flex items-center gap-3 text-xs uppercase tracking-[0.3em] mb-6">
                  <ShieldAlert size={18} />
                  Intelligence Alerts
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alerts.length > 0 ? (
                    alerts.map((alert, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-all border-l-4 border-l-blue-500">
                        <p className="text-white font-black text-sm mb-1 italic">{alert.userName}</p>
                        <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest leading-tight">
                          {alert.issue}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-6 flex flex-col items-center justify-center opacity-20">
                      <Zap size={24} className="text-white mb-2" />
                      <p className="text-white text-[10px] font-black uppercase tracking-widest">Scanning for anomalies...</p>
                    </div>
                  )}
                </div>
            </div>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 bg-white p-4 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 min-h-[450px]">
           <AttendanceChart logs={logs} /> 
        </div>

        <div className="xl:col-span-4 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 flex flex-col h-[520px]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Live Stream</h3>
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