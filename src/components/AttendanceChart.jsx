import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { BarChart3 } from 'lucide-react'; // Added proper icon import

export default function AttendanceChart({ logs = [], data = [] }) {
  const [chartData, setChartData] = useState([]);
  const dataSource = logs.length > 0 ? logs : data;

  useEffect(() => {
    // If no data, reset the chart state and exit
    if (!dataSource.length) {
      setChartData([]);
      return;
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];

    // 1. Generate the sliding window for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        name: days[d.getDay()],
        dateKey: d.toISOString().split('T')[0],
        Early: 0,
        OnTime: 0,
        Late: 0
      });
    }

    // 2. Aggregate data into the days
    dataSource.forEach(log => {
      if (!log.timestamp) return;
      const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      const logDateKey = logDate.toISOString().split('T')[0];

      const daySlot = last7Days.find(d => d.dateKey === logDateKey);
      if (daySlot) {
        const status = log.status?.toLowerCase().trim();
        // Handle various status string formats
        if (status === 'early' || status === 'early bird') daySlot.Early++;
        else if (status === 'on-time' || status === 'ontime') daySlot.OnTime++;
        else if (status === 'late') daySlot.Late++;
      }
    });

    setChartData(last7Days);
  }, [dataSource]);

  // Calculations for Summary Stats
  const totals = chartData.reduce(
    (acc, d) => {
      acc.Early += d.Early;
      acc.OnTime += d.OnTime;
      acc.Late += d.Late;
      return acc;
    },
    { Early: 0, OnTime: 0, Late: 0 }
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-100 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
          {label} Activity
        </p>
        <div className="space-y-3">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-6 text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                <span className="text-slate-500">{p.name}</span>
              </div>
              <span className="text-slate-900 ml-auto font-black">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white border border-slate-100 p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 transition-all duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Weekly Trends
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mt-2">
            7-Day Performance Metric
          </p>
        </div>

        <div className="flex flex-wrap gap-3 bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100">
          <Stat label="Early" value={totals.Early} color="blue" />
          <Stat label="On-Time" value={totals.OnTime} color="green" />
          <Stat label="Late" value={totals.Late} color="red" />
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="h-[400px] w-full">
        {chartData.some(d => d.Early + d.OnTime + d.Late > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }}
                dy={15}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }}
              />

              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: '#f8fafc', radius: 20 }} 
              />

              <Bar
                dataKey="Early"
                name="Early"
                stackId="a"
                fill="#3b82f6"
                barSize={36}
                radius={[0, 0, 0, 0]} 
              />
              <Bar
                dataKey="OnTime"
                name="On-Time"
                stackId="a"
                fill="#10b981"
                barSize={36}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Late"
                name="Late"
                stackId="a"
                fill="#ef4444"
                barSize={36}
                radius={[12, 12, 12, 12]} 
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] border-slate-100 text-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              {/* FIXED: Replaced corrupted <svg> path with Lucide component */}
              <BarChart3 size={32} className="opacity-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">No Activity Recorded This Week</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colors = {
    blue: 'text-blue-600 bg-white shadow-sm shadow-blue-100 border-blue-50',
    green: 'text-emerald-600 bg-white shadow-sm shadow-emerald-100 border-emerald-50',
    red: 'text-rose-600 bg-white shadow-sm shadow-rose-100 border-rose-50'
  };

  return (
    <div className={`px-6 py-3 rounded-2xl border flex flex-col items-center min-w-[100px] ${colors[color]}`}>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</span>
      <span className="text-xl font-black">{value}</span>
    </div>
  );
}