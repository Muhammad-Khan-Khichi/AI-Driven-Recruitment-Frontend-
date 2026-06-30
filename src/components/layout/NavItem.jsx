import { NavLink } from 'react-router-dom'

export default function NavItem({ to, icon: Icon, label, collapsed, onClick, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `
        group relative flex items-center gap-3 rounded-lg
        px-3 py-2.5 text-sm font-medium
        transition-all duration-150
        ${collapsed ? 'justify-center px-0' : ''}
        ${isActive
          ? 'bg-cyan text-bg font-semibold shadow-[0_2px_12px_rgba(6,182,212,0.25)]'
          : 'text-t3 hover:bg-surface2 hover:text-t1'
        }
      `}
    >
      <Icon size={17} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="
          absolute left-full ml-2 px-2.5 py-1.5 rounded-md
          bg-surface3 border border-border2 text-t1 text-xs font-medium
          whitespace-nowrap opacity-0 -translate-x-1 pointer-events-none
          group-hover:opacity-100 group-hover:translate-x-0
          transition-all duration-150 z-50 shadow-lg
        ">
          {label}
        </span>
      )}
    </NavLink>
  )
}
