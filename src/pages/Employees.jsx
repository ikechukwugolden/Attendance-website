import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, doc, updateDoc, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Search, Building2, Loader2, MoreVertical, Edit3, Trash2, FileText, CheckCircle2, LogOut, Mail, Send, X, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [presenceMap, setPresenceMap] = useState({}); 
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const inviteLink = user?.uid ? `${window.location.origin}/scan?bid=${user.uid}` : "";

  useEffect(() => {
    if (!user?.uid) return;

    const qStaff = query(collection(db, "users"), where("businessId", "==", user.uid));
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const qLogs = query(
      collection(db, "attendance_logs"), 
      where("businessId", "==", user.uid),
      where("timestamp", ">=", startOfToday),
      orderBy("timestamp", "asc") 
    );

    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const map = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        map[data.userId] = data.type; 
      });
      setPresenceMap(map);
    });

    return () => { unsubStaff(); unsubLogs(); };
  }, [user]);

  const handlePrint = () => window.print();

  const handleInvite = () => {
    setShowInviteModal(true);
  };

  const buildInviteContent = () => {
    const businessName = user?.businessName || "our team";
    const greeting = inviteName.trim() ? `Hi ${inviteName.trim()},` : "Hi,";
    const subject = `You're invited to join ${businessName} attendance`;
    const body = [
      greeting,
      "",
      `You're invited to join ${businessName} on Attendly.`,
      "Use this secure terminal link to clock in/out:",
      inviteLink,
      "",
      "If you need help, reply to this email.",
      "",
      `- ${businessName} Admin`
    ].join("\n");

    return { subject, body };
  };

  const handleShareInviteLink = async () => {
    if (!inviteLink) {
      toast.error("Invite link unavailable right now.");
      return;
    }

    const businessName = user?.businessName || "our team";
    const shareText = `Join ${businessName} attendance terminal: ${inviteLink}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${businessName} Staff Invite`,
          text: shareText,
          url: inviteLink
        });
        toast.success("Invite shared");
        return;
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        toast.error("Could not open share sheet. Copying link instead.");
      }
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied");
    } catch {
      window.prompt("Copy and send this invite link:", inviteLink);
    }
  };

  const handleSendEmailInvite = (e) => {
    e.preventDefault();

    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Enter an email address.");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      toast.error("Enter a valid email address.");
      return;
    }

    const { subject, body } = buildInviteContent();
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    toast.success("Opening your email app...");
    setShowInviteModal(false);
    setInviteEmail("");
    setInviteName("");
  };

  const handleCopyInviteMessage = async () => {
    const { subject, body } = buildInviteContent();
    const fullMessage = `Subject: ${subject}\n\n${body}`;

    try {
      await navigator.clipboard.writeText(fullMessage);
      toast.success("Invite message copied");
    } catch {
      window.prompt("Copy this invite message:", fullMessage);
    }
  };

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

  const peopleInCount = Object.values(presenceMap).filter(type => type === "QR_Scan").length;

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Staff Directory</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`flex h-2 w-2 rounded-full ${peopleInCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <p className="text-slate-400 text-sm font-bold">{peopleInCount} Members Currently On-Site</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <FileText size={18} /> Export
          </button>
          <button onClick={handleInvite} className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/20">
            <UserPlus size={18} /> Invite
          </button>
        </div>
      </div>

      <div className="bg-white p-2 md:p-8 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 print:shadow-none">
        
        {/* Search */}
        <div className="relative mb-8 px-4 md:px-0 print:hidden">
          <Search className="absolute left-10 md:left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Search team..." 
            className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold text-slate-600 outline-none transition-all focus:ring-2 focus:ring-blue-100"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto px-4 md:px-0">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                <th className="pb-4 pl-8">Member</th>
                <th className="pb-4">Department</th>
                <th className="pb-4 text-right pr-8">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const latestType = presenceMap[emp.id];
                const isCurrentlyIn = latestType === "QR_Scan";
                const hasBeenActiveToday = !!latestType;

                return (
                  <tr key={emp.id} className={`group hover:bg-slate-50 transition-all ${!isCurrentlyIn && hasBeenActiveToday ? 'opacity-70' : ''}`}>
                    <td className="py-5 pl-8 bg-white group-hover:bg-slate-50 rounded-l-[2.5rem] border-y border-l border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black overflow-hidden shadow-md ${isCurrentlyIn ? 'bg-slate-900' : 'bg-slate-200'}`}>
                            {emp.photoURL ? (
                                <img 
                                    src={emp.photoURL} 
                                    referrerPolicy="no-referrer" // FIXED: Security Bypass
                                    className="w-full h-full object-cover" 
                                />
                            ) : emp.displayName?.charAt(0)}
                          </div>
                          {isCurrentlyIn && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 flex items-center gap-2">
                            {emp.displayName || "Anonymous"}
                          </div>
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 bg-white group-hover:bg-slate-50 border-y border-slate-50">
                      <div className="flex items-center gap-2 text-slate-600 font-black text-xs uppercase">
                        <Building2 size={14} className="text-slate-300" />
                        {emp.department || "General"}
                      </div>
                    </td>
                    <td className="py-5 pr-8 bg-white group-hover:bg-slate-50 rounded-r-[2.5rem] border-y border-r border-slate-50 text-right relative">
                      <div className="flex justify-end items-center gap-4">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                          isCurrentlyIn 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : latestType === "Check_Out" 
                          ? "bg-slate-100 text-slate-500 border-slate-200" 
                          : "bg-white text-slate-300 border-slate-100"
                        }`}>
                          {isCurrentlyIn ? <CheckCircle2 size={10} /> : latestType === "Check_Out" ? <LogOut size={10} /> : null}
                          {isCurrentlyIn ? "On-Site" : latestType === "Check_Out" ? "Checked Out" : "No Activity"}
                        </div>
                        
                        <button 
                          onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)}
                          className={`p-3 rounded-2xl transition-all shadow-sm ${activeMenu === emp.id ? 'bg-slate-900 text-white' : 'bg-slate-50 group-hover:bg-white hover:bg-slate-900 hover:text-white'}`}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>

                      {/* Dropdown Menu - Fixed positioning */}
                      {activeMenu === emp.id && (
                        <div className="absolute right-8 top-[70%] w-44 bg-white shadow-2xl rounded-2xl z-50 py-2 border border-slate-100 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
                          <button onClick={() => { updateDepartment(emp.id); setActiveMenu(null); }} className="w-full px-5 py-3 text-xs font-black flex items-center gap-2 hover:bg-slate-50 transition-colors">
                            <Edit3 size={14} /> Update Dept
                          </button>
                          <button onClick={() => { deactivateStaff(emp.id); setActiveMenu(null); }} className="w-full px-5 py-3 text-xs font-black flex items-center gap-2 text-rose-500 hover:bg-rose-50 transition-colors">
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

      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Invite Employee</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Send Secure Attendance Access</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendEmailInvite} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Name (Optional)</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. John"
                  className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Invite Link</p>
                <p className="text-xs font-mono text-slate-600 break-all">{inviteLink}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyInviteMessage}
                  className="py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200"
                >
                  <Copy size={14} /> Copy Msg
                </button>
                <button
                  type="button"
                  onClick={handleShareInviteLink}
                  className="py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200"
                >
                  <Mail size={14} /> Share Link
                </button>
                <button
                  type="submit"
                  className="py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600"
                >
                  <Send size={14} /> Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
