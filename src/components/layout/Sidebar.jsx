import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  RiDashboardLine, RiFileTextLine, RiSearchLine, RiSparklingLine,
  RiMagicLine, RiBriefcaseLine, RiMicLine, RiClipboardLine,
  RiHistoryLine, RiLineChartLine, RiCloudLine, RiMailLine,
  RiLogoutBoxRLine, RiMenuLine, RiCloseLine, RiVipCrownLine,
} from 'react-icons/ri'
import { useAuth } from '../../pages/context/AuthContext'
import NavItem from './NavItem'

const NAV_ITEMS = [
  { to: '/',              icon: RiDashboardLine, label: 'Dashboard',     end: true },
  { to: '/resume',        icon: RiFileTextLine,  label: 'Resume' },
  { to: '/job-search',    icon: RiSearchLine,    label: 'Job Search' },
  { to: '/semantic',      icon: RiSparklingLine, label: 'Semantic' },
  { to: '/optimizer',     icon: RiMagicLine,     label: 'Optimizer' },
  { to: '/linkedin',      icon: RiBriefcaseLine, label: 'LinkedIn' },
  { to: '/interview',     icon: RiMicLine,       label: 'Interview' },
  { to: '/cover-letter',  icon: RiMailLine,      label: 'Cover Letters' },
  { to: '/applications',  icon: RiClipboardLine, label: 'Applications' },
  { to: '/history',       icon: RiHistoryLine,   label: 'History' },
]

function useApiHealth() {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const res = await fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(2500) })
        if (mounted) setOnline(res.ok)
      } catch {
        if (mounted) setOnline(false)
      }
    }
    check()
    const id = setInterval(check, 30000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  return online
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-2xl leading-none flex-shrink-0">🎯</span>
      <div className="overflow-hidden">
        <div className="text-t1 font-extrabold text-lg tracking-tight leading-none">HireAI</div>
        <div className="text-t4 text-[10px] tracking-widest mt-1 uppercase">AI-Driven Recruitment</div>
      </div>
    </div>
  )
}

function SidebarContent({ onNavClick }) {
  const { logout, isAdmin } = useAuth()
  const online = useApiHealth()

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 pt-6 pb-6">
        <Brand />
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-1">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Footer block */}
      <div className="px-3 pb-5 pt-3 flex flex-col gap-0.5">
        <Link
          to="/admin/stats"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide text-t3 hover:text-t1 hover:bg-surface2 transition-all uppercase"
        >
          <RiLineChartLine size={15} />
          System Stats
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide text-t3 uppercase">
          {online === null ? (
            <RiCloudLine size={15} className="animate-pulse" />
          ) : online ? (
            <RiCloudLine size={15} className="text-em" />
          ) : (
            <RiCloudLine size={15} className="text-red" />
          )}
          API Status
          <span className={`ml-auto w-1.5 h-1.5 rounded-full ${online ? 'bg-em' : online === false ? 'bg-red' : 'bg-t4 animate-pulse'}`} />
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide text-amber hover:bg-surface2 transition-all uppercase text-left"
        >
          <RiLogoutBoxRLine size={15} />
          Logout
        </button>

        {/* Admin panel highlight card */}
        {isAdmin() && (
          <Link
            to="/admin"
            onClick={onNavClick}
            className="
              mt-3 flex flex-col gap-0.5 rounded-xl px-4 py-3.5
              bg-[#052E1C] border border-[#0E4A2E]
              hover:border-em transition-all duration-150
            "
          >
            <span className="flex items-center gap-2 text-em font-bold text-sm">
              <RiVipCrownLine size={16} />
              Admin Panel
            </span>
            <span className="text-t2 text-[11px] tracking-wide">Elevated access</span>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="
        hidden md:flex flex-col flex-shrink-0 w-64
        bg-surface border-r border-border
        h-screen sticky top-0
      ">
        <SidebarContent />
      </aside>

      {/* ── Mobile hamburger trigger ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="
          md:hidden fixed top-4 left-4 z-40
          w-10 h-10 rounded-lg bg-surface border border-border
          flex items-center justify-center text-t1 shadow-lg
        "
      >
        <RiMenuLine size={18} />
      </button>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="
            relative w-72 max-w-[85vw] h-full
            bg-surface border-r border-border
            flex flex-col animate-in
          ">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center text-t3 hover:text-t1"
            >
              <RiCloseLine size={16} />
            </button>
            <SidebarContent onNavClick={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
