import { useRef } from "react";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import { Download, Printer, QrCode } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminQR() {
  const { user } = useAuth();
  const qrRef = useRef(null);

  // Fallback to empty string if user UID isn't available yet to prevent broken QR
  const scanUrl = user?.uid 
    ? `${window.location.origin}/scan?bid=${user.uid}` 
    : "";

  const downloadQR = () => {
    if (!qrRef.current || !user?.uid) {
      toast.error("Please wait for business data to load");
      return;
    }

    // Adding backgroundColor ensures the PNG doesn't have a transparent background
    toPng(qrRef.current, { 
      cacheBust: true,
      backgroundColor: "#ffffff",
      style: { borderRadius: '0' } // Ensure sharp corners for the export
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${user?.businessName || "Business"}-Attendance-QR.png`;
        link.href = dataUrl;
        link.click();
        toast.success("QR Code downloaded!");
      })
      .catch((err) => {
        toast.error("Failed to generate image");
        console.error(err);
      });
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
      <div className="text-center">
        <h3 className="text-2xl font-black text-slate-900 italic flex items-center justify-center gap-2">
          <QrCode className="text-blue-600" /> Terminal Poster
        </h3>
        <p className="text-slate-400 text-sm font-bold mt-1">Print and place at your office entrance</p>
      </div>

      {/* The Printable Poster Area */}
      <div 
        ref={qrRef} 
        className="bg-white p-12 rounded-[2rem] border-4 border-slate-900 flex flex-col items-center shadow-sm w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
            {user?.businessName || "My Business"}
          </h2>
          <p className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-[0.2em] mt-2 inline-block">
            Secure Attendance Portal
          </p>
        </div>

        <div className="bg-white p-4 rounded-3xl border-2 border-slate-50">
          {scanUrl ? (
            <QRCode 
              value={scanUrl} 
              size={200}
              level="H" // High error correction for better mobile scanning
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center bg-slate-50 rounded-xl">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-tight">
            Scan to Clock-In / Out
          </p>
          <p className="text-[10px] text-slate-300 font-bold mt-2 italic">
            AMP v2.0 Secured Terminal
          </p>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={downloadQR}
          disabled={!user?.uid}
          className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50"
        >
          <Download size={18} /> Download PNG
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 bg-slate-50 text-slate-400 py-4 rounded-2xl font-black hover:bg-slate-100 transition-all"
        >
          <Printer size={18} />
        </button>
      </div>
    </div>
  );
}