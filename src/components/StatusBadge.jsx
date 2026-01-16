export default function StatusBadge({ status }) {
  const styles = {
    "On-Time": "bg-green-100 text-green-700 border-green-200",
    "Late": "bg-amber-100 text-amber-700 border-amber-200",
    "Absent": "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || "bg-slate-100"}`}>
      {status}
    </span>
  );
}