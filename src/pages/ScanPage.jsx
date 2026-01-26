import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore"; // 🟢 Added setDoc
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
  const [isSuccess, setIsSuccess] = useState(false); 
  
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
          
          setBusinessData({
            ...profile,
            settings: settings 
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Security handshake failed");
      } finally {
        setLoadingBusiness(false);
      }
    }
    fetchCompleteBusinessProfile();
  }, [businessId]);

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
          const finalUserName = user.displayName || (user.email ? user.email.split('@')[0] : "Staff Member");

          // 🟢 STEP 1: Link user to business safely
          // Using setDoc + merge ensures this works even if the user document doesn't exist yet
          const myProfileRef = doc(db, "users", user.uid);
          await setDoc(myProfileRef, {
            businessId: businessId,
            lastScan: serverTimestamp(),
            displayName: finalUserName,
            email: user.email,
            photoURL: user.photoURL || ""
          }, { merge: true });

          // 🟢 STEP 2: Create the log for the Dashboard
          await addDoc(collection(db, "attendance_logs"), {
            businessId: businessId,
            businessName: businessData.businessName || "Unknown Business",
            userId: user.uid,
            userName: finalUserName,
            userEmail: user.email,
            status: status,
            timestamp: serverTimestamp(),
            location: { lat: latitude, lng: longitude },
            distanceFromOffice: officeLocation ? calculateDistance(latitude, longitude, officeLocation.lat, officeLocation.lng) : 0,
            type: "QR_Scan",
            clientTime: now.toISOString(),
            department: user.department || "General" // Ensures department shows in reports
          });

          setIsSuccess(true); 
          toast.success(`Success: Marked as ${status}`, { id: toastId });
          
          setTimeout(() => navigate("/dashboard"), 3000);
        } catch (error) {
          console.error("Error during clock-in:", error);
          // 🟢 Added error code to toast to help you debug in real-time
          toast.error(`Submission error: ${error.code || 'Check Rules'}`, { id: toastId });
          setIsProcessing(false);
        }
      },
      (error) => {
        toast.error("Enable GPS to continue", { id: toastId });
        setIsProcessing(false);
      },
      { enableHighAccuracy: true, timeout: 10000 } 
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-emerald-500 flex flex-col items-center justify-center p-6 text-white text-center">
        <CheckCircle size={60} className="mb-4 animate-bounce" />
        <h1 className="text-4xl font-black italic">Verified!</h1>
        <p className="mt-2 text-sm uppercase tracking-widest opacity-80">Presence Logged Successfully</p>
      </div>
    );
  }

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
      <p className="text-slate-400 mt-2 max-w-xs">The QR link is broken or the business profile is not configured.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl">
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
            Secure Terminal
          </span>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] py-8 border border-slate-100 text-center mb-10">
          <p className="text-4xl font-black text-slate-900 tracking-tighter">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Local Time</p>
        </div>

        <button
          onClick={handleClockIn}
          disabled={isProcessing}
          className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-black active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? "Verifying..." : "Confirm Presence"}
        </button>
      </div>
    </div>
  );
}