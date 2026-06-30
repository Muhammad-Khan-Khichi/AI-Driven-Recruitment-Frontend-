import { Link } from 'react-router-dom'
import { RiArrowRightLine } from 'react-icons/ri'

export default function FeatureCard({ icon: Icon, iconBg, iconColor, title, description, to }) {
  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-border2 transition-colors duration-150">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>

      <div className="flex-1">
        <h3 className="text-t1 font-semibold text-[15px] mb-1.5">{title}</h3>
        <p className="text-t3 text-[13px] leading-relaxed">{description}</p>
      </div>

      <Link
        to={to}
        className="
          self-start flex items-center gap-1.5
          border border-border rounded-lg px-3.5 py-2
          text-t2 text-xs font-semibold
          hover:border-border2 hover:bg-surface2
          transition-all duration-150
        "
      >
        Open <RiArrowRightLine size={13} />
      </Link>
    </div>
  )
}
