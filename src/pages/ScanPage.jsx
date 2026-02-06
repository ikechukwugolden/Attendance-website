import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { 
  collection, addDoc, serverTimestamp, doc, getDoc, setDoc, 
  query, where, orderBy, onSnapshot 
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, Loader2, Users, LogOut, Building2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ScanPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [businessData, setBusinessData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [myStatus, setMyStatus] = useState(""); 
  const [coworkers, setCoworkers] = useState([]); 
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  
  const businessId = searchParams.get("bid");

  // Helper for Date/Time logic: "Today" or "Yesterday"
  const formatTimeLabel = (timestamp) => {
    if (!timestamp) return "...";
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} at ${timeStr}`;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 1. Fetch Business Identity
  useEffect(() => {
    if (!businessId) { setLoadingBusiness(false); return; }
    const fetchBusiness = async () => {
      try {
        const uSnap = await getDoc(doc(db, "users", businessId));
        const sSnap = await getDoc(doc(db, "business_settings", businessId));
        if (uSnap.exists()) {
          setBusinessData({ ...uSnap.data(), settings: sSnap.exists() ? sSnap.data() : {} });
        }
      } catch (err) { toast.error("Handshake failed."); }
      finally { setLoadingBusiness(false); }
    };
    fetchBusiness();
  }, [businessId]);

  // 2. Real-time Status Check
  useEffect(() => {
    if (user && businessId) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const q = query(
        collection(db, "attendance_logs"),
        where("businessId", "==", businessId),
        where("userId", "==", user.uid),
        where("timestamp", ">=", today),
        orderBy("timestamp", "desc")
      );

      return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(d => d.data());
        const scanLog = logs.find(l => l.type === "QR_Scan");
        const lastLog = logs[0];

        setHasCheckedIn(!!scanLog);
        setHasCheckedOut(lastLog?.type === "Check_Out");
        
        if (scanLog && lastLog?.type !== "Check_Out") {
          setIsSuccess(true);
          setMyStatus(scanLog.status);
        } else {
          setIsSuccess(false);
        }
      });
    }
  }, [user, businessId]);

  // 3. Coworkers List
  useEffect(() => {
    if (businessId) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const q = query(
        collection(db, "attendance_logs"), 
        where("businessId", "==", businessId), 
        where("timestamp", ">=", today), 
        orderBy("timestamp", "desc")
      );

      return onSnapshot(q, (snap) => {
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const latestLogs = {};
        logs.forEach(l => { if (!latestLogs[l.userId]) latestLogs[l.userId] = l; });
        
        // Show coworkers who are clocked in and not you
        const active = Object.values(latestLogs).filter(l => 
          l.type === "QR_Scan" && l.userId !== user?.uid
        );
        setCoworkers(active);
      });
    }
  }, [businessId, user?.uid]);

  const handleAttendance = async () => {
    if (!user) return navigate("/login");
    setIsProcessing(true);
    const isOut = hasCheckedIn && !hasCheckedOut;
    const toastId = toast.loading(isOut ? "Ending shift..." : "Verifying location...");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const rules = businessData?.settings || {};

      if (rules.location) {
        const dist = calculateDistance(latitude, longitude, rules.location.lat, rules.location.lng);
        if (dist > (Number(rules.geofenceRadius) || 200)) {
          toast.error(`Out of Bounds: ${Math.round(dist)}m`, { id: toastId });
          return setIsProcessing(false);
        }
      }

      try {
        const finalName = user.displayName || user.email.split('@')[0];
        const photo = user.photoURL || "";
        let status = "Present";

        if (!isOut) {
          const shiftStart = rules.shiftStart || "09:00";
          const [h, m] = shiftStart.split(":").map(Number);
          const deadline = new Date(); 
          deadline.setHours(h, m + (Number(rules.gracePeriod) || 0), 0, 0);
          status = new Date().getTime() > deadline.getTime() ? "Late" : "On-Time";
        } else {
          status = "Checked-Out";
        }

        await addDoc(collection(db, "attendance_logs"), {
          businessId,
          businessName: businessData?.businessName || "Unknown",
          userId: user.uid,
          userName: finalName,
          userPhoto: photo,
          status,
          timestamp: serverTimestamp(),
          location: { lat: latitude, lng: longitude },
          type: isOut ? "Check_Out" : "QR_Scan"
        });

        toast.success(isOut ? "Shift ended!" : `Verified: ${status}`, { id: toastId });
      } catch (e) { toast.error("Sync error", { id: toastId }); }
      finally { setIsProcessing(false); }
    }, () => { 
      toast.error("GPS Required", { id: toastId }); 
      setIsProcessing(false); 
    }, { enableHighAccuracy: true });
  };

  if (loadingBusiness) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
        {/* MY CARD */}
        <div className={`w-full max-w-md p-10 rounded-[3.5rem] text-center mb-8 border-b-8 shadow-2xl ${myStatus === 'Late' ? 'bg-rose-600 border-rose-900' : 'bg-emerald-600 border-emerald-900'}`}>
          <div className="w-24 h-24 rounded-3xl mx-auto mb-4 border-4 border-white/20 overflow-hidden shadow-xl bg-white/10">
            {user?.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <Users className="m-auto h-full w-1/2 text-white/50" />}
          </div>
          <h1 className="text-4xl font-black italic uppercase italic">Verified</h1>
          <p className="font-bold text-white/80 mt-1 uppercase tracking-widest text-[10px]">{user?.displayName || "Employee"}</p>
          
          <button onClick={handleAttendance} disabled={isProcessing} className="mt-8 w-full py-5 bg-black/20 hover:bg-black/40 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase text-[11px] border border-white/10">
            {isProcessing ? <Loader2 className="animate-spin" /> : <><LogOut size={18}/> End My Session</>}
          </button>
        </div>

        {/* COWORKERS LIST */}
        <div className="w-full max-w-md bg-slate-900/50 rounded-[3rem] p-8 border border-white/5 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6">On-Site Coworkers ({coworkers.length})</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {coworkers.length > 0 ? coworkers.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <img src={w.userPhoto || `https://ui-avatars.com/api/?name=${w.userName}`} className="h-10 w-10 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-bold">{w.userName}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase">{formatTimeLabel(w.timestamp)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center py-4 text-slate-600 font-bold text-xs italic">Working solo right now...</p>
              )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[4rem] p-10 shadow-2xl border-b-[12px] border-slate-200">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
            {businessData?.photoURL ? <img src={businessData.photoURL} className="w-full h-full object-cover" /> : <Building2 className="text-slate-300" size={40} />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic">{businessData?.businessName || "Terminal"}</h2>
        </div>

        {hasCheckedOut ? (
          <div className="bg-emerald-50 rounded-[2.5rem] p-8 text-center border border-emerald-100">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
            <p className="text-xs font-black text-emerald-900 uppercase italic">Shift complete. See you tomorrow!</p>
          </div>
        ) : (
          <button onClick={handleAttendance} disabled={isProcessing} className="w-full py-8 rounded-[2.5rem] font-black uppercase bg-slate-900 text-white hover:bg-blue-600 transition-all shadow-xl">
            {isProcessing ? "Verifying..." : "Confirm Presence"}
          </button>
        )}
      </div>
    </div>
  );
}