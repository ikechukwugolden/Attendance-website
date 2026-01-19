import { ArrowUpRight, ArrowDownRight, HelpCircle } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, trend, isPositive }) {
  // Fallback to prevent "Element type is invalid" if Icon is undefined
  const IconComponent = Icon || HelpCircle;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
          <IconComponent size={24} />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{value}</h3>
      </div>
    </div>
  );
}