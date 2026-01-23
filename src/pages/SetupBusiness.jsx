import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, ShieldCheck, ArrowRight, Navigation, Camera, UploadCloud } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";

// Helper to fix the Leaflet "Grey Box" bug
function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView([coords.lat, coords.lng]);
    map.invalidateSize();
  }, [coords, map]);
  return null;
}

function LocationPicker({ setCoords }) {
  useMapEvents({
    click(e) {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function SetupBusiness() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [businessName, setBusinessName] = useState("");
  const [businessLogo, setBusinessLogo] = useState(null); // 🟢 Base64 String
  const [shiftStart, setShiftStart] = useState("09:00");
  const [gracePeriod, setGracePeriod] = useState(15);
  const [coords, setCoords] = useState({ lat: 6.5244, lng: 3.3792 });

  // 🟢 Handle Photo Selection & Conversion to Base64
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048487) { // 1MB Limit for Firestore string safety
        return toast.error("Image too large. Please use a file under 1MB.");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessLogo(reader.result);
        toast.success("Logo uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteSetup = async () => {
    if (!businessName) return toast.error("Business name is required");
    
    setLoading(true);
    try {
      const user = auth.currentUser;
      const businessData = {
        businessName,
        businessLogo, // 🟢 Now saved in Firestore
        settings: {
          shiftStart,
          gracePeriod: Number(gracePeriod),
          location: coords,
          geofenceRadius: 200, 
        },
        hasCompletedSetup: true,
        updatedAt: new Date(),
      };

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, businessData, { merge: true });
      
      toast.success("System calibrated!");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 800);

    } catch (error) {
      console.error("Setup Error:", error);
      toast.error("Failed to save settings");
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      toast.success("GPS Locked!");
    }, () => {
      toast.error("Location access denied.");
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* LEFT: PROGRESS SECTION */}
        <div className="md:w-1/3 bg-blue-600 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic mb-4">Initial Calibration</h1>
            <p className="text-blue-100 text-sm font-medium leading-relaxed">
              Define your office boundaries, upload your logo, and set work hours.
            </p>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 ${step === s ? 'bg-white text-blue-600 border-white' : 'border-blue-400 text-blue-300'}`}>
                  {s}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${step === s ? 'text-white' : 'text-blue-300'}`}>
                  {s === 1 ? 'Identity' : s === 2 ? 'Geofence' : 'Schedule'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: INTERACTIVE FORM */}
        <div className="flex-1 p-10 md:p-16 flex flex-col justify-center">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center">
              <h2 className="text-2xl font-black text-slate-900 mb-2 self-start">Business Identity</h2>
              <p className="text-slate-400 text-sm mb-8 self-start">Set your name and brand logo.</p>
              
              {/* 🟢 PHOTO UPLOAD UI */}
              <div className="relative group mb-8">
                <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] border-4 border-slate-50 overflow-hidden flex items-center justify-center shadow-inner transition-all group-hover:border-blue-100">
                  {businessLogo ? (
                    <img src={businessLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud className="text-slate-300" size={40} />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-900 transition-all">
                  <Camera size={20} />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              <input 
                type="text" 
                placeholder="e.g. Nexa Digital Hub"
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none transition-all font-bold text-lg"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <button onClick={() => setStep(2)} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200">
                Next <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Steps 2 and 3 remain the same as your previous logic */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900">Office Location</h2>
                <button onClick={useCurrentLocation} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-2 rounded-xl">
                  <Navigation size={14} /> GPS Lock
                </button>
              </div>
              
              <div className="h-64 rounded-2xl overflow-hidden border-4 border-slate-50 mb-6 z-10 shadow-inner">
                <MapContainer center={[coords.lat, coords.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[coords.lat, coords.lng]} />
                  <LocationPicker setCoords={setCoords} />
                  <MapRecenter coords={coords} />
                </MapContainer>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest">Back</button>
                <button onClick={() => setStep(3)} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 mb-8">Work Hours</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Daily Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="time" 
                      className="w-full p-5 pl-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg outline-none focus:border-blue-600"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Lateness Grace (Mins)</label>
                  <input 
                    type="number" 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg outline-none focus:border-blue-600"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest">Back</button>
                <button 
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? "Saving Config..." : "Finalize & Launch"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}