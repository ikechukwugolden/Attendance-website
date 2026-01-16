import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { handlePunch } from '../services/attendanceService';
import toast from 'react-hot-toast';

export default function PunchButton() {
  const { user } = useAuth();
  const [isPunching, setIsPunching] = useState(false);

  const triggerPunch = async () => {
    setIsPunching(true);
    
    // Get GPS Location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          const result = await handlePunch(user, location);
          toast.success(`Clocked in successfully! Status: ${result.status}`);
        } catch (error) {
          toast.error("Failed to record attendance.");
        } finally {
          setIsPunching(false);
        }
      },
      (error) => {
        toast.error("Location access denied. Attendance requires GPS.");
        setIsPunching(false);
      }
    );
  };

  return (
    <button
      onClick={triggerPunch}
      disabled={isPunching}
      className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
    >
      {isPunching ? "Processing..." : "Clock In"}
    </button>
  );
}