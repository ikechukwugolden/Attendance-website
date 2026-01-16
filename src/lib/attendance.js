import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const recordAttendance = async (userId, shiftStartTime = "09:00") => {
  const now = new Date();
  
  // Convert shift string to a Date object for today
  const [hour, minute] = shiftStartTime.split(':').map(Number);
  const shiftDate = new Date();
  shiftDate.setHours(hour, minute, 0);

  // 5-minute grace period logic as per proposal
  const gracePeriod = 5 * 60000; 
  const isLate = now.getTime() > (shiftDate.getTime() + gracePeriod);

  return await addDoc(collection(db, "attendance"), {
    userId,
    timestamp: serverTimestamp(),
    status: isLate ? "Late" : "On-Time",
    type: "IN",
    date: now.toISOString().split('T')[0] // Format: YYYY-MM-DD
  });
};