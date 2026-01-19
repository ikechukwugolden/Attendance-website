import { useState } from "react";
import { Download, FileText, Filter } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { toast } from "react-hot-toast";

export default function Reports() {
  const [isExporting, setIsExporting] = useState(false);

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      // 1. Fetch data from Firestore
      const q = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => doc.data());

      if (logs.length === 0) {
        toast.error("No data available to export");
        return;
      }

      // 2. Define CSV Headers
      const headers = ["Employee Name", "Department", "Date", "Time", "Status", "Location"];
      
      // 3. Map logs to CSV rows
      const rows = logs.map(log => [
        log.userName,
        log.department || "General",
        log.timestamp?.toDate().toLocaleDateString() || "N/A",
        log.timestamp?.toDate().toLocaleTimeString() || "N/A",
        log.status,
        log.location ? `${log.location.lat};${log.location.lng}` : "No GPS"
      ]);

      // 4. Create CSV Content String
      const csvContent = [
        headers.join(","), 
        ...rows.map(row => row.join(","))
      ].join("\n");

      // 5. Trigger Browser Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Attendly_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV Downloaded Successfully");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Attendance Reports</h2>
          <p className="text-sm text-slate-500">Export historical logs for payroll and HR</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleCSVExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium bg-white"
          >
            <Download size={18} className={isExporting ? "animate-bounce" : ""} /> 
            {isExporting ? "Processing..." : "Export CSV"}
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
            <FileText size={18} /> Generate PDF
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Date Range</label>
          <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Department</label>
          <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Marketing</option>
            <option>Sales</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-semibold shadow-sm">
            <Filter size={16} /> Apply Filters
          </button>
        </div>
      </div>

      {/* Quick Summary Preview */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-100">
        <div className="text-center md:text-left">
          <h3 className="text-2xl font-bold">Ready for Payroll?</h3>
          <p className="text-blue-100 mt-1">Filtered reports can be directly imported into your HR software.</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 text-center min-w-[150px]">
          <p className="text-sm font-medium text-blue-100">Total Entries Found</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </div>
      </div>
    </div>
  );
}