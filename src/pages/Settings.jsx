import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import {
  Save, Clock, MapPin, Loader2, Target, Building2, 
  Upload, X, ShieldCheck, Zap, ZapOff, Search, Layers
} from "lucide-react";
import { toast } from "react-hot-toast";
import AdminQR from "../components/AdminQR";

// Leaflet imports
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
});

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapType, setMapType] = useState('streets'); // 'streets' or 'satellite'
  const [tempLocation, setTempLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [config, setConfig] = useState({
    businessName: "",
    photoURL: "",
    shiftStart: "09:00",
    gracePeriod: 15,
    location: { lat: 0, lng: 0 },
    geofenceRadius: 150,
    gpsRequired: true,
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

        const finalData = {
          ...rulesData,
          businessName: userData.businessName || "",
          photoURL: userData.photoURL || "",
          location: rulesData.location || { lat: 0, lng: 0 },
          geofenceRadius: rulesData.geofenceRadius || 150,
          shiftStart: rulesData.shiftStart || "09:00",
          gracePeriod: rulesData.gracePeriod || 15,
          gpsRequired: rulesData.gpsRequired ?? true,
        };

        setConfig(finalData);
        if (finalData.location.lat !== 0) {
          setTempLocation([finalData.location.lat, finalData.location.lng]);
        }
      } catch (error) {
        toast.error("Could not load settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [user]);

  // SMART SEARCH: Handles "Third Floor", "RAD5", and Coordinates
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    const toastId = toast.loading("Locating building...");
    try {
      // 1. Check for raw coordinates first
      const coordMatch = searchQuery.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
      if (coordMatch) {
        setTempLocation([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]);
        toast.success("Coordinates locked!", { id: toastId });
        return;
      }

      // 2. Clean query: Remove "Floor" words that break geocoders
      const cleaned = searchQuery
        .replace(/(?:first|second|third|fourth|fifth|floor|rm|room|suite|level)/gi, "")
        .replace(/\s+/g, ' ')
        .trim();

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleaned)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setTempLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        toast.success(`Found: ${data[0].display_name.split(',')[0]}`, { id: toastId });
      } else {
        toast.error("Location not found. Try 'Factory Road Aba'", { id: toastId });
      }
    } catch (error) {
      toast.error("Search service busy.", { id: toastId });
    }
  };

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

  const setCurrentLocation = () => {
    setIsLocating(true);
    const toastId = toast.loading("Calibrating GPS...");
    const geoOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setConfig(prev => ({ ...prev, location: { lat: latitude, lng: longitude } }));
        setTempLocation([latitude, longitude]);
        setIsLocating(false);
        toast.success(`Locked! Accuracy: ${Math.round(accuracy)}m`, { id: toastId });
      },
      () => {
        setIsLocating(false);
        toast.error("GPS Denied", { id: toastId });
      },
      geoOptions
    );
  };

  function LocationMarker() {
    const map = useMapEvents({
      click(e) { setTempLocation([e.latlng.lat, e.latlng.lng]); },
    });
    useEffect(() => {
      if (tempLocation) map.setView(tempLocation, map.getZoom());
    }, [tempLocation, map]);

    return tempLocation ? (
      <Marker position={tempLocation} draggable={true} eventHandlers={{
        dragend: (e) => setTempLocation([e.target.getLatLng().lat, e.target.getLatLng().lng])
      }} />
    ) : null;
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Syncing...");
    try {
      const { businessName, photoURL, ...rules } = config;
      await Promise.all([
        setDoc(doc(db, "business_settings", user.uid), rules, { merge: true }),
        setDoc(doc(db, "users", user.uid), { businessName, photoURL }, { merge: true })
      ]);
      toast.success("Terminal Live!", { id: toastId });
    } catch (error) {
      toast.error("Sync failed", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center italic font-black text-slate-400">SYNCING...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
      <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Terminal Settings</h2>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Business Profile */}
          <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
            <h3 className="font-black text-slate-900 uppercase mb-8">Business Profile</h3>
            <div className="space-y-6">
              <input 
                type="text" 
                value={config.businessName}
                onChange={(e) => setConfig({...config, businessName: e.target.value})}
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold"
                placeholder="Business Name"
              />
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                  {config.photoURL ? <img src={config.photoURL} className="w-full h-full object-cover" /> : <Building2 className="m-auto h-full text-slate-300" />}
                </div>
                <label className="flex-1 p-4 bg-blue-50 text-blue-600 rounded-2xl cursor-pointer font-bold text-center">
                  <Upload size={18} className="inline mr-2"/> Change Logo
                  <input type="file" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </section>

          {/* Location Rules */}
          <section className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-slate-900 uppercase">Location Rules</h3>
              <button 
                type="button"
                onClick={() => setConfig({...config, gpsRequired: !config.gpsRequired})}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${config.gpsRequired ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700 ring-2 ring-amber-500'}`}
              >
                {config.gpsRequired ? <Zap size={14}/> : <ZapOff size={14}/>} {config.gpsRequired ? "GPS Active" : "GPS Bypassed"}
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Hub Center (Lat/Lng)</label>
                  <div className="p-4 bg-slate-50 rounded-2xl font-mono text-xs text-slate-500">
                    {config.location.lat.toFixed(6)}, {config.location.lng.toFixed(6)}
                  </div>
                </div>
                <button type="button" onClick={setCurrentLocation} className="w-full md:w-auto p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600">
                  {isLocating ? <Loader2 className="animate-spin" /> : <Target size={20} />}
                  <span className="font-black uppercase text-[10px]">Lock Current GPS</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2"
              >
                <MapPin size={18}/> {showMapPicker ? "Close Map" : "Open World Map Picker"}
              </button>

              {showMapPicker && (
                <div className="border rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                  <div className="p-4 bg-slate-900 flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                       <input
                        type="text"
                        placeholder="e.g. RAD5 Tech Hub Factory Road"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                        className="w-full p-3 pl-10 bg-slate-800 text-white rounded-xl text-sm outline-none border border-slate-700 focus:border-blue-500"
                      />
                      <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleSearch} className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase">Search</button>
                      <button 
                        type="button" 
                        onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
                        className={`p-3 rounded-xl transition-colors ${mapType === 'satellite' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                      >
                        <Layers size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-96 w-full">
                    <MapContainer center={tempLocation || [5.122, 7.351]} zoom={18} style={{ height: "100%", width: "100%" }}>
                      <TileLayer 
                        url={mapType === 'streets' 
                          ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                          : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                        }
                        attribution='&copy; OpenStreetMap & Esri'
                      />
                      <LocationMarker />
                    </MapContainer>
                  </div>

                  <div className="p-4 bg-slate-50 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Drag pin to center of building</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowMapPicker(false)} className="px-6 py-2 bg-slate-200 rounded-xl font-bold text-xs uppercase">Cancel</button>
                      <button type="button" onClick={() => {
                        setConfig({...config, location: { lat: tempLocation[0], lng: tempLocation[1] }});
                        setShowMapPicker(false);
                        toast.success("Position Confirmed!");
                      }} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-emerald-200">Confirm Pin</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Geofence Radius (Meters)</label>
                  <input type="number" value={config.geofenceRadius} onChange={(e) => setConfig({...config, geofenceRadius: parseInt(e.target.value) || 0})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-lg" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Grace Period (Min)</label>
                  <input type="number" value={config.gracePeriod} onChange={(e) => setConfig({...config, gracePeriod: parseInt(e.target.value) || 0})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-lg" />
                </div>
              </div>
            </div>
          </section>

          <AdminQR />
        </div>

        {/* Save Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[3rem] sticky top-8 text-white shadow-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-emerald-400"><ShieldCheck size={18} /><h4 className="font-black uppercase text-[10px] tracking-widest">System Guard</h4></div>
            <p className="text-sm opacity-70 mb-8 leading-relaxed font-medium italic">Changes update all staff terminals instantly.</p>
            <button disabled={isSaving || isLocating} type="submit" className="w-full py-6 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-blue-500 transition-all active:scale-95">
              {isSaving ? "Syncing..." : "Publish Rules"} <Save size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}