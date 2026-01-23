import { QRCodeCanvas } from "qrcode.react";
import { Download, Share2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function QRWidget({ businessId, businessName }) {
  // 🟢 LIVE PRODUCTION FIX
  // Replace 'your-app.vercel.app' with your actual Vercel domain
  const PRODUCTION_URL = "https://your-app-name.vercel.app"; 

  // If the dashboard is opened on localhost, we force the QR to use the Vercel link.
  // Otherwise, it uses the current live origin.
  const baseUrl = window.location.hostname === "localhost" 
    ? PRODUCTION_URL 
    : window.location.origin;

  const scanUrl = `${baseUrl}/scan?bid=${businessId}`;

  const downloadQR = () => {
    const canvas = document.getElementById("qr-terminal");
    if (!canvas) return;
    
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${businessName || 'Business'}-QR.png`;
    downloadLink.click();
    toast.success("QR Code downloaded!");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(scanUrl);
    toast.success("Terminal Link copied!");
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-2xl flex flex-col items-center">
      <div className="text-center mb-6">
        <h3 className="text-slate-900 font-black uppercase tracking-widest text-sm">
          Check-in Terminal
        </h3>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
          {businessName || "Authorized Access Only"}
        </p>
      </div>

      {/* QR Container */}
      <div className="p-4 bg-white border-[6px] border-slate-900 rounded-[2.5rem] shadow-xl">
        <QRCodeCanvas
          id="qr-terminal"
          value={scanUrl}
          size={240}
          level={"M"}
          includeMargin={false}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>

      <div className="mt-8 w-full space-y-3">
        <button 
          onClick={downloadQR}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
        >
          <Download size={16} /> Download PNG
        </button>

        <button 
          onClick={copyLink}
          className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
        >
          <Share2 size={16} /> Copy Terminal URL
        </button>
        
        <div className="pt-4 flex items-center justify-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
             Cloud Sync Active
           </p>
        </div>
      </div>
    </div>
  );
}