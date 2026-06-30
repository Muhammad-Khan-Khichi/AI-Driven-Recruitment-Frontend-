export default function StatCard({ label, value, accentColor = 'text-em', sub, children }) {
  return (
    <div className="card px-5 py-5 flex flex-col gap-3 min-w-0">
      <span className="label-xs">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-4xl font-extrabold tracking-tight ${accentColor}`}>{value}</span>
        {children}
      </div>
      {sub && <div className="text-xs text-t3">{sub}</div>}
    </div>
  )
}
