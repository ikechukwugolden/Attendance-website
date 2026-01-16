import { Users, Clock, AlertCircle, LogOut } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total Headcount" value={stats.total || 0} icon={Users} color="bg-blue-50 text-blue-600" />
      <StatCard title="Present Today" value={stats.present || 0} icon={Clock} color="bg-green-50 text-green-600" />
      <StatCard title="Late Arrivals" value={stats.late || 0} icon={AlertCircle} color="bg-orange-50 text-orange-600" />
      <StatCard title="On Leave" value={stats.leave || 0} icon={LogOut} color="bg-purple-50 text-purple-600" />
    </div>
  );
}