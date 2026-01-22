import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { MapPin, Clock, CheckCircle, ShieldAlert, Loader2, Navigation } from "lucide-react";
import toast from "react-hot-toast";

export default function ScanPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [businessData, setBusinessData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  
  const businessId = searchParams.get("bid");

  // --- 🟢 GEOLOCATION HELPER: Haversine Formula ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
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
        console.error("Error fetching business:", err);
      } finally {
        setLoadingBusiness(false);
      }
    }
    fetchBusiness();
  }, [businessId]);

  const handleClockIn = async () => {
    if (!user) {
      toast.error("Authentication required");
      return navigate("/login");
    }
    
    setIsProcessing(true);
    const toastId = toast.loading("Verifying security perimeter...");

    // Retrieve the calibration settings we set in SetupBusiness.jsx
    const rules = businessData?.settings || {};
    const officeLocation = rules.location; // {lat, lng} from our MapPicker

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 1. 🟢 GEOFENCE VALIDATION
        if (officeLocation) {
          const distance = calculateDistance(
            latitude, longitude, 
            officeLocation.lat, officeLocation.lng
          );
          
          const allowedRadius = rules.geofenceRadius || 200;

          if (distance > allowedRadius) {
            toast.error(`Access Denied: You are ${Math.round(distance)}m away from the designated zone.`, { id: toastId });
            setIsProcessing(false);
            return;
          }
        }

        try {
          // 2. 🟢 PUNCTUALITY LOGIC
          const now = new Date();
          const [targetHour, targetMinute] = (rules.shiftStart || "09:00").split(":").map(Number);
          
          const deadline = new Date();
          deadline.setHours(targetHour, targetMinute + (rules.gracePeriod || 0), 0);

          const status = now > deadline ? "Late" : "On-Time";

          // 3. 🟢 SAVE LOG TO FIREBASE
          await addDoc(collection(db, "attendance_logs"), {
            businessId: businessId,
            businessName: businessData.businessName || "Unknown Station",
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0],
            userEmail: user.email,
            status: status,
            timestamp: serverTimestamp(),
            location: { lat: latitude, lng: longitude },
            type: "QR_Scan"
          });

          toast.success(`Success! Status: ${status}`, { id: toastId });
          
          // Small delay for UX before taking them to their own history
          setTimeout(() => navigate("/dashboard"), 2000);
        } catch (error) {
          toast.error("Sync failed. Check connection.", { id: toastId });
          setIsProcessing(false);
        }
      },
      (error) => {
        toast.error("Please enable GPS permissions.", { id: toastId });
        setIsProcessing(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (loadingBusiness) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
      <p className="text-white font-black text-[10px] tracking-[0.3em] uppercase">Validating QR...</p>
    </div>
  );

  if (!businessId || !businessData) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
      <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-6">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Unauthorized Terminal</h1>
      <p className="text-slate-400 mt-2 font-medium max-w-xs">This station has not been calibrated or the link has expired.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 selection:bg-blue-500">
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16" />

        <div className="mb-10 text-center relative z-10">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl p-1">
             <img 
              src={businessData?.photoURL || `https://ui-avatars.com/api/?name=${businessData?.businessName || 'B'}&background=0f172a&color=fff`} 
              className="w-full h-full object-cover rounded-[1.8rem]"
              alt="Business"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{businessData?.businessName}</h2>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-blue-50 rounded-full">
            <Navigation size={10} className="text-blue-600 fill-blue-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Active Perimeter Scan</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] py-8 px-4 mb-10 border border-slate-100 text-center">
          <Clock className="mx-auto mb-3 text-slate-300" size={24} />
          <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Verified Time</p>
        </div>

        <button
          onClick={handleClockIn}
          disabled={isProcessing}
          className={`group w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
            isProcessing 
            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
            : "bg-slate-900 text-white hover:bg-black active:scale-95 shadow-slate-900/20"
          }`}
        >
          {isProcessing ? "Authenticating..." : "Clock In Now"}
          {!isProcessing && <CheckCircle size={20} className="group-hover:translate-x-1 transition-transform" />}
        </button>

        <div className="mt-8 flex flex-col items-center gap-1 opacity-40">
           <MapPin size={14} className={isProcessing ? "animate-bounce text-blue-600" : "text-slate-400"} />
           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Encrypted GPS Handshake</p>
        </div>
      </div>
    </div>
  );
}