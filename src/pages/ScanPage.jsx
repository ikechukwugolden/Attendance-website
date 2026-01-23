import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, ShieldAlert, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ScanPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [businessData, setBusinessData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false); // 🟢 Added Success State
  
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

  useEffect(() => {
    async function fetchBusiness() {
      if (!businessId) {
        setLoadingBusiness(false);
        return;
      }
      try {
        const docRef = doc(db, "users", businessId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBusinessData(docSnap.data());
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Database connection lost");
      } finally {
        setLoadingBusiness(false);
      }
    }
    fetchBusiness();
  }, [businessId]);

  const handleClockIn = async () => {
    if (!user) {
      toast.error("Please login first");
      return navigate("/login");
    }
    
    setIsProcessing(true);
    const toastId = toast.loading("Verifying security perimeter...");

    const rules = businessData?.settings || {};
    const officeLocation = rules.location; 

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (officeLocation) {
          const distance = calculateDistance(
            latitude, longitude, 
            officeLocation.lat, officeLocation.lng
          );
          
          const allowedRadius = rules.geofenceRadius || 200;

          if (distance > allowedRadius) {
            toast.error(`Out of Bounds: You are ${Math.round(distance)}m away.`, { id: toastId });
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

          // 🟢 SAFETY CHECK: Ensure we have a valid name to save
          const displayName = user.displayName || (user.email ? user.email.split('@')[0] : "Anonymous Staff");

          await addDoc(collection(db, "attendance_logs"), {
            businessId: businessId,
            businessName: businessData.businessName || "Unknown",
            userId: user.uid,
            userName: displayName,
            userEmail: user.email,
            status: status,
            timestamp: serverTimestamp(),
            location: { lat: latitude, lng: longitude },
            distanceFromOffice: officeLocation ? calculateDistance(latitude, longitude, officeLocation.lat, officeLocation.lng) : 0,
            type: "QR_Scan",
            clientTime: now.toISOString()
          });

          setIsSuccess(true); // 🟢 Trigger Success Screen
          toast.success(`Clocked In: ${status}`, { id: toastId });
          
          setTimeout(() => navigate("/dashboard"), 3000);
        } catch (error) {
          console.error(error);
          toast.error("Submission failed.", { id: toastId });
          setIsProcessing(false);
        }
      },
      (error) => {
        const msg = error.code === 1 ? "Enable GPS permissions" : "GPS signal too weak";
        toast.error(msg, { id: toastId });
        setIsProcessing(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } 
    );
  };

  // 🟢 NEW SUCCESS VIEW
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-emerald-500 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-24 h-24 bg-white/20 rounded-[3rem] flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-4xl font-black tracking-tighter italic">Verified!</h1>
        <p className="mt-2 font-bold uppercase text-[10px] tracking-widest opacity-80">Presence Logged Successfully</p>
        <p className="mt-8 text-white/60 text-[10px] font-medium uppercase tracking-[0.2em]">Redirecting to Dashboard...</p>
      </div>
    );
  }

  if (loadingBusiness) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
      <p className="text-white font-black text-[10px] tracking-widest uppercase">Validating Terminal...</p>
    </div>
  );

  if (!businessId || !businessData) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
      <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-6">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Invalid Terminal</h1>
      <p className="text-slate-400 mt-2 font-medium max-w-xs">The QR code is invalid or the business profile is missing.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl overflow-hidden">
             <img 
              src={`https://ui-avatars.com/api/?name=${businessData?.businessName}&background=0f172a&color=fff&bold=true`} 
              className="w-full h-full object-cover"
              alt="Logo"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900">{businessData?.businessName}</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2 inline-block">
            Secure Check-in
          </span>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] py-8 border border-slate-100 text-center mb-10">
          <p className="text-4xl font-black text-slate-900 tracking-tighter">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Local Station Time</p>
        </div>

        <button
          onClick={handleClockIn}
          disabled={isProcessing}
          className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-black active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isProcessing ? "Verifying..." : "Confirm Presence"}
          {!isProcessing && <CheckCircle size={20} />}
        </button>

        <p className="mt-8 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
          GPS Geofencing Protected
        </p>
      </div>
    </div>
  );
}