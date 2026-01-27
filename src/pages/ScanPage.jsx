import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { 
  collection, addDoc, serverTimestamp, doc, getDoc, setDoc, 
  query, where, orderBy, onSnapshot 
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, ShieldAlert, Loader2, Activity, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function ScanPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [businessData, setBusinessData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [myStatus, setMyStatus] = useState(""); // Track if user was late/on-time
  const [coworkers, setCoworkers] = useState([]); // Live team feed
  
  const businessId = searchParams.get("bid");

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  // 1. Fetch Business Profile
  useEffect(() => {
    async function fetchCompleteBusinessProfile() {
      if (!businessId) {
        setLoadingBusiness(false);
        return;
      }
      try {
        const userRef = doc(db, "users", businessId);
        const userSnap = await getDoc(userRef);
        
        const settingsRef = doc(db, "business_settings", businessId);
        const settingsSnap = await getDoc(settingsRef);

        if (userSnap.exists()) {
          const profile = userSnap.data();
          const settings = settingsSnap.exists() ? settingsSnap.data() : {};
          setBusinessData({ ...profile, settings: settings });
        }
      } catch (err) {
        toast.error("Security handshake failed");
      } finally {
        setLoadingBusiness(false);
      }
    }
    fetchCompleteBusinessProfile();
  }, [businessId]);

  // 2. Real-time Team Feed (Only active after successful scan)
  useEffect(() => {
    if (isSuccess && businessId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "attendance_logs"),
        where("businessId", "==", businessId),
        where("timestamp", ">=", today),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoworkers(docs);
      });
      return () => unsubscribe();
    }
  }, [isSuccess, businessId]);

  const handleClockIn = async () => {
    if (!user) {
      toast.error("Please login first");
      return navigate("/login");
    }
    
    setIsProcessing(true);
    const toastId = toast.loading("Verifying location...");

    const rules = businessData?.settings || {};
    const officeLocation = rules.location; 

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (officeLocation) {
          const distance = calculateDistance(latitude, longitude, officeLocation.lat, officeLocation.lng);
          const allowedRadius = rules.geofenceRadius || 200;

          if (distance > allowedRadius) {
            toast.error(`Out of Bounds: ${Math.round(distance)}m away.`, { id: toastId });
            setIsProcessing(false);
            return;
          }
        }

        try {
          const now = new Date();
          const shiftTime = rules.shiftStart || "09:00";
          const [targetHour, targetMinute] = shiftTime.split(":").map(Number);
          const deadline = new Date();
          deadline.setHours(targetHour, targetMinute + (Number(rules.gracePeriod) || 0), 0);

          const status = now > deadline ? "Late" : "On-Time";
          const finalUserName = user.displayName || (user.email ? user.email.split('@')[0] : "Staff Member");

          // Update User Profile
          const myProfileRef = doc(db, "users", user.uid);
          await setDoc(myProfileRef, {
            businessId: businessId,
            lastScan: serverTimestamp(),
            displayName: finalUserName,
            email: user.email
          }, { merge: true });

          // Create Attendance Log
          await addDoc(collection(db, "attendance_logs"), {
            businessId: businessId,
            businessName: businessData.businessName || "Unknown Business",
            userId: user.uid,
            userName: finalUserName,
            status: status,
            timestamp: serverTimestamp(),
            location: { lat: latitude, lng: longitude },
            type: "QR_Scan"
          });

          setMyStatus(status);
          setIsSuccess(true); 
          toast.success(`Verified: ${status}`, { id: toastId });
        } catch (error) {
          toast.error("Submission error", { id: toastId });
          setIsProcessing(false);
        }
      },
      () => {
        toast.error("Enable GPS to continue", { id: toastId });
        setIsProcessing(false);
      },
      { enableHighAccuracy: true, timeout: 10000 } 
    );
  };

  // --- SUCCESS VIEW (TEAM FEED) ---
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center animate-in fade-in duration-700">
        <div className={`w-full max-w-md p-8 rounded-[2.5rem] text-center mb-8 shadow-2xl transition-colors ${myStatus === 'Late' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          <CheckCircle size={48} className="mx-auto mb-4" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">You are {myStatus}</h1>
          <p className="text-[10px] uppercase font-black tracking-widest opacity-70 mt-2">Log recorded in central cloud</p>
        </div>

        <div className="w-full max-w-md bg-slate-900/50 rounded-[3rem] p-8 border border-white/5 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
              <Users size={14} /> Team Presence
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full">Today</span>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {coworkers.map((worker) => (
              <div key={worker.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center font-black text-[10px] text-blue-400">
                    {worker.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight">{worker.userName}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-black">
                      {worker.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                  worker.status === 'Late' ? 'text-rose-400 bg-rose-400/10' : 'text-emerald-400 bg-emerald-400/10'
                }`}>
                  {worker.status}
                </span>
              </div>
            ))}
          </div>

          {/* <button 
            onClick={() => navigate("/dashboard")}
            className="w-full mt-8 py-4 rounded-2xl bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all"
          >
            Enter Personal Dashboard
          </button> */}
        </div>
      </div>
    );
  }

  // --- LOADING / ERROR VIEWS ---
  if (loadingBusiness) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
      <p className="text-white font-black text-[10px] tracking-widest uppercase">Validating Terminal...</p>
    </div>
  );

  if (!businessData) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
      <ShieldAlert size={64} className="text-rose-500 mb-4" />
      <h1 className="text-3xl font-black text-slate-900 italic">Invalid Terminal</h1>
      <p className="text-slate-400 mt-2 max-w-xs">QR link broken or not configured.</p>
    </div>
  );

  // --- INITIAL SCAN VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl overflow-hidden ring-8 ring-slate-50">
             <img 
              src={`https://ui-avatars.com/api/?name=${businessData?.businessName}&background=0f172a&color=fff&bold=true`} 
              className="w-full h-full object-cover"
              alt="Logo"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{businessData?.businessName}</h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-4 py-2 rounded-full mt-3 inline-block">
            Secure Terminal
          </span>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] py-8 border border-slate-100 text-center mb-10">
          <p className="text-4xl font-black text-slate-900 tracking-tighter">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Current Time</p>
        </div>

        <button
          onClick={handleClockIn}
          disabled={isProcessing}
          className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 shadow-xl"
        >
          {isProcessing ? "Authenticating..." : "Confirm Presence"}
        </button>
      </div>
    </div>
  );
}