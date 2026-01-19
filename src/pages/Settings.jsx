import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Save, Clock, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    shiftStart: "09:00",
    gracePeriod: 5,
    officeLat: 0,
    officeLng: 0,
    radius: 500 // meters
  });

  useEffect(() => {
    async function fetchSettings() {
      const docRef = doc(db, "system", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "system", "config");
      await updateDoc(docRef, config);
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings.");
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading Configuration...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
        <p className="text-slate-500 text-sm">Configure workplace rules and geofencing parameters.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Attendance Rules */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold">
            <Clock size={20} /> <h3>Attendance Rules</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shift Start Time</label>
              <input 
                type="time" 
                value={config.shiftStart}
                onChange={(e) => setConfig({...config, shiftStart: e.target.value})}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grace Period (Minutes)</label>
              <input 
                type="number" 
                value={config.gracePeriod}
                onChange={(e) => setConfig({...config, gracePeriod: parseInt(e.target.value)})}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Geofencing */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold">
            <MapPin size={20} /> <h3>Office Geofencing</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Office Latitude</label>
              <input 
                type="number" step="any"
                value={config.officeLat}
                onChange={(e) => setConfig({...config, officeLat: parseFloat(e.target.value)})}
                className="w-full p-2 border border-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Office Longitude</label>
              <input 
                type="number" step="any"
                value={config.officeLng}
                onChange={(e) => setConfig({...config, officeLng: parseFloat(e.target.value)})}
                className="w-full p-2 border border-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allowed Radius (m)</label>
              <input 
                type="number" 
                value={config.radius}
                onChange={(e) => setConfig({...config, radius: parseInt(e.target.value)})}
                className="w-full p-2 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Save size={20} /> Save Configuration
        </button>
      </form>
    </div>
  );
}