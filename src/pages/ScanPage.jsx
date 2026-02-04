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
  const { user } = useAuth(); // Grabs Google User details (photoURL, displayName)
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

  // 1. Fetch Business Identity
  useEffect(() => {
    if (!businessId) { setLoadingBusiness(false); return; }

    const unsubUser = onSnapshot(doc(db, "users", businessId), (uSnap) => {
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

  // 2. Real-time Check: Scanned today?
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
    const toastId = toast.loading("Verifying location...");

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
        
        // --- 🟢 FETCH USER DATA FROM GOOGLE AUTH ---
        const finalUserName = user.displayName || user.email.split('@')[0];
        const userPhoto = user.photoURL || ""; 

        if (!isOut) {
          const [h, m] = (rules.shiftStart || "09:00").split(":").map(Number);
          const deadline = new Date(); deadline.setHours(h, m + (Number(rules.gracePeriod) || 0), 0, 0);
          status = new Date().getTime() > deadline.getTime() ? "Late" : "On-Time";
        } else {
          status = "Checked-Out";
        }

        // Update User Profile with Photo
        const userProfileRef = doc(db, "users", user.uid);
        await setDoc(userProfileRef, {
          uid: user.uid,
          businessId: businessId, 
          displayName: finalUserName,
          photoURL: userPhoto,
          email: user.email,
          role: "employee",
          lastActive: serverTimestamp()
        }, { merge: true });

        // --- 🟢 SAVE TO ADMIN LOGS WITH PHOTO ---
        await addDoc(collection(db, "attendance_logs"), {
          businessId,
          businessName: businessData.businessName,
          userId: user.uid,
          userName: finalUserName,
          userPhoto: userPhoto, // This sends the Google picture to Admin
          status,
          timestamp: serverTimestamp(),
          location: { lat: latitude, lng: longitude },
          type: isOut ? "Check_Out" : "QR_Scan"
        });

        toast.success(isOut ? "Goodbye!" : `Verified: ${status}`, { id: toastId });
        if (isOut) setIsSuccess(false);
      } catch (e) { 
        toast.error("Sync error", { id: toastId }); 
      } finally { setIsProcessing(false); }
    }, () => { toast.error("GPS Required", { id: toastId }); setIsProcessing(false); }, { enableHighAccuracy: true });
  };

  if (loadingBusiness) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-white font-black text-xs tracking-widest uppercase opacity-50">Handshaking...</p>
    </div>
  );

  // Success View
  if (isSuccess && !hasCheckedOut) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center animate-in zoom-in duration-500">
        <div className={`w-full max-w-md p-10 rounded-[3rem] text-center mb-8 shadow-2xl ${myStatus === 'Late' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          
          {/* 🟢 EMPLOYEE GOOGLE PHOTO */}
          <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white/30 overflow-hidden bg-white/10">
            {user?.photoURL ? <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" /> : <Users className="m-auto h-full w-1/2 text-white/50" />}
          </div>

          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Verified</h1>
          <p className="font-bold text-white/80 mt-1 uppercase tracking-widest text-[10px]">{user?.displayName}</p>
          
          <button 
            onClick={handleAttendance}
            disabled={isProcessing}
            className="mt-8 w-full py-4 bg-black/20 hover:bg-black/40 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <><LogOut size={16}/> End Session</>}
          </button>
        </div>

        {/* Coworkers List with Photos */}
        <div className="w-full max-w-md bg-slate-900/50 rounded-[3rem] p-8 border border-white/5 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6">Active Coworkers</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {coworkers.map((w) => (
                <div key={w.id} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                      {w.userPhoto ? <img src={w.userPhoto} className="w-full h-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-black text-blue-400">{w.userName?.charAt(0)}</div>}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{w.userName}</p>
                      <p className="text-[9px] text-slate-500 font-black uppercase">{w.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${w.status === 'Late' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{w.status}</span>
                </div>
              ))}
            </div>
        </div>
      </div>
    );
  }

  // Initial Presence View
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[4rem] p-10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white">
            {businessData?.photoURL ? <img src={businessData.photoURL} className="w-full h-full object-cover" /> : <Building2 className="text-slate-300" size={40} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">{businessData?.businessName || "Hub Terminal"}</h2>
          
          {/* 🟢 EMPLOYEE PREVIEW */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <img src={user?.photoURL} className="w-6 h-6 rounded-full" alt="" />
            <p className="text-[10px] font-bold text-slate-400 italic">{user?.displayName}</p>
          </div>
        </div>

        {hasCheckedOut ? (
          <div className="bg-slate-50 rounded-[2rem] p-8 text-center mb-8">
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-900">SHIFT COMPLETE</p>
          </div>
        ) : (
          <button
            onClick={handleAttendance}
            disabled={isProcessing}
            className="w-full py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-widest bg-slate-900 text-white hover:bg-blue-600 transition-all shadow-2xl disabled:opacity-50"
          >
            {isProcessing ? "Verifying GPS..." : "Confirm Presence"}
          </button>
        )}
      </div>
    </div>
  );
}