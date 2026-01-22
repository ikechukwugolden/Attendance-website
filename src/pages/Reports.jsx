import { useState, useEffect } from "react";
import { Download, FileText, Filter, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // 🟢 Added for security
import { toast } from "react-hot-toast";

export default function Reports() {
  const { user } = useAuth(); // 🟢 Get current Admin info
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);
  
  const [dateFilter, setDateFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const fetchReportStats = async () => {
    if (!user?.uid) return; // 🟢 Safety check
    setLoading(true);
    try {
      // 🟢 SECURITY: Only fetch logs for THIS admin's businessId
      let q = query(
        collection(db, "attendance_logs"), 
        where("businessId", "==", user.uid), 
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);
      let filteredData = snapshot.docs.map(doc => doc.data());
      
      // Filter by Department
      if (deptFilter !== "All Departments") {
        filteredData = filteredData.filter(log => log.department === deptFilter);
      }

      // Filter by Date
      if (dateFilter) {
        filteredData = filteredData.filter(log => {
          const logDate = log.timestamp?.toDate().toISOString().split('T')[0];
          return logDate === dateFilter;
        });
      }

      // Filter by Status
      if (statusFilter !== "All Statuses") {
        filteredData = filteredData.filter(log => log.status === statusFilter);
      }

      setTotalEntries(filteredData.length);
    } catch (error) {
      console.error("Stats Error:", error);
      toast.error("Could not sync report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportStats();
  }, [user, deptFilter, dateFilter, statusFilter]);

  const handleCSVExport = async () => {
    if (totalEntries === 0) return;
    setIsExporting(true);
    try {
      // 🟢 SECURITY: Re-verify businessId on export
      const q = query(
        collection(db, "attendance_logs"), 
        where("businessId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      let logs = snapshot.docs.map(doc => doc.data());

      // Re-apply filters for export
      if (deptFilter !== "All Departments") logs = logs.filter(l => l.department === deptFilter);
      if (dateFilter) logs = logs.filter(l => l.timestamp?.toDate().toISOString().split('T')[0] === dateFilter);
      if (statusFilter !== "All Statuses") logs = logs.filter(l => l.status === statusFilter);

      // Professional CSV structure
      const reportTitle = [`"Attendance Report: ${user.businessName || 'My Station'}"`];
      const subHeader = [`"Status Filter: ${statusFilter}"`, `"Generated: ${new Date().toLocaleString()}"`];
      const headers = ["Employee Name", "Email", "Date", "Time", "Status", "Coordinates"];
      
      const rows = logs.map(log => [
        `"${log.userName || 'Unknown'}"`,
        `"${log.userEmail || 'N/A'}"`,
        log.timestamp?.toDate().toLocaleDateString() || "N/A",
        log.timestamp?.toDate().toLocaleTimeString() || "N/A",
        log.status,
        log.location ? `${log.location.lat};${log.location.lng}` : "No GPS"
      ]);

      const csvContent = [
        reportTitle.join(","),
        subHeader.join(","),
        "", // Spacer
        headers.join(","), 
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${user.businessName || 'Attendly'}_${statusFilter}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV Exported Successfully");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-slate-500 font-medium italic">Business: {user?.businessName || "General Station"}</p>
        </div>
        <button 
          onClick={handleCSVExport}
          disabled={isExporting || totalEntries === 0}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} 
          Export CSV
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Date Range</label>
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Department</label>
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
          >
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Marketing</option>
            <option>Sales</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Attendance Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-blue-600 cursor-pointer"
          >
            <option>All Statuses</option>
            <option>Early</option>
            <option>On-Time</option>
            <option>Late</option>
          </select>
        </div>
      </div>

      {/* Conditional "No Data" State */}
      {!loading && totalEntries === 0 && (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <FileText className="text-slate-200 mb-4" size={64} />
          <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No matching logs found</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold">Search Results</h3>
            <p className="text-slate-400 text-sm">Filtered database entries</p>
            <p className="text-6xl font-black mt-4">{loading ? "..." : totalEntries}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-3xl border border-white/10 relative z-10">
             {statusFilter === "Late" && <AlertCircle size={48} className="text-red-400" />}
             {statusFilter === "On-Time" && <CheckCircle2 size={48} className="text-emerald-400" />}
             {statusFilter === "Early" && <Clock size={48} className="text-blue-400" />}
             {statusFilter === "All Statuses" && <Filter size={48} className="text-slate-400" />}
          </div>
        </div>

        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-center">
          <p className="font-bold text-blue-100 text-[10px] uppercase tracking-widest opacity-60">Report Context</p>
          <h3 className="text-3xl font-black mt-1">
             {statusFilter === "All Statuses" ? "Full Data Set" : `${statusFilter} Log View`}
          </h3>
          <p className="mt-4 text-blue-50 text-xs font-medium leading-relaxed opacity-80">
            This generated report captures the {statusFilter.toLowerCase()} performance of your staff. Use this data for payroll adjustments and productivity reviews.
          </p>
        </div>
      </div>
    </div>
  );
}