import StatsCard from "./StatsCard";
import { Users, Clock, AlertTriangle, LogOut } from "lucide-react";

export default function StatsGrid({ stats = {} }) {
  // Helper to check if data is loaded
  const hasData = Object.keys(stats).length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {/* 1. TOTAL HEADCOUNT */}
      <StatsCard 
        title="Total Headcount" 
        value={hasData ? stats.totalCount : "---"} 
        icon={Users} 
        trend="+12%"
        trendType="good"
      />

      {/* 2. PRESENT TODAY */}
      <StatsCard 
        title="Present Today" 
        value={hasData ? stats.presentCount : "---"} 
        icon={Clock} 
        trend="+5%"
        trendType="good"
      />

      {/* 3. LATE ARRIVALS */}
      <StatsCard 
        title="Late Arrivals" 
        value={hasData ? stats.lateCount : "---"} 
        icon={AlertTriangle} 
        trend="+2%"
        trendType="bad" 
      />

      {/* 4. CHECKED OUT (Renamed from On Leave) */}
      <StatsCard 
        title="Checked Out" 
        value={hasData ? (stats.checkedOutCount || 0) : "---"} 
        icon={LogOut} 
        trend="Live"
        trendType="neutral"
      />
    </div>
  );
}