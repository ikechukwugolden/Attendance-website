import { useState, useEffect } from "react";
import { Download, FileText, Filter, Loader2, AlertCircle, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export default function Reports() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);
  const [availableDepts, setAvailableDepts] = useState([]); // 🟢 Dynamic Depts
  
  const [dateFilter, setDateFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const fetchReportStats = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "attendance_logs"), 
        where("businessId", "==", user.uid), 
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);
      let allLogs = snapshot.docs.map(doc => doc.data());
      
      // Extract unique departments from all logs for the dropdown
      const depts = [...new Set(allLogs.map(l => l.department).filter(Boolean))];
      setAvailableDepts(depts);

      let filteredData = allLogs;
      
      if (deptFilter !== "All Departments") {
        filteredData = filteredData.filter(log => log.department === deptFilter);
      }

      if (dateFilter) {
        filteredData = filteredData.filter(log => {
          const logDate = log.timestamp?.toDate().toISOString().split('T')[0];
          return logDate === dateFilter;
        });
      }

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

  const resetFilters = () => {
    setDateFilter("");
    setDeptFilter("All Departments");
    setStatusFilter("All Statuses");
    toast.success("Filters cleared");
  };

  const handleCSVExport = async () => {
    if (totalEntries === 0) return;
    setIsExporting(true);
    try {
      const q = query(
        collection(db, "attendance_logs"), 
        where("businessId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      let logs = snapshot.docs.map(doc => doc.data());

      if (deptFilter !== "All Departments") logs = logs.filter(l => l.department === deptFilter);
      if (dateFilter) logs = logs.filter(l => l.timestamp?.toDate().toISOString().split('T')[0] === dateFilter);
      if (statusFilter !== "All Statuses") logs = logs.filter(l => l.status === statusFilter);

      const headers = ["Employee Name", "Email", "Dept", "Date", "Time", "Status", "Lat", "Lng"];
      
      const rows = logs.map(log => [
        `"${log.userName || 'Unknown'}"`,
        `"${log.userEmail || 'N/A'}"`,
        `"${log.department || 'General'}"`,
        log.timestamp?.toDate().toLocaleDateString() || "N/A",
        log.timestamp?.toDate().toLocaleTimeString() || "N/A",
        log.status,
        log.location?.lat || "0",
        log.location?.lng || "0"
      ]);

      const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${user.businessName}_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success("CSV Downloaded");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Analytics</h2>
          <p className="text-sm text-slate-400 font-bold tracking-tight uppercase">Terminal: {user?.businessName}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={resetFilters} className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                <RotateCcw size={18} />
            </button>
            <button 
                onClick={handleCSVExport}
                disabled={isExporting || totalEntries === 0}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all disabled:opacity-30"
            >
                {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} 
                Export CSV
            </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 md:p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 grid grid-cols-1 md:grid-cols-3 gap-6">
        <FilterInput label="Date" type="date" value={dateFilter} onChange={setDateFilter} />
        
        <FilterSelect label="Department" value={deptFilter} onChange={setDeptFilter}>
            <option>All Departments</option>
            {availableDepts.map(d => <option key={d}>{d}</option>)}
        </FilterSelect>

        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}>
            <option>All Statuses</option>
            <option>On-Time</option>
            <option>Late</option>
            <option>Early</option>
        </FilterSelect>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SummaryCard 
            title="Log Volume" 
            value={loading ? "..." : totalEntries} 
            subtitle="Matches found"
            icon={statusFilter === "Late" ? <AlertCircle className="text-rose-500" /> : <CheckCircle2 className="text-emerald-500" />}
            dark
        />
        <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Audit Status</h4>
            <p className="text-sm font-bold text-blue-900 leading-relaxed">
                You are currently viewing {statusFilter.toLowerCase()} entries for {deptFilter}. 
                {totalEntries > 0 ? " Data is verified and ready for payroll export." : " No data found for this selection."}
            </p>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function FilterInput({ label, type, value, onChange }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
        </div>
    );
}

function FilterSelect({ label, value, onChange, children }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none cursor-pointer appearance-none">{children}</select>
        </div>
    );
}

function SummaryCard({ title, value, subtitle, icon, dark }) {
    return (
        <div className={`${dark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} p-8 rounded-[3rem] shadow-xl flex justify-between items-center`}>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
                <p className="text-6xl font-black mt-2 tracking-tighter italic">{value}</p>
                <p className="text-xs font-bold mt-2 opacity-40">{subtitle}</p>
            </div>
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                {icon}
            </div>
        </div>
    );
}