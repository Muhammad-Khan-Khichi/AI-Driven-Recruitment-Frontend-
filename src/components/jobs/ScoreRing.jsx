// import { scoreColor } from '../../utils/statusConfig'

function matchLabel(score) {
  if (score >= 90) return 'Elite Match'
  if (score >= 80) return 'Strong Match'
  if (score >= 60) return 'Fair Match'
  return 'Weak Match'
}

function ringColor(score) {
  if (score >= 90) return '#10B981'
  if (score >= 80) return '#06B6D4'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}

export default function ScoreRing({ score }) {
  const s = Math.round(score ?? 0)
  const color = ringColor(s)
  const circumference = 2 * Math.PI * 18
  const offset = circumference - (s / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className="relative w-[52px] h-[52px]">
        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-border)" strokeWidth="3" />
          <circle
            cx="22" cy="22" r="18" fill="none"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-base font-extrabold"
          style={{ color }}
        >
          {s}
        </span>
      </div>
      <span
        className="text-[9px] font-bold uppercase tracking-wide text-center leading-tight"
        style={{ color }}
      >
        {matchLabel(s)}
      </span>
    </div>
  )
}
