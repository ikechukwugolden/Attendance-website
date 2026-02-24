import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import {
  collection, addDoc, serverTimestamp, doc, getDoc,
  query, where, orderBy, onSnapshot, setDoc
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, Loader2, Users, LogOut, Building2, Clock, Calendar, MapPin, ShieldCheck } from "lucide-react";
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
  const [allTodayLogs, setAllTodayLogs] = useState([]);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);

  const businessId = searchParams.get("bid");

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!user && !loadingBusiness) {
      toast.error("Please login to confirm presence");
      navigate("/login");
    }
  }, [user, loadingBusiness, navigate]);

  useEffect(() => {
    async function fetchBusiness() {
      if (!businessId) {
        setLoadingBusiness(false);
        return;
      }
      try {
        const uSnap = await getDoc(doc(db, "users", businessId));
        const sSnap = await getDoc(doc(db, "business_settings", businessId));
        if (uSnap.exists()) {
          setBusinessData({
            ...uSnap.data(),
            settings: sSnap.exists() ? sSnap.data() : {},
            tier: uSnap.data().tier || 'FREE'
          });
        }
      } catch (err) {
        toast.error("Connection error.");
      } finally {
        setLoadingBusiness(false);
      }
    }
    fetchBusiness();
  }, [businessId]);

  useEffect(() => {
    if (!user || !businessId) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "attendance_logs"),
      where("businessId", "==", businessId),
      where("timestamp", ">=", today),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllTodayLogs(allLogs);
      
      const myLogs = allLogs.filter(l => l.userId === user.uid);
      const lastLog = myLogs[0];

      if (lastLog) {
        const currentlyIn = lastLog.type === "QR_Scan";
        const currentlyOut = lastLog.type === "Check_Out";
        setHasCheckedIn(currentlyIn);
        setHasCheckedOut(currentlyOut);

        if (currentlyIn) {
          setIsSuccess(true);
          setMyStatus(lastLog.status);
        } else {
          setIsSuccess(false);
        }
      }

      const latestPerUser = {};
      allLogs.forEach(log => {
        if (!latestPerUser[log.userId]) {
          latestPerUser[log.userId] = log;
        }
      });

      // Show ALL users currently clocked in (including me)
      const active = Object.values(latestPerUser).filter(log => log.type === "QR_Scan");
      setCoworkers(active);
    });

    return () => unsubscribe();
  }, [user, businessId]);

  const handleAttendance = async () => {
    if (!user) return toast.error("Session expired.");
    if (!businessId) return toast.error("Invalid QR Code.");

    setIsProcessing(true);

    try {
      if (businessData?.tier === 'PRO' && businessData.settings?.location) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
        });

        const dist = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          businessData.settings.location.lat,
          businessData.settings.location.lng
        );

        if (dist > 100) {
          toast.error("Location Denied: You are not at the station.");
          setIsProcessing(false);
          return;
        }
      }

      const userRef = doc(db, "users", user.uid);
      const isCheckingOut = hasCheckedIn && !hasCheckedOut;
      let statusText = "Present";

      if (!isCheckingOut && businessData?.settings) {
        const { shiftStart, gracePeriod = 0 } = businessData.settings;
        if (shiftStart) {
          const now = new Date();
          const [sHour, sMin] = shiftStart.split(":").map(Number);
          const shiftTime = new Date();
          shiftTime.setHours(sHour, sMin, 0, 0);
          const graceTime = new Date(shiftTime.getTime() + gracePeriod * 60000);

          if (now > graceTime) statusText = "Late";
          else if (now < shiftTime) statusText = "Early";
          else statusText = "On-Time";
        }
      }

      await setDoc(userRef, {
        displayName: user.displayName || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL || "",
        businessId: businessId,
        lastActive: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, "attendance_logs"), {
        businessId,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        userPhoto: user.photoURL || "",
        status: statusText,
        timestamp: serverTimestamp(),
        type: isCheckingOut ? "Check_Out" : "QR_Scan",
        isVerified: businessData?.tier === 'PRO'
      });

      if (!isCheckingOut) {
        setMyStatus(statusText);
        setIsSuccess(true);
        setHasCheckedIn(true);
      } else {
        setIsSuccess(false);
        setHasCheckedOut(true);
        setHasCheckedIn(false);
      }
      toast.success(isCheckingOut ? "Session ended" : `Confirmed: ${statusText}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimeLabel = (timestamp) => {
    if (!timestamp) return "...";
    const date = timestamp.toDate ? timestamp.toDate() : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loadingBusiness) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  if (isSuccess) {
    const statusConfig = {
      "Late": "bg-rose-600 border-rose-900",
      "Early": "bg-blue-600 border-blue-900",
      "On-Time": "bg-emerald-600 border-emerald-900",
      "Present": "bg-emerald-600 border-emerald-900"
    };

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center gap-6">
        <div className={`w-full max-w-md p-10 rounded-[3.5rem] text-center border-b-8 shadow-2xl transition-all duration-500 ${statusConfig[myStatus] || 'bg-slate-800 border-slate-900'}`}>
          <div className="w-24 h-24 rounded-3xl mx-auto mb-4 border-4 border-white/20 overflow-hidden shadow-xl bg-white/10">
            {user?.photoURL ? (
              <img src={user.photoURL} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="m-auto h-full w-1/2 text-white/50" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
             <Clock size={16} className="opacity-50" />
             <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Arrival Status</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">{myStatus}</h1>
          
          {businessData?.tier === 'PRO' && (
            <div className="flex items-center justify-center gap-1 mt-2 text-emerald-300">
               <ShieldCheck size={12} />
               <span className="text-[9px] font-bold uppercase tracking-widest">Geo-Verified Scan</span>
            </div>
          )}

          <button onClick={handleAttendance} disabled={isProcessing} className="mt-8 w-full py-5 bg-black/20 hover:bg-black/40 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase text-[11px] border border-white/10 transition-all active:scale-95">
            {isProcessing ? <Loader2 className="animate-spin" /> : <><LogOut size={18} /> End My Session</>}
          </button>
        </div>

        <div className="w-full max-w-md bg-slate-900/50 rounded-[3rem] p-8 border border-white/5 backdrop-blur-xl">
          <div className="flex flex-col gap-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">On-Site Now</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{coworkers.length} People Active</span>
                </div>
              </div>
              <Calendar size={14} className="text-slate-500" />
            </div>

            {/* TEAM AVATAR STACK WITH STATUS DOTS */}
            <div className="flex -space-x-3 overflow-hidden p-1">
              {coworkers.map((person, idx) => (
                <div key={person.userId || idx} className="relative">
                  <img 
                    className="inline-block h-10 w-10 rounded-xl ring-4 ring-slate-950 object-cover bg-slate-800" 
                    src={person.userPhoto || `https://ui-avatars.com/api/?name=${person.userName}`} 
                    alt="" 
                  />
                  <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                    person.status === 'Late' ? 'bg-rose-500' : 
                    person.status === 'On-Time' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} title={person.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {allTodayLogs.map((log) => {
              const isOut = log.type === 'Check_Out';
              return (
                <div key={log.id} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 transition-opacity ${isOut ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <img src={log.userPhoto || `https://ui-avatars.com/api/?name=${log.userName}`} className="h-8 w-8 rounded-lg object-cover shadow-lg" alt="" />
                    <div>
                      <p className="text-[11px] font-bold leading-none mb-1">{log.userName}</p>
                      <p className={`text-[9px] font-black uppercase ${isOut ? 'text-slate-500' : 'text-emerald-400'}`}>
                        {isOut ? 'Left Site' : 'Arrived'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-white/70">{formatTimeLabel(log.timestamp)}</p>
                    {log.isVerified && <MapPin size={10} className="inline mr-1 text-blue-400" />}
                  </div>
                </div>
              );
            })}
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
            {businessData?.photoURL ? (
              <img src={businessData.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="" />
            ) : (
              <Building2 className="text-slate-300" size={40} />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic">{businessData?.businessName || "Terminal Active"}</h2>
          <div className={`inline-block mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${businessData?.tier === 'PRO' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
             {businessData?.tier === 'PRO' ? 'Geo-Guard Active' : 'Basic Mode'}
          </div>
        </div>

        {hasCheckedOut ? (
          <div className="bg-emerald-50 rounded-[2.5rem] p-8 text-center border border-emerald-100">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
            <p className="text-xs font-black text-emerald-900 uppercase italic">Shift complete. See you tomorrow!</p>
          </div>
        ) : (
          <button onClick={handleAttendance} disabled={isProcessing} className="w-full py-8 rounded-[2.5rem] font-black uppercase bg-slate-900 text-white hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center justify-center">
            {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm Presence"}
          </button>
        )}

        {businessData?.tier !== 'PRO' && (
            <p className="mt-6 text-[9px] text-center text-slate-400 font-bold uppercase tracking-tight">
                Upgrade to PRO to prevent <span className="text-slate-900">Buddy Punching</span>
            </p>
        )}
      </div>
    </div>
  );
}