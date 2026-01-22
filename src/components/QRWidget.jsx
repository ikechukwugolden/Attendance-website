import { QRCodeCanvas } from "qrcode.react";
import { Download, Share2, Printer } from "lucide-react";
import { toast } from "react-hot-toast";

export default function QRWidget({ businessId, businessName }) {
  // Use your Network IP here so your phone can connect
  const networkIp = "192.168.1.5"; // 👈 DOUBLE CHECK THIS IP IN YOUR TERMINAL
  const scanUrl = `http://${networkIp}:5173/scan?bid=${businessId}`;

  const downloadQR = () => {
    const canvas = document.getElementById("qr-terminal");
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `Terminal-QR.png`;
    downloadLink.click();
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-2xl flex flex-col items-center">
      <h3 className="text-slate-900 font-black mb-6 uppercase tracking-widest text-sm">
        Scan to Clock In
      </h3>

      {/* 🟢 HIGH SCANNABILITY SETTINGS */}
      <div className="p-4 bg-white border-4 border-slate-900 rounded-3xl">
        <QRCodeCanvas
          id="qr-terminal"
          value={scanUrl}
          size={220} // Larger size
          level={"L"} // 👈 Lower complexity = Larger blocks = Faster scanning
          marginSize={2}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>

      <div className="mt-8 w-full space-y-3">
        <button 
          onClick={downloadQR}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <Download size={18} /> Save QR Code
        </button>
        
        <p className="text-[10px] text-slate-400 text-center font-medium">
          Make sure your phone is on the same Wi-Fi as this computer.
        </p>
      </div>
    </div>
  );
}