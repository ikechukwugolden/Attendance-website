import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { UserPlus, Search, Mail, Building2, AlertTriangle } from "lucide-react";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Double check your Firestore collection name! Is it "users" or "employees"?
    const collectionName = "users"; 
    
    const q = query(collection(db, collectionName));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Found " + snapshot.size + " users in " + collectionName);
      
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
  }, []);

  const filteredEmployees = employees.filter(emp => 
    emp.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-slate-500">Connecting to Staff Database...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Employee Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
          <UserPlus size={18} /> Add Employee
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {employees.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="pb-3 px-2">Name</th>
                <th className="pb-3 px-2">Department</th>
                <th className="pb-3 px-2">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="text-sm">
                  <td className="py-4 px-2">
                    <div className="font-bold text-slate-800">{emp.displayName || "Unknown User"}</div>
                    <div className="text-xs text-slate-400">{emp.email}</div>
                  </td>
                  <td className="py-4 px-2 text-slate-600">{emp.department || "General"}</td>
                  <td className="py-4 px-2">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase">
                      {emp.role || "Staff"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-3">
             <AlertTriangle className="text-orange-400" size={40} />
             <p className="text-slate-500 font-bold uppercase text-xs">No users found in "users" collection</p>
             <p className="text-slate-400 text-xs">Check your Firestore Database in the Firebase Console.</p>
          </div>
        )}
      </div>
    </div>
  );
}