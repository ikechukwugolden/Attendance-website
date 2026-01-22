import React from 'react';
import { ChevronRight, Calendar } from "lucide-react";
import StatusBadge from "./StatusBadge"; // 👈 Integrated the shared component

export default function WeeklySummary({ logs = [], employees = [] }) {
  // 1. Process Data: Aggregate lates and total shifts per employee
  const summaryData = employees.map(emp => {
    const empLogs = logs.filter(log => log.userId === emp.id);
    const lateShifts = empLogs.filter(log => log.status === "Late").length;
    const totalShifts = empLogs.length;
    
    // Calculate reliability score
    const reliability = totalShifts > 0 
      ? Math.round(((totalShifts - lateShifts) / totalShifts) * 100) 
      : 100; // Default to 100% if no shifts recorded yet

    return {
      ...emp,
      name: emp.name || emp.userName || "Unknown Staff",
      lateShifts,
      totalShifts,
      reliability
    };
  }).sort((a, b) => a.reliability - b.reliability); // Show lowest reliability (problematic) first

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Weekly Performance</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">7-Day Aggregated Reliability</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
            <Calendar size={20} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              <th className="px-8 py-4">Employee</th>
              <th className="px-8 py-4 text-center">Total Shifts</th>
              <th className="px-8 py-4 text-center">Status Index</th>
              <th className="px-8 py-4">Reliability Score</th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {summaryData.slice(0, 5).map((row) => (
              <tr key={row.id} className="group hover:bg-slate-50/30 transition-all">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-slate-200">
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm tracking-tight">{row.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{row.department || "General"}</p>
                    </div>
                  </div>
                </td>
                
                <td className="px-8 py-5 text-center">
                   <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                     {row.totalShifts.toString().padStart(2, '0')}
                   </span>
                </td>

                <td className="px-8 py-5 text-center">
                  {/* 🟢 Using StatusBadge to show overall standing */}
                  <StatusBadge 
                    status={row.lateShifts > 0 ? "Late" : "On-Time"} 
                    trend={row.reliability < 70 ? "declining" : "stable"}
                  />
                </td>

                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-[120px] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          row.reliability > 85 ? 'bg-emerald-500' : row.reliability > 60 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${row.reliability}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-900">{row.reliability}%</span>
                  </div>
                </td>

                <td className="px-8 py-5 text-right">
                  <button className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-slate-300 transition-all">
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-6 bg-slate-50/30 border-t border-slate-50 text-center">
        <button className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 hover:text-indigo-800 transition-colors">
          Export Full Weekly Analysis
        </button>
      </div>
    </div>
  );
}