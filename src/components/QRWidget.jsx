import { QRCodeCanvas } from "qrcode.react";
import { Download, Share2, Printer } from "lucide-react";
import { toast } from "react-hot-toast";

export default function QRWidget({ businessId, businessName }) {
  // 🟢 VERCEL FIX: Use window.location.origin to get your live https://... url
  // This removes the need for IP addresses or localhost
  const scanUrl = `${window.location.origin}/scan?bid=${businessId}`;

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
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-2xl flex flex-col items-center">
      <div className="text-center mb-6">
        <h3 className="text-slate-900 font-black uppercase tracking-widest text-sm">
          Check-in Terminal
        </h3>
        <p className="text-[10px] text-slate-400 font-bold mt-1">
          {businessName}
        </p>
      </div>

      {/* Optimized for scanning on mobile screens */}
      <div className="p-4 bg-white border-[6px] border-slate-900 rounded-[2.5rem] shadow-xl">
        <QRCodeCanvas
          id="qr-terminal"
          value={scanUrl}
          size={240}
          level={"M"} // Medium level for better balance of scannability and reliability
          includeMargin={false}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>

      <div className="mt-8 w-full space-y-3">
        <button 
          onClick={downloadQR}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
        >
          <Download size={16} /> Download PNG
        </button>

        <button 
          onClick={copyLink}
          className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
        >
          <Share2 size={16} /> Copy Terminal URL
        </button>
        
        <div className="pt-4 flex items-center justify-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
             Live Terminal Active
           </p>
        </div>
      </div>
    </div>
  );
}