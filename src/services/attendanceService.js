import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Handles the logic for clocking in/out
 * @param {Object} user - The authenticated user object
 * @param {Object} location - { lat, lng }
 * @param {Object} businessSettings - Settings pulled from the Admin's profile
 * @param {string} businessId - The ID of the business station being scanned
 */
export const handlePunch = async (user, location, businessSettings, businessId) => {
  const now = new Date();
  
  // 1. 🟢 GET DYNAMIC RULES (Fallback to defaults if settings are missing)
  const settings = businessSettings || {
    shiftStart: "09:00",
    gracePeriod: 5
  };

  // 2. 🟢 CALCULATE LATE STATUS
  const [targetHour, targetMinute] = settings.shiftStart.split(":").map(Number);
  
  const graceThreshold = new Date();
  graceThreshold.setHours(targetHour, targetMinute + settings.gracePeriod, 0, 0);

  // If "now" is past the threshold, they are Late
  const status = now > graceThreshold ? "Late" : "On-Time";

  const attendanceRecord = {
    businessId: businessId,           // Link log to the Admin
    userId: user.uid,                 // Link log to the Employee
    userName: user.displayName || user.email.split('@')[0],
    email: user.email,
    timestamp: serverTimestamp(),     // Immutable server time
    location: {
      lat: location.lat,
      lng: location.lng
    },
    status: status,                   // Dynamic status
    device: {
      platform: navigator.platform,
      userAgent: navigator.userAgent
    },
    type: "QR_Scan"
  };

  try {
    const docRef = await addDoc(collection(db, "attendance_logs"), attendanceRecord);
    return { id: docRef.id, status, timestamp: now };
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw new Error("Failed to record attendance.");
  }
};