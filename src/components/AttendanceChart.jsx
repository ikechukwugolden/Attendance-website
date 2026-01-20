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

export default function AttendanceChart({ logs = [], data = [] }) {
  const [chartData, setChartData] = useState([]);
  const dataSource = logs.length > 0 ? logs : data;

  useEffect(() => {
    if (!dataSource.length) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        name: days[d.getDay()],
        dateKey: d.toLocaleDateString(),
        Early: 0,
        OnTime: 0,
        Late: 0
      });
    }

    dataSource.forEach(log => {
      if (!log.timestamp) return;
      const date = log.timestamp.toDate
        ? log.timestamp.toDate()
        : new Date(log.timestamp);

      const day = last7Days.find(d => d.dateKey === date.toLocaleDateString());
      if (day) {
        const status = log.status?.toLowerCase().trim();
        if (status === 'early') day.Early++;
        else if (status === 'on-time' || status === 'ontime') day.OnTime++;
        else if (status === 'late') day.Late++;
      }
    });

    setChartData(last7Days);
  }, [dataSource]);

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
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b pb-1">
          {label} Details
        </p>
        <div className="space-y-2">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-4 text-xs font-bold">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
              <span className="text-gray-500 min-w-[60px]">{p.name}</span>
              <span className="text-gray-900 ml-auto">{p.value} staff</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-linear-to-br from-blue-600 via-blue-500 to-indigo-600 p-2 sm:p-6 transition-all duration-500 rounded-4xl shadow-2xl">
      <div className=" bg-white border border-gray-100  p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 rounded-4xl shadow-2xl">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Weekly Attendance
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500 mt-1">
              Performance Insights
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Stat label="Early" value={totals.Early} color="blue" />
            <Stat label="On-Time" value={totals.OnTime} color="green" />
            <Stat label="Late" value={totals.Late} color="red" />
          </div>
        </div>

        {/* CHART */}
        <div className="h-[380px] w-full">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -25 }}>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />

                {/* 🔵 BLUE BAR: Now with rounded-full effect */}
                <Bar
                  dataKey="Early"
                  name="Early Arrival"
                  stackId="attendance"
                  fill="#3b82f6"
                  barSize={32}
                  radius={[20, 20, 20, 20]}
                />

                <Bar
                  dataKey="OnTime"
                  name="On-Time"
                  stackId="attendance"
                  fill="#10b981"
                  barSize={32}
                />

                <Bar
                  dataKey="Late"
                  name="Late Entry"
                  stackId="attendance"
                  fill="#ef4444"
                  barSize={32}
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center border-4 border-dashed rounded-[2rem] border-gray-100 text-gray-400 text-xs font-black uppercase tracking-widest">
              No Data Found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    red: 'text-rose-600 bg-rose-50 border-rose-100'
  };

  return (
    <div className={`px-5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-wider flex flex-col items-center min-w-[90px] ${colors[color]}`}>
      <span className="opacity-60 mb-0.5">{label}</span>
      <span className="text-lg">{value}</span>
    </div>
  );
}