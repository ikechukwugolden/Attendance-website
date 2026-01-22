import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Fetches shift rules for a specific business/admin
 */
export const getBusinessSettings = async (businessId) => {
  try {
    const docRef = doc(db, "users", businessId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Return settings or default values
      return data.settings || {
        shiftStart: "09:00",
        gracePeriod: 5,
        radius: 100
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching business settings:", error);
    return null;
  }
};

/**
 * Calculates attendance status based on dynamic business rules
 */
export const calculateAttendanceStatus = (checkInDate, shiftStartStr, graceMinutes) => {
  // 1. Parse Shift Start (HH:mm)
  const [sHours, sMinutes] = shiftStartStr.split(':').map(Number);
  
  // 2. Create a Date object for the "Deadline" on the same day as check-in
  const deadline = new Date(checkInDate);
  deadline.setHours(sHours, sMinutes, 0, 0);

  // 3. Add the grace period
  const graceThreshold = new Date(deadline.getTime() + (graceMinutes * 60000));
  
  // 4. Determine Status
  const isLate = checkInDate > graceThreshold;
  
  // 5. Optional: Calculate minutes late for better reporting
  const diffMs = checkInDate - deadline;
  const minutesLate = Math.max(0, Math.floor(diffMs / 60000));

  return {
    status: isLate ? "Late" : "On-Time",
    minutesLate: isLate ? minutesLate : 0,
    threshold: graceThreshold.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};