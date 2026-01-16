import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  limit,
  orderBy 
} from "firebase/firestore";

/**
 * Calculates attendance status based on shift rules
 * @param {Date} checkInTime - The current time
 * @param {string} shiftStartStr - e.g., "09:00"
 * @param {number} graceMinutes - e.g., 5
 */
const calculateStatus = (checkInTime, shiftStartStr, graceMinutes) => {
  const [hours, minutes] = shiftStartStr.split(':').map(Number);
  const shiftStart = new Date(checkInTime);
  shiftStart.setHours(hours, minutes, 0, 0);

  const graceThreshold = new Date(shiftStart.getTime() + graceMinutes * 60000);
  
  return checkInTime <= graceThreshold ? "On-Time" : "Late";
};

export const handlePunch = async (user, location) => {
  try {
    const now = new Date();
    
    // In a real app, you'd fetch this from the 'shifts' collection
    const shiftStartTime = "09:00"; 
    const gracePeriod = 5;

    const status = calculateStatus(now, shiftStartTime, gracePeriod);

    const logData = {
      user_id: user.uid,
      userName: user.displayName || user.email,
      timestamp: serverTimestamp(),
      type: "IN", // This can be toggled based on previous logs
      status: status,
      location: location || null, // Captures GPS if available
      department: user.department || "General"
    };

    const docRef = await addDoc(collection(db, "attendance_logs"), logData);
    return { success: true, id: docRef.id, status };
  } catch (error) {
    console.error("Attendance Error:", error);
    throw error;
  }
};