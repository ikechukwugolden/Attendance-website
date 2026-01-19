import { db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export const getShiftDetails = async (shiftId) => {
  // Fetches shift rules: start_time, end_time, and grace_period
  const shiftDoc = await getDoc(doc(db, "shifts", shiftId));
  return shiftDoc.exists() ? shiftDoc.data() : null;
};

export const checkAttendanceStatus = (checkInTime, shiftStart, gracePeriod) => {
  const [sHours, sMinutes] = shiftStart.split(':').map(Number);
  const checkTime = new Date(checkInTime);
  
  const startTime = new Date(checkTime);
  startTime.setHours(sHours, sMinutes, 0, 0);

  // Apply the 5-min grace period logic from your proposal
  const graceThreshold = new Date(startTime.getTime() + gracePeriod * 60000);
  
  return checkTime <= graceThreshold ? "On-Time" : "Late";
};