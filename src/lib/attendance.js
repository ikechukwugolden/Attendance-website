import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export const recordAttendance = async (user, location, type = "IN") => {
  try {
    // 1. Fetch Dynamic Rules from Settings
    const settingsRef = doc(db, "system", "config");
    const settingsSnap = await getDoc(settingsRef);
    
    // Default values if settings aren't set in DB yet
    let shiftStartStr = "09:00";
    let gracePeriod = 5;

    if (settingsSnap.exists()) {
      const config = settingsSnap.data();
      shiftStartStr = config.shiftStart;
      gracePeriod = config.gracePeriod;
    }

    // 2. Parse Shift Time (e.g., "09:30" -> 570 minutes)
    const [hours, minutes] = shiftStartStr.split(':').map(Number);
    const shiftStartMinutes = (hours * 60) + minutes;

    // 3. Capture Current Time
    const now = new Date();
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();

    // 4. Automated Status Logic
    let status = "On-Time";
    if (type === "IN" && currentMinutes > (shiftStartMinutes + gracePeriod)) {
      status = "Late";
    }

    // 5. Build Final Record
    const attendanceData = {
      user_id: user.uid,
      userName: user.displayName || "Employee",
      email: user.email,
      timestamp: serverTimestamp(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: type,
      status: status,
      location: location, // Passed from PunchButton GPS
      department: user.department || "General"
    };

    const docRef = await addDoc(collection(db, "attendance_logs"), attendanceData);
    return { id: docRef.id, status };
    
  } catch (error) {
    console.error("Error recording attendance:", error);
    throw error;
  }
};