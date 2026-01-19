import { useState } from "react";
import { UserPlus, Search } from "lucide-react";

export default function Employees() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Employee Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <UserPlus size={18} /> Add Employee
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or department..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* This fulfills the Phase A Onboarding requirement */}
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-sm border-b border-slate-100">
              <th className="pb-3 font-semibold">Name</th>
              <th className="pb-3 font-semibold">Department</th>
              <th className="pb-3 font-semibold">Shift Type</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {/* Sample Row */}
            <tr className="text-sm">
              <td className="py-4 font-medium">John Doe</td>
              <td className="py-4 text-slate-600">Engineering</td>
              <td className="py-4 text-slate-600">Morning (09:00 - 17:00)</td>
              <td className="py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}