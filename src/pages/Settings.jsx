import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Save, Clock, MapPin, Loader2, Target, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import AdminQR from "../components/AdminQR"; // 🟢 Import the component

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [config, setConfig] = useState({
    shiftStart: "09:00",
    gracePeriod: 15,
    location: { lat: 0, lng: 0 }, 
    geofenceRadius: 100 
  });

  useEffect(() => {
    async function fetchSettings() {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().settings) {
          const data = docSnap.data().settings;
          setConfig({
            ...data,
            location: data.location || { lat: 0, lng: 0 }
          });
        }
      } catch (error) {
        toast.error("Could not load rules.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { settings: config });
      toast.success("Workplace rules updated!");
    } catch (error) {
      toast.error("Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const setCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setConfig({
        ...config,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
      });
      toast.success("GPS Coordinates Captured!");
    }, (err) => {
      toast.error("Permission denied. Enable GPS.");
    });
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-black uppercase text-[10px] tracking-widest">Accessing Secure Vault...</p>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Global Rules</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Configure your company's attendance logic.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
          <Info size={14} className="text-amber-600" />
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Changes apply instantly to terminal</span>
        </div>
      </div>

      {/* Main Grid: Form + Sidebar */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <div className="lg:col-span-2 space-y-10">
          {/* Timing Section */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Shift Parameters</h3>
                <p className="text-slate-400 text-xs font-medium">When does the workday officially start?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Daily Start Time</label>
                <input 
                  type="time" 
                  value={config.shiftStart}
                  onChange={(e) => setConfig({...config, shiftStart: e.target.value})}
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-black text-xl text-slate-800 transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lateness Grace (Mins)</label>
                <input 
                  type="number" 
                  value={config.gracePeriod}
                  onChange={(e) => setConfig({...config, gracePeriod: parseInt(e.target.value) || 0})}
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-black text-xl text-slate-800 transition-all outline-none"
                />
              </div>
            </div>
          </section>

          {/* Geofencing Section */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">GPS Security</h3>
                  <p className="text-slate-400 text-xs font-medium">Control where check-ins are valid.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={setCurrentLocation}
                className="p-4 bg-slate-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <Target size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Latitude / Longitude</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-5 bg-slate-50 rounded-2xl font-bold text-slate-500 text-sm border border-slate-100">
                    {config.location.lat.toFixed(4)}
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl font-bold text-slate-500 text-sm border border-slate-100">
                    {config.location.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Detection Radius (m)</label>
                <input 
                  type="number" 
                  value={config.geofenceRadius}
                  onChange={(e) => setConfig({...config, geofenceRadius: parseInt(e.target.value) || 0})}
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-black text-xl text-slate-800 transition-all outline-none"
                />
              </div>
            </div>
          </section>

          {/* 🟢 QR CODE SECTION */}
          <section className="mt-10">
            <h3 className="text-2xl font-black text-slate-900 mb-6 italic">Terminal Generation</h3>
            <AdminQR />
          </section>
        </div>

        {/* Sidebar Save Button */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[3rem] sticky top-8 text-white shadow-2xl">
            <h4 className="font-black uppercase text-[10px] tracking-widest text-blue-400 mb-4">Verification</h4>
            <p className="text-sm font-medium leading-relaxed opacity-70 mb-8">
              Applying these rules will recalculate all "Late" vs "On-Time" flags for future scans. Employees outside the {config.geofenceRadius}m radius will be blocked.
            </p>
            <button 
              disabled={isSaving}
              type="submit"
              className="w-full py-6 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40"
            >
              {isSaving ? "Updating..." : "Push Update"}
              <Save size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}