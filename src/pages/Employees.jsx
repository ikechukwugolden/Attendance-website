import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Search, Building2, Loader2, MoreVertical, Mail, Edit3, Trash2, FileText, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [activeToday, setActiveToday] = useState(new Set()); // Track IDs of people who scanned today
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Listen for all employees linked to this business
    const qStaff = query(collection(db, "users"), where("businessId", "==", user.uid));
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // 2. Listen for today's logs to mark who is "Active/In"
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const qLogs = query(
      collection(db, "attendance_logs"), 
      where("businessId", "==", user.uid),
      where("timestamp", ">=", startOfToday)
    );

    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const activeIds = new Set(snapshot.docs.map(doc => doc.data().userId));
      setActiveToday(activeIds);
    });

    return () => { unsubStaff(); unsubLogs(); };
  }, [user]);

  const handlePrint = () => window.print();

  const updateDepartment = async (empId) => {
    const newDept = prompt("New department name:");
    if (newDept) {
      await updateDoc(doc(db, "users", empId), { department: newDept });
      toast.success("Department updated");
    }
  };

  const deactivateStaff = async (empId) => {
    if (confirm("Revoke access for this member?")) {
      await updateDoc(doc(db, "users", empId), { businessId: null });
      toast.success("Staff removed");
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Staff Directory</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-slate-400 text-sm font-bold">{activeToday.size} Members Present Today</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <FileText size={18} /> Export Report
          </button>
          <button className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/20">
            <UserPlus size={18} /> Invite
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-10 border-b-4 border-slate-900 pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter">{user?.businessName || "Business"} - Staff Directory</h1>
        <p className="font-bold text-slate-500">Date: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white p-2 md:p-8 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 print:shadow-none print:border-none print:p-0">
        
        {/* Search */}
        <div className="relative mb-8 px-4 md:px-0 print:hidden">
          <Search className="absolute left-10 md:left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto px-4 md:px-0">
          <table className="w-full text-left border-separate border-spacing-y-3 print:border-collapse print:border-spacing-0">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] print:text-slate-900">
                <th className="pb-4 pl-8 print:pl-0">Member Info</th>
                <th className="pb-4">Department</th>
                <th className="pb-4 text-right pr-8 print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const isIn = activeToday.has(emp.id);
                return (
                  <tr key={emp.id} className="group hover:bg-slate-50 transition-all">
                    <td className="py-5 pl-8 bg-white group-hover:bg-slate-50 rounded-l-[2.5rem] border-y border-l border-slate-50 print:pl-0 print:border-b">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black overflow-hidden shadow-md">
                            {emp.photoURL ? <img src={emp.photoURL} className="w-full h-full object-cover" /> : emp.displayName?.charAt(0)}
                          </div>
                          {isIn && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 flex items-center gap-2">
                            {emp.displayName || "Anonymous Staff"}
                            {isIn && <CheckCircle2 size={14} className="text-emerald-500" />}
                          </div>
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 bg-white group-hover:bg-slate-50 border-y border-slate-50 print:border-b">
                      <div className="flex items-center gap-2 text-slate-600 font-black text-xs uppercase">
                        <Building2 size={14} className="text-slate-300" />
                        {emp.department || "General"}
                      </div>
                    </td>
                    <td className="py-5 pr-8 bg-white group-hover:bg-slate-50 rounded-r-[2.5rem] border-y border-r border-slate-50 text-right relative print:hidden">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)}
                        className="p-3 bg-slate-50 group-hover:bg-white rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeMenu === emp.id && (
                        <div className="absolute right-8 top-16 w-44 bg-white shadow-2xl rounded-2xl z-50 py-2 border border-slate-100 overflow-hidden">
                          <button onClick={() => { updateDepartment(emp.id); setActiveMenu(null); }} className="w-full px-5 py-3 text-left text-xs font-black flex items-center gap-2 hover:bg-slate-50 transition-colors">
                            <Edit3 size={14} /> Update Dept
                          </button>
                          <button onClick={() => { deactivateStaff(emp.id); setActiveMenu(null); }} className="w-full px-5 py-3 text-left text-xs font-black flex items-center gap-2 text-rose-500 hover:bg-rose-50 transition-colors">
                            <Trash2 size={14} /> Remove Access
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}