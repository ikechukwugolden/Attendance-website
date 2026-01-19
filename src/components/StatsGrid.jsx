import StatsCard from "./StatsCard";
import { Users, Clock, AlertTriangle, Coffee } from "lucide-react";

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard 
        title="Total Headcount" 
        value={stats.totalCount || 0} 
        icon={Users} // Pass the component itself, not <Users />
        trend="12%"
        isPositive={true}
      />
      <StatsCard 
        title="Present Today" 
        value={stats.presentCount || 0} 
        icon={Clock} 
        trend="5%"
        isPositive={true}
      />
      <StatsCard 
        title="Late Arrivals" 
        value={stats.lateCount || 0} 
        icon={AlertTriangle} 
        trend="2%"
        isPositive={false}
      />
      <StatsCard 
        title="On Leave" 
        value={stats.onLeave || 0} 
        icon={Coffee} 
        trend="0%"
        isPositive={true}
      />
    </div>
  );
}