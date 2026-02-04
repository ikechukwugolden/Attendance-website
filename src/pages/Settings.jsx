import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Save, Clock, MapPin, Loader2, Target, Building2, Upload, X, Navigation } from "lucide-react";
import { toast } from "react-hot-toast";
import AdminQR from "../components/AdminQR";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [config, setConfig] = useState({
    businessName: "",
    photoURL: "",
    shiftStart: "09:00",
    gracePeriod: 15,
    location: { lat: 0, lng: 0 }, 
    geofenceRadius: 100 
  });

  useEffect(() => {
    async function fetchSettings() {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "business_settings", user.uid);
        const userRef = doc(db, "users", user.uid);
        
        const [rulesSnap, userSnap] = await Promise.all([
          getDoc(docRef),
          getDoc(userRef)
        ]);
        
        const rulesData = rulesSnap.exists() ? rulesSnap.data() : {};
        const userData = userSnap.exists() ? userSnap.data() : {};

        setConfig({
          ...rulesData,
          businessName: userData.businessName || "",
          photoURL: userData.photoURL || "",
          location: rulesData.location || { lat: 0, lng: 0 },
          geofenceRadius: rulesData.geofenceRadius || 100,
          shiftStart: rulesData.shiftStart || "09:00",
          gracePeriod: rulesData.gracePeriod || 15
        });
      } catch (error) {
        toast.error("Could not load rules.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [user]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        return toast.error("Image too large (Max 1MB)");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, photoURL: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Saving configuration...");
    try {
      const docRef = doc(db, "business_settings", user.uid);
      const { businessName, photoURL, ...rules } = config;
      
      // Safety check: Don't save 0,0
      if (rules.location.lat === 0) {
        toast.error("Please set a valid GPS location first!", { id: toastId });
        return setIsSaving(false);
      }

      await setDoc(docRef, rules, { merge: true });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        businessName: config.businessName,
        photoURL: config.photoURL
      });
      
      toast.success("Settings live!", { id: toastId });
    } catch (error) {
      toast.error("Update failed", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const setCurrentLocation = () => {
    toast.loading("Fetching high-accuracy GPS...", { duration: 2000 });
    navigator.geolocation.getCurrentPosition((pos) => {
      setConfig({
        ...config,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
      });
      toast.success("Location captured! Remember to save.");
    }, (err) => {
      toast.error("GPS Denied. Check browser permissions.");
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-black uppercase text-[10px] tracking-widest">Loading rules...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Terminal Settings</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage your geofence and office rules.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Business Identity */}
          <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-lg">Identity</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Name</label>
                <input 
                  type="text" 
                  value={config.businessName}
                  onChange={(e) => setConfig({...config, businessName: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-bold text-slate-800 transition-all outline-none"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo</label>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-inner relative group">
                    {config.photoURL ? (
                      <>
                        <img src={config.photoURL} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          type="button" 
                          onClick={() => setConfig({...config, photoURL: ""})}
                          className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X size={20} />
                        </button>
                      </>
                    ) : (
                      <Building2 className="text-slate-300" size={32} />
                    )}
                  </div>
                  <label className="flex-1 w-full p-4 bg-blue-50 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl cursor-pointer hover:bg-blue-100 transition-all font-bold text-sm text-center">
                    <Upload size={18} className="inline mr-2"/> Upload Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* GPS Guardrail */}
          <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center">
                  <MapPin size={24} />
                </div>
                <h3 className="font-black text-slate-900 text-lg">GPS Guardrail</h3>
              </div>
              <button 
                type="button"
                onClick={setCurrentLocation}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg font-black text-[10px] uppercase tracking-widest"
              >
                <Target size={18} /> Get Current GPS
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Coordinates</label>
                <div className={`p-5 rounded-2xl flex items-center gap-3 border-2 ${config.location.lat === 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-transparent text-slate-700'}`}>
                  <Navigation size={16} />
                  <span className="font-mono font-bold">
                    {config.location.lat.toFixed(6)}, {config.location.lng.toFixed(6)}
                  </span>
                </div>
                {config.location.lat === 0 && <p className="text-[9px] text-rose-500 font-bold uppercase italic">* Location not set! Scanning will fail.</p>}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allowed Radius (Meters)</label>
                <input 
                  type="number" 
                  value={config.geofenceRadius}
                  onChange={(e) => setConfig({...config, geofenceRadius: parseInt(e.target.value) || 0})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl text-slate-800 outline-none"
                />
              </div>
            </div>
          </section>

          <AdminQR />
        </div>

        {/* Sidebar Save */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[3rem] sticky top-8 text-white shadow-2xl">
            <h4 className="font-black uppercase text-[10px] tracking-widest text-blue-400 mb-4">Finalize</h4>
            <p className="text-sm opacity-70 mb-8 leading-relaxed">
              Updating these rules affects all employee scans immediately. Ensure you are physically at the office when clicking "Get Current GPS".
            </p>
            <button 
              disabled={isSaving}
              type="submit"
              className="w-full py-6 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              {isSaving ? "Syncing..." : "Save Settings"}
              <Save size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}