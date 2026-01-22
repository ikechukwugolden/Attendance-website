import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { calculateAttendanceStatus } from "../services/shiftService"; // The service we updated earlier
import toast from 'react-hot-toast';
import { MapPin, Clock, ShieldCheck, AlertCircle } from "lucide-react";

export default function PunchButton({ businessId }) {
  const { user } = useAuth();
  const [isPunching, setIsPunching] = useState(false);

  // Helper: Haversine formula to calculate distance in meters
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
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

  const triggerPunch = async () => {
    if (!user) return toast.error("Please login first");
    setIsPunching(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // 1. Fetch Admin Settings for this business
          const adminRef = doc(db, "users", businessId);
          const adminSnap = await getDoc(adminRef);
          
          if (!adminSnap.exists()) throw new Error("Business not found");
          const settings = adminSnap.data().settings;

          // 2. GEOFENCING CHECK
          const distance = getDistance(
            latitude, longitude, 
            settings.officeLocation.lat, settings.officeLocation.lng
          );

          if (distance > settings.radius) {
            toast.error(`Out of range! You are ${Math.round(distance)}m away from the office.`);
            setIsPunching(false);
            return;
          }

          // 3. CALCULATE STATUS (Using our shared service)
          const { status, minutesLate } = calculateAttendanceStatus(
            new Date(), 
            settings.shiftStart, 
            settings.gracePeriod
          );

          // 4. LOG TO FIRESTORE
          await addDoc(collection(db, "attendance_logs"), {
            businessId: businessId,
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0],
            status: status,
            minutesLate: minutesLate,
            location: { lat: latitude, lng: longitude },
            timestamp: serverTimestamp(),
            device: navigator.userAgent
          });

          toast.success(`Clocked in! Status: ${status}`);
        } catch (error) {
          console.error(error);
          toast.error("Process failed. Try again.");
        } finally {
          setIsPunching(false);
        }
      },
      (err) => {
        toast.error("GPS access required to verify location.");
        setIsPunching(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {!isPunching && (
          <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-10"></div>
        )}
        
        <button
          onClick={triggerPunch}
          disabled={isPunching}
          className={`
            relative z-10 flex flex-col items-center justify-center
            w-48 h-48 rounded-[3rem] font-black shadow-2xl transition-all 
            active:scale-90 active:rotate-2 group
            ${isPunching 
              ? "bg-slate-100 text-slate-400" 
              : "bg-slate-900 text-white hover:bg-black"
            }
          `}
        >
          {isPunching ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="text-[10px] uppercase tracking-widest font-black">Verifying...</span>
            </div>
          ) : (
            <>
              <div className="bg-indigo-500 p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <span className="text-xl uppercase tracking-tight">Clock In</span>
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest opacity-40 mt-2">
                <MapPin size={10} /> Secure Zone
              </div>
            </>
          )}
        </button>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
          Geofencing Shield Active
        </p>
      </div>
    </div>
  );
}