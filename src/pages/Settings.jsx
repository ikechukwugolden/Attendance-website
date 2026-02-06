import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Changed to setDoc for safety
import { useAuth } from "../context/AuthContext";
import { Save, Clock, MapPin, Loader2, Target, Building2, Upload, X, Navigation, ShieldCheck, Timer } from "lucide-react";
import { toast } from "react-hot-toast";
import AdminQR from "../components/AdminQR";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [config, setConfig] = useState({
    businessName: "",
    photoURL: "",
    shiftStart: "09:00",
    gracePeriod: 15,
    location: { lat: 0, lng: 0 }, 
    geofenceRadius: 150 
  });

  useEffect(() => {
    async function fetchSettings() {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "business_settings", user.uid);
        const userRef = doc(db, "users", user.uid);
        const [rulesSnap, userSnap] = await Promise.all([getDoc(docRef), getDoc(userRef)]);
        
        const rulesData = rulesSnap.exists() ? rulesSnap.data() : {};
        const userData = userSnap.exists() ? userSnap.data() : {};

        setConfig({
          ...rulesData,
          businessName: userData.businessName || "",
          photoURL: userData.photoURL || "",
          location: rulesData.location || { lat: 0, lng: 0 },
          geofenceRadius: rulesData.geofenceRadius || 150,
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
    if (file && file.size <= 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setConfig({ ...config, photoURL: reader.result });
      reader.readAsDataURL(file);
    } else if (file) {
      toast.error("Image too large (Max 1MB)");
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (config.location.lat === 0) return toast.error("Please lock a GPS location first!");
    
    setIsSaving(true);
    const toastId = toast.loading("Deploying Terminal Settings...");
    try {
      const docRef = doc(db, "business_settings", user.uid);
      const userRef = doc(db, "users", user.uid);
      const { businessName, photoURL, ...rules } = config;

      // Use setDoc with merge:true for BOTH to prevent "document not found" errors
      await Promise.all([
        setDoc(docRef, rules, { merge: true }),
        setDoc(userRef, { businessName, photoURL }, { merge: true })
      ]);
      
      toast.success("Terminal Synced & Live!", { id: toastId });
    } catch (error) {
      toast.error("Update failed", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const setCurrentLocation = () => {
    setIsLocating(true);
    const toastId = toast.loading("Calibrating Precision Lock...");
    
    const geoOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
    let bestReading = null;
    
    const watchId = navigator.geolocation.watchPosition((pos) => {
      if (!bestReading || pos.coords.accuracy < bestReading.coords.accuracy) {
        bestReading = pos;
      }
      if (pos.coords.accuracy < 10) finalize(pos);
    }, (err) => {
      setIsLocating(false);
      toast.error("GPS Denied.", { id: toastId });
    }, geoOptions);

    const finalize = (pos) => {
      navigator.geolocation.clearWatch(watchId);
      setConfig(prev => ({
        ...prev,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
      }));
      setIsLocating(false);
      toast.success(`Locked! Accuracy: ${Math.round(pos.coords.accuracy)}m`, { id: toastId });
    };

    setTimeout(() => {
      if (bestReading && isLocating) finalize(bestReading);
      navigator.geolocation.clearWatch(watchId);
      setIsLocating(false);
    }, 10000);
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-black uppercase text-[10px] tracking-widest text-center">Syncing...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Terminal Settings</h2>
        <p className="text-slate-500 text-sm font-medium mt-1 italic">Precision Geofencing & Identity Control</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* PROFILE SECTION */}
          <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center"><Building2 size={24} /></div>
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Business Profile</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Title</label>
                <input 
                  type="text" 
                  value={config.businessName}
                  onChange={(e) => setConfig({...config, businessName: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-bold text-slate-800 outline-none shadow-inner"
                  placeholder="e.g. Rad5 Tech Hub"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Logo</label>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative group">
                    {config.photoURL ? (
                      <><img src={config.photoURL} className="w-full h-full object-cover" alt="Preview" />
                        <button type="button" onClick={() => setConfig({...config, photoURL: ""})} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={20} /></button>
                      </>
                    ) : <Building2 className="text-slate-300" size={32} />}
                  </div>
                  <label className="flex-1 w-full p-4 bg-blue-50 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl cursor-pointer font-bold text-sm text-center">
                    <Upload size={18} className="inline mr-2"/> Change Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* NEW: TIME SCHEDULE SECTION */}
          <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center"><Clock size={24} /></div>
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Work Schedule</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Start Time</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={config.shiftStart}
                    onChange={(e) => setConfig({...config, shiftStart: e.target.value})}
                    className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl text-slate-800 outline-none focus:ring-2 ring-blue-500 shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grace Period (Minutes)</label>
                <div className="relative">
                   <input 
                    type="number" 
                    value={config.gracePeriod}
                    onChange={(e) => setConfig({...config, gracePeriod: parseInt(e.target.value) || 0})}
                    className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl text-slate-800 outline-none focus:ring-2 ring-blue-500 shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none font-bold">min</div>
                </div>
              </div>
            </div>
          </section>

          {/* GPS SECTION */}
          <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center"><MapPin size={24} /></div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">GPS Guardrail</h3>
              </div>
              <button type="button" disabled={isLocating} onClick={setCurrentLocation} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50">
                {isLocating ? <Loader2 className="animate-spin" size={18} /> : <Target size={18} />} 
                {isLocating ? "Syncing..." : "Lock Hub Location"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Hub Coordinates</label>
                <div className={`p-5 rounded-2xl flex items-center gap-3 border-2 ${config.location.lat === 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-transparent text-slate-700'}`}>
                  <Navigation size={16} /><span className="font-mono font-bold tracking-tight">{config.location.lat.toFixed(6)}, {config.location.lng.toFixed(6)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allowed Radius (Meters)</label>
                <div className="relative">
                   <input type="number" value={config.geofenceRadius} onChange={(e) => setConfig({...config, geofenceRadius: parseInt(e.target.value) || 0})}
                    className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl text-slate-800 outline-none focus:ring-2 ring-blue-500 shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none font-bold">m</div>
                </div>
              </div>
            </div>
          </section>

          <AdminQR />
        </div>

        {/* SIDEBAR SAVE */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[3rem] sticky top-8 text-white shadow-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-emerald-400"><ShieldCheck size={18} /><h4 className="font-black uppercase text-[10px] tracking-widest">Security Deployment</h4></div>
            <p className="text-sm opacity-70 mb-8 leading-relaxed font-medium">Updating these rules will instantly affect all staff check-ins.</p>
            <button disabled={isSaving || isLocating} type="submit" className="w-full py-6 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
              {isSaving ? "Syncing..." : "Save Terminal Rules"} <Save size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}