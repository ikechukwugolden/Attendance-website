import React from 'react';
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatusBadge({ status, trend }) {
  // Normalize status for consistent mapping
  const normalizedStatus = status?.toLowerCase().trim() || "on-time";

  const statusConfig = {
    "late": {
      container: "bg-rose-50 text-rose-600 border-rose-100",
      dot: "bg-rose-500",
      label: "Late Entry"
    },
    "on-time": {
      container: "bg-emerald-50 text-emerald-600 border-emerald-100",
      dot: "bg-emerald-500",
      label: "On-Time"
    },
    "early": {
      container: "bg-blue-50 text-blue-600 border-blue-100",
      dot: "bg-blue-500",
      label: "Early Bird"
    },
    "on-leave": {
      container: "bg-slate-50 text-slate-500 border-slate-100",
      dot: "bg-slate-400",
      label: "On Leave"
    }
  };

  const config = statusConfig[normalizedStatus] || statusConfig["on-time"];

  // Trend Logic: Decides which icon and color to show for the trend
  const renderTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case "improving":
        return <TrendingUp size={10} className="text-emerald-500 ml-1" />;
      case "declining":
        return <TrendingDown size={10} className="text-rose-500 ml-1" />;
      case "stable":
        return <Minus size={10} className="text-slate-400 ml-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all duration-300 ${config.container}`}>
        {/* Pulse dot for Late status */}
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${normalizedStatus === 'late' ? 'animate-pulse' : ''}`} />
        {config.label}
      </span>
      
      {/* Optional Trend Icon outside the badge for clarity */}
      {renderTrendIcon()}
    </div>
  );
}