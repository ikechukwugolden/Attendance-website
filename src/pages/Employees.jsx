import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // 🟢 Added for security
import { UserPlus, Search, Building2, AlertTriangle, Loader2, MoreVertical, Mail, BadgeCheck } from "lucide-react";

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // 🟢 SECURITY: Only fetch users who belong to THIS admin's business
    const q = query(
      collection(db, "users"),
      where("businessId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmployees(staffList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredEmployees = employees.filter(emp => 
    emp.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
      <p className="font-black uppercase text-[10px] tracking-widest">Syncing Staff Records...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Staff Directory</h2>
          <p className="text-slate-500 text-sm font-medium">Manage and monitor your active team members.</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
          <UserPlus size={18} /> Invite Staff
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, email, or department..." 
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">
                  <th className="pb-4 pl-6">Member</th>
                  <th className="pb-4">Department</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-5 pl-6 bg-white group-hover:bg-slate-50 rounded-l-[1.5rem] border-y border-l border-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg shadow-sm overflow-hidden">
                           {emp.photoURL ? (
                             <img src={emp.photoURL} alt="" className="w-full h-full object-cover" />
                           ) : (
                             emp.displayName?.charAt(0) || "U"
                           )}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 tracking-tight">{emp.displayName || "New User"}</div>
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                            <Mail size={10} /> {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 bg-white group-hover:bg-slate-50 border-y border-slate-50 transition-colors">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                        <Building2 size={14} className="text-slate-300" />
                        {emp.department || "Unassigned"}
                      </div>
                    </td>
                    <td className="py-5 bg-white group-hover:bg-slate-50 border-y border-slate-50 transition-colors">
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center w-fit gap-1">
                        <BadgeCheck size={12} /> Active
                      </span>
                    </td>
                    <td className="py-5 pr-6 bg-white group-hover:bg-slate-50 rounded-r-[1.5rem] border-y border-r border-slate-50 text-right transition-colors">
                      <button className="p-2 hover:bg-white rounded-xl transition-all text-slate-300 hover:text-slate-600">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
              <AlertTriangle size={40} />
            </div>
            <div>
              <p className="text-slate-800 font-black uppercase text-xs tracking-widest">Directory Empty</p>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto font-medium">
                No employees have joined your business station yet. Share your QR code to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}