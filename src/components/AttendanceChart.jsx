import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AttendanceChart({ data }) {
  // Example data format that the chart expects
  const chartData = [
    { name: 'Mon', onTime: 40, late: 5 },
    { name: 'Tue', onTime: 38, late: 7 },
    { name: 'Wed', onTime: 42, late: 2 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-80">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Weekly Performance</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          <Bar dataKey="onTime" name="On-Time" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar dataKey="late" name="Late" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}