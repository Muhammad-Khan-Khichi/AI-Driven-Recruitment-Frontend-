export default function SkillChip({ children, onClick, variant = 'filled' }) {
  if (variant === 'add') {
    return (
      <button
        onClick={onClick}
        className="
          border border-dashed border-border2 rounded-lg px-3.5 py-2
          text-t2 text-xs font-semibold tracking-wide uppercase
          hover:border-em hover:text-em transition-all duration-150
        "
      >
        {children}
      </button>
    )
  }

  return (
    <span className="
      bg-surface2 border border-border rounded-lg px-3.5 py-2
      text-t2 text-xs font-semibold tracking-wide uppercase
      inline-flex items-center
    ">
      {children}
    </span>
  )
}
