import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, trend, isPositive, trendType }) {
  // trendType: "good" | "bad" | "neutral"
  // Note: For "Late Arrivals", a downward trend (isPositive={false}) is actually "good".
  
  const IconComponent = Icon || HelpCircle;

  const getTrendStyles = () => {
    if (trendType === "neutral" || !trend) return "bg-slate-50 text-slate-500";
    if (trendType === "good") return "bg-emerald-50 text-emerald-600";
    if (trendType === "bad") return "bg-rose-50 text-rose-600";
    return "bg-slate-50 text-slate-500";
  };

  return (
    <div className="relative overflow-hidden bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      {/* Subtle Background Glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 blur-2xl transition-colors ${
        trendType === "bad" ? "bg-rose-500" : trendType === "good" ? "bg-emerald-500" : "bg-blue-500"
      }`} />

      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-2xl transition-colors ${
           trendType === "bad" ? "bg-rose-50 text-rose-600" : "bg-slate-900 text-white"
        }`}>
          <IconComponent size={22} strokeWidth={2.5} />
        </div>

        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider ${getTrendStyles()}`}>
            {trendType === "good" && <ArrowUpRight size={14} strokeWidth={3} />}
            {trendType === "bad" && <ArrowDownRight size={14} strokeWidth={3} />}
            {trendType === "neutral" && <Minus size={14} strokeWidth={3} />}
            {trend}
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            {value}
          </h3>
          {trendType === "bad" && title.toLowerCase().includes("late") && (
            <span className="animate-pulse w-2 h-2 rounded-full bg-rose-500" />
          )}
        </div>
      </div>
    </div>
  );
}