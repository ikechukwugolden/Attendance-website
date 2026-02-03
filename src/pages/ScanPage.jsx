import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { 
  collection, addDoc, serverTimestamp, doc, getDoc, setDoc, 
  query, where, orderBy, onSnapshot 
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, ShieldAlert, Loader2, Users, LogOut, Building2 } from "lucide-react";
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 1. 🟢 FETCH BUSINESS IDENTITY (Real-time listener)
  useEffect(() => {
    if (!businessId) {
      setLoadingBusiness(false);
      return;
    }

    // Listener for User (Business Name/Logo)
    const unsubUser = onSnapshot(doc(db, "users", businessId), (uSnap) => {
      // Fetch settings once separately
      getDoc(doc(db, "business_settings", businessId)).then(sSnap => {
        if (uSnap.exists()) {
          setBusinessData({ 
            ...uSnap.data(), 
            settings: sSnap.exists() ? sSnap.data() : {} 
          });
        }
        setLoadingBusiness(false);
      });
    }, (err) => {
      toast.error("Handshake failed");
      setLoadingBusiness(false);
    });

    return () => unsubUser();
  }, [businessId]);

  // 2. Real-time check: Has user scanned today?
  useEffect(() => {
    if (user && businessId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "attendance_logs"),
        where("businessId", "==", businessId),
        where("userId", "==", user.uid),
        where("timestamp", ">=", today),
        orderBy("timestamp", "desc")
      );

      return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(d => d.data());
        const lastLog = logs[0];
        
        setHasCheckedIn(logs.some(l => l.type === "QR_Scan"));
        setHasCheckedOut(logs.some(l => l.type === "Check_Out"));
        
        if (lastLog?.type === "QR_Scan") {
          setIsSuccess(true);
          setMyStatus(lastLog.status);
        }
      });
    }
  }, [user, businessId]);

  // 3. Coworkers List
  useEffect(() => {
    if (isSuccess && businessId) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const q = query(collection(db, "attendance_logs"), where("businessId", "==", businessId), where("timestamp", ">=", today), orderBy("timestamp", "desc"));
      return onSnapshot(q, (snap) => setCoworkers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [isSuccess, businessId]);

  const handleAttendance = async () => {
    if (!user) return navigate("/login");
    setIsProcessing(true);
    const toastId = toast.loading("Verifying security context...");

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
        const isOut = hasCheckedIn && !hasCheckedOut;
        let status = "Present";
        const finalUserName = user.displayName || user.email.split('@')[0];
        
        if (!isOut) {
          const [h, m] = (rules.shiftStart || "09:00").split(":").map(Number);
          const deadline = new Date(); deadline.setHours(h, m + (Number(rules.gracePeriod) || 0), 0, 0);
          status = new Date().getTime() > deadline.getTime() ? "Late" : "On-Time";
        } else {
          status = "Checked-Out";
        }

        const userProfileRef = doc(db, "users", user.uid);
        await setDoc(userProfileRef, {
          uid: user.uid,
          businessId: businessId, 
          displayName: finalUserName,
          email: user.email,
          role: "employee",
          lastActive: serverTimestamp()
        }, { merge: true });

        await addDoc(collection(db, "attendance_logs"), {
          businessId,
          businessName: businessData.businessName,
          userId: user.uid,
          userName: finalUserName,
          status,
          timestamp: serverTimestamp(),
          location: { lat: latitude, lng: longitude },
          type: isOut ? "Check_Out" : "QR_Scan"
        });

        toast.success(isOut ? "Goodbye! Session ended." : `Verified: ${status}`, { id: toastId });
        if (isOut) setIsSuccess(false);
      } catch (e) { 
        console.error(e);
        toast.error("Sync error", { id: toastId }); 
      }
      finally { setIsProcessing(false); }
    }, () => { toast.error("GPS Required", { id: toastId }); setIsProcessing(false); }, { enableHighAccuracy: true });
  };

  if (loadingBusiness) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-white font-black text-xs tracking-[0.3em] uppercase opacity-50">Handshaking...</p>
    </div>
  );

  if (isSuccess && !hasCheckedOut) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center animate-in zoom-in duration-500">
        <div className={`w-full max-w-md p-10 rounded-[3rem] text-center mb-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] ${myStatus === 'Late' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          <CheckCircle size={64} className="mx-auto mb-6" />
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">Verified</h1>
          <p className="font-bold text-white/80 mt-2 uppercase tracking-widest text-xs">Status: {myStatus}</p>
          
          <button 
            onClick={handleAttendance}
            disabled={isProcessing}
            className="mt-8 w-full py-4 bg-black/20 hover:bg-black/40 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] transition-all"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <><LogOut size={16}/> End Session (Check-Out)</>}
          </button>
        </div>

        <div className="w-full max-w-md bg-slate-900/50 rounded-[3rem] p-8 border border-white/5 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6 flex items-center gap-2">
              <Users size={14} /> Active Coworkers
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {coworkers.map((w) => (
                <div key={w.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-blue-400 uppercase">
                      {w.userName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{w.userName}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">{w.type === 'Check_Out' ? 'Left' : 'Arrived'} @ {w.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${w.type === 'Check_Out' ? 'bg-slate-700 text-slate-400' : w.status === 'Late' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{w.status}</span>
                </div>
              ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[4rem] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="text-center mb-10">
          
          {/* 🟢 UPDATED LOGO CONTAINER */}
          <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center shadow-2xl ring-8 ring-slate-50 overflow-hidden">
            {businessData?.photoURL ? (
              <img src={businessData.photoURL} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <Building2 className="text-slate-300" size={40} />
            )}
          </div>

          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            {businessData?.businessName || "Security Terminal"}
          </h2>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-4 bg-blue-50 px-4 py-2 rounded-full inline-block">Presence Terminal</p>
        </div>

        {hasCheckedOut ? (
          <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 text-center mb-8">
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-900 uppercase">Workday Complete</p>
            <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">See you next shift</p>
          </div>
        ) : (
          <button
            onClick={handleAttendance}
            disabled={isProcessing}
            className="w-full py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-blue-600 active:scale-95 transition-all shadow-2xl disabled:opacity-50"
          >
            {isProcessing ? "Verifying..." : "Confirm Presence"}
          </button>
        )}
      </div>
    </div>
  );
}