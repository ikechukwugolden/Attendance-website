import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const handlePunch = async (user, location) => {
  const now = new Date();
  
  // Logic: Assume shift starts at 9:00 AM
  const shiftStart = new Date();
  shiftStart.setHours(9, 0, 0, 0);
  
  // Apply 5-minute grace period
  const graceThreshold = new Date(shiftStart.getTime() + 5 * 60000);
  const status = now > graceThreshold ? "Late" : "On-Time";

  const attendanceRecord = {
    user_id: user.uid,
    userName: user.displayName || "Employee",
    email: user.email,
    timestamp: serverTimestamp(), // Immutable server time
    location: location,           // GPS captured from component
    status: status,               // Auto-calculated status
    device: navigator.userAgent   // Extra verification data
  };

  const docRef = await addDoc(collection(db, "attendance_logs"), attendanceRecord);
  
  return { id: docRef.id, status };
};