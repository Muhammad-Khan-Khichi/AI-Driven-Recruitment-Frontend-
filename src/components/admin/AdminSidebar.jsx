import { Link, useLocation } from 'react-router-dom'
import {
  RiDashboardLine, RiUser3Line, RiFileTextLine,
  RiSearchLine, RiBriefcaseLine, RiShieldStarLine,
  RiArrowLeftSLine, RiLineChartLine,
} from 'react-icons/ri'

const ADMIN_TABS = [
  { to: '/admin', label: 'Overview',    icon: RiLineChartLine,    end: true },
  { to: '/admin', label: 'Users',       icon: RiUser3Line,        key: 'Users' },
  { to: '/admin', label: 'Resumes',     icon: RiFileTextLine,     key: 'Resumes' },
  { to: '/admin', label: 'Searches',    icon: RiSearchLine,       key: 'Searches' },
  { to: '/admin', label: 'Applications', icon: RiBriefcaseLine,   key: 'Applications' },
]

export default function AdminSidebar({ activeTab, onTabChange }) {
  const location = useLocation()

  return (
    <aside className="
      hidden lg:flex flex-col flex-shrink-0 w-60
      bg-surface border-r border-border
      h-[calc(100vh-0px)] sticky top-0
    ">
      {/* Header */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <Link
          to="/"
          className="
            flex items-center gap-2 text-t3 hover:text-t1
            text-xs font-semibold uppercase tracking-wide mb-4 transition-colors
          "
        >
          <RiArrowLeftSLine size={14} />
          Back to app
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="
            w-9 h-9 rounded-lg bg-em/10 border border-em/30
            flex items-center justify-center flex-shrink-0
          ">
            <RiShieldStarLine size={18} className="text-em" />
          </div>
          <div className="overflow-hidden">
            <div className="text-t1 font-bold text-sm leading-tight">Admin</div>
            <div className="text-t4 text-[10px] tracking-widest mt-0.5 uppercase">
              Control panel
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {ADMIN_TABS.map(tab => {
          const isActive = activeTab === tab.label

          return (
            <button
              key={tab.label}
              onClick={() => onTabChange(tab.label)}
              className={`
                group relative flex items-center gap-3 rounded-lg
                px-3 py-2.5 text-sm font-medium
                transition-all duration-150 text-left
                ${isActive
                  ? 'bg-em/10 text-em border border-em/30'
                  : 'text-t3 hover:bg-surface2 hover:text-t1 border border-transparent'
                }
              `}
            >
              <tab.icon size={17} className="flex-shrink-0" />
              <span className="truncate">{tab.label}</span>

              {/* Active indicator */}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-em" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer info */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-t4 text-[10px] tracking-widest uppercase leading-relaxed">
          Logged in as<br />
          <span className="text-em font-bold text-xs normal-case tracking-normal">
            Administrator
          </span>
        </p>
      </div>
    </aside>
  )
}