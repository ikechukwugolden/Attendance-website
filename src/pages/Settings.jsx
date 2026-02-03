import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Save, Clock, MapPin, Loader2, Target, Info, Building2, Upload, X } from "lucide-react";
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
        // Fetch rules and user identity in parallel
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

  // Handle local image upload (converts to Base64 for Firestore)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 strings
        return toast.error("Image too large (Max 1MB)");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, photoURL: reader.result });
        toast.success("Image preview loaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Save Rules
      const docRef = doc(db, "business_settings", user.uid);
      const { businessName, photoURL, ...rules } = config;
      await setDoc(docRef, rules, { merge: true });

      // 2. Save Identity to User profile
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        businessName: config.businessName,
        photoURL: config.photoURL
      });
      
      toast.success("Business settings synced!");
    } catch (error) {
      console.error(error);
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
      toast.success("GPS Captured!");
    }, (err) => {
      toast.error("GPS Denied. Please enable location.");
    }, { enableHighAccuracy: true });
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-black uppercase text-[10px] tracking-widest">Loading encrypted rules...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Workplace Setup</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Configure identity and operational boundaries.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Identity & Upload Section */}
          <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-lg">Business Identity</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Name</label>
                <input 
                  type="text" 
                  value={config.businessName}
                  onChange={(e) => setConfig({...config, businessName: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-bold text-slate-800 transition-all outline-none"
                  placeholder="Enter Business Name"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Logo</label>
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
                  
                  <div className="flex-1 w-full space-y-2">
                    <label className="flex items-center justify-center gap-2 w-full p-4 bg-blue-50 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl cursor-pointer hover:bg-blue-100 transition-all font-bold text-sm">
                      <Upload size={18} />
                      Upload Logo
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    <p className="text-[9px] text-slate-400 text-center uppercase tracking-tighter">Recommended: Square PNG/JPG (Max 1MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Timing Parameters */}
          <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                <Clock size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-lg">Shift Rules</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Starts</label>
                <input 
                  type="time" 
                  value={config.shiftStart}
                  onChange={(e) => setConfig({...config, shiftStart: e.target.value})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl text-slate-800 outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grace Period (Mins)</label>
                <input 
                  type="number" 
                  value={config.gracePeriod}
                  onChange={(e) => setConfig({...config, gracePeriod: parseInt(e.target.value) || 0})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl text-slate-800 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Geofence Rules */}
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
                className="p-4 bg-slate-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <Target size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Coordinates</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-5 bg-slate-100 rounded-2xl font-bold text-slate-500 text-xs">
                    {config.location.lat.toFixed(5)}, {config.location.lng.toFixed(5)}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radius (Meters)</label>
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

        {/* Sidebar Save Button */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[3rem] sticky top-8 text-white shadow-2xl">
            <h4 className="font-black uppercase text-[10px] tracking-widest text-blue-400 mb-4">Verification</h4>
            <p className="text-sm font-medium leading-relaxed opacity-70 mb-8">
              Settings update instantly. The QR terminal will automatically reflect your new business name and logo.
            </p>
            <button 
              disabled={isSaving}
              type="submit"
              className="w-full py-6 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              {isSaving ? "Syncing..." : "Update Business"}
              <Save size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}