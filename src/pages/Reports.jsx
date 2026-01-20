import { useState, useEffect } from "react";
import { Download, FileText, Filter, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { toast } from "react-hot-toast";

export default function Reports() {
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);
  
  // Filter States
  const [dateFilter, setDateFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const fetchReportStats = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"));

      if (deptFilter !== "All Departments") {
        q = query(q, where("department", "==", deptFilter));
      }

      const snapshot = await getDocs(q);
      let filteredData = snapshot.docs.map(doc => doc.data());
      
      // Filter by Date
      if (dateFilter) {
        filteredData = filteredData.filter(log => {
          const logDate = log.timestamp?.toDate().toISOString().split('T')[0];
          return logDate === dateFilter;
        });
      }

      // NEW: Filter by Status (Early, On-Time, Late)
      if (statusFilter !== "All Statuses") {
        filteredData = filteredData.filter(log => log.status === statusFilter);
      }

      setTotalEntries(filteredData.length);
    } catch (error) {
      console.error("Stats Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportStats();
  }, [deptFilter, dateFilter, statusFilter]);

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      const q = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      let logs = snapshot.docs.map(doc => doc.data());

      // Apply the same filters to the export
      if (deptFilter !== "All Departments") logs = logs.filter(l => l.department === deptFilter);
      if (dateFilter) logs = logs.filter(l => l.timestamp?.toDate().toISOString().split('T')[0] === dateFilter);
      if (statusFilter !== "All Statuses") logs = logs.filter(l => l.status === statusFilter);

      if (logs.length === 0) {
        toast.error("No data available for this selection");
        return;
      }

      const headers = ["Employee Name", "Department", "Date", "Time", "Status", "Location"];
      const rows = logs.map(log => [
        `"${log.userName || 'Unknown'}"`,
        `"${log.department || "General"}"`,
        log.timestamp?.toDate().toLocaleDateString() || "N/A",
        log.timestamp?.toDate().toLocaleTimeString() || "N/A",
        log.status,
        log.location ? `${log.location.lat};${log.location.lng}` : "No GPS"
      ]);

      const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Attendly_${statusFilter}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${statusFilter} Report Downloaded!`);
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
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Attendance Reports</h2>
          <p className="text-sm text-slate-500 font-medium italic">Filter by status to identify arrival patterns</p>
        </div>
        <button 
          onClick={handleCSVExport}
          disabled={isExporting || totalEntries === 0}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} 
          Download {statusFilter === "All Statuses" ? "Full" : statusFilter} Report
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Date</label>
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Department</label>
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
          >
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Marketing</option>
            <option>Sales</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Arrival Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-blue-600"
          >
            <option>All Statuses</option>
            <option>Early</option>
            <option>On-Time</option>
            <option>Late</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl">
          <div>
            <h3 className="text-lg font-bold">Total Matches</h3>
            <p className="text-slate-400 text-sm">Based on your filters</p>
            <p className="text-5xl font-black mt-4">{loading ? "..." : totalEntries}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
             {statusFilter === "Late" && <AlertCircle size={48} className="text-red-400" />}
             {statusFilter === "On-Time" && <CheckCircle2 size={48} className="text-emerald-400" />}
             {statusFilter === "Early" && <Clock size={48} className="text-blue-400" />}
             {statusFilter === "All Statuses" && <Filter size={48} className="text-slate-400" />}
          </div>
        </div>

        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 flex flex-col justify-center">
          <p className="font-bold text-blue-100 text-sm uppercase tracking-widest">Active Filter</p>
          <h3 className="text-3xl font-black mt-1">
             {statusFilter === "All Statuses" ? "Complete Archive" : `${statusFilter} Arrivals Only`}
          </h3>
          <p className="mt-4 text-blue-100 text-sm leading-relaxed opacity-80">
            Exporting this report will provide a focused CSV for {statusFilter === "Late" ? "disciplinary review" : "performance tracking"}.
          </p>
        </div>
      </div>
    </div>
  );
}