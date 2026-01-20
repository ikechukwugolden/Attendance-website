import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from 'react-hot-toast';
import { MapPin, Clock } from "lucide-react";

export default function PunchButton() {
  const { user } = useAuth();
  const [isPunching, setIsPunching] = useState(false);

  const triggerPunch = async () => {
    if (!user) {
      toast.error("You must be logged in to clock in.");
      return;
    }

    setIsPunching(true);
    
    // 1. Get GPS Location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          // 2. Logic for Status (On-Time vs Late)
          // Example: Late if after 9:00 AM
          const now = new Date();
          const status = now.getHours() >= 9 ? "Late" : "On-Time";

          // 3. Save to Firestore (attendance_logs collection)
          await addDoc(collection(db, "attendance_logs"), {
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0], // Fallback if no displayName
            department: user.department || "General",
            status: status,
            location: location,
            timestamp: serverTimestamp(), // Ensures correct sorting in Logs page
            type: "Check-In"
          });

          toast.success(`Success! Marked as ${status}`);
        } catch (error) {
          console.error(error);
          toast.error("Database error. Please try again.");
        } finally {
          setIsPunching(false);
        }
      },
      (error) => {
        toast.error("Location access denied. GPS is required.");
        setIsPunching(false);
      },
      { enableHighAccuracy: true } // Better GPS precision
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Visual Feedback Container */}
      <div className="relative">
        {/* Animated Background Pulse */}
        {!isPunching && (
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        )}
        
        <button
          onClick={triggerPunch}
          disabled={isPunching}
          className={`
            relative z-10 flex flex-col items-center justify-center
            w-40 h-40 rounded-full font-bold shadow-2xl transition-all active:scale-95
            ${isPunching 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:shadow-blue-200"
            }
          `}
        >
          {isPunching ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-xs uppercase tracking-tighter">Syncing...</span>
            </div>
          ) : (
            <>
              <Clock size={32} className="mb-2" />
              <span className="text-lg">Clock In</span>
              <div className="flex items-center gap-1 text-[10px] opacity-80 mt-1 font-normal">
                <MapPin size={10} /> GPS Active
              </div>
            </>
          )}
        </button>
      </div>
      
      <p className="text-slate-400 text-xs font-medium">
        Location is verified automatically
      </p>
    </div>
  );
}