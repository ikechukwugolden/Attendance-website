export default function StatusBadge({ status }) {
  const isLate = status === "Late";
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
      isLate 
        ? "bg-rose-50 text-rose-600 border-rose-100" 
        : "bg-emerald-50 text-emerald-600 border-emerald-100"
    }`}>
      {status || "On-Time"}
    </span>
  );
}