import { useState, useEffect } from 'react'
import {Link} from 'react-router-dom'
import {
  RiDashboardLine, RiUser3Line, RiFileTextLine,
  RiSearchLine, RiBriefcaseLine,
  RiShieldStarLine, RiShieldLine,
  RiUserUnfollowLine, RiUserFollowLine,
  RiDeleteBinLine, RiRefreshLine,
  RiLoader4Line, RiAlertLine,
  RiCheckLine, RiCloseLine,
  RiHomeLine, RiArrowRightSLine,
  RiMailLine, RiCalendarLine,
} from 'react-icons/ri'
import { adminApi } from './api/admin'
import { errMessage } from './utils/errors'
import AdminSidebar from '../components/admin/AdminSidebar'

//  Breadcrumbs
function Breadcrumbs({ activeTab, onTabChange }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-5 flex-wrap">
      <Link
        to="/"
        className="flex items-center gap-1 text-t3 hover:text-t1 transition-colors"
      >
        <RiHomeLine size={14} />
        <span>Home</span>
      </Link>
      <RiArrowRightSLine size={14} className="text-t4" />
      <span className="text-t2 font-medium">Admin</span>
      {activeTab !== 'Overview' && (
        <>
          <RiArrowRightSLine size={14} className="text-t4" />
          <span className="text-t1 font-semibold">{activeTab}</span>
        </>
      )}
    </nav>
  )
}

//  Stat card 
function StatCard({ label, value, Icon, color, sub }) {
  return (
    <div className="card px-5 py-5 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="label-xs">{label}</span>
        <span className="text-3xl font-extrabold text-t1 leading-tight">
          {value ?? '—'}
        </span>
        {sub && <span className="text-t4 text-xs mt-1">{sub}</span>}
      </div>
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} />
      </div>
    </div>
  )
}

//  User row 
function UserRow({ user, onAction, busy }) {
  const created = new Date(user.created_at)
  const dateStr = created.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <div className="card px-5 py-4 flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-full bg-surface3 border border-border flex items-center justify-center flex-shrink-0">
        <RiUser3Line size={18} className="text-t3" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-t1 text-sm font-semibold truncate">
            {user.full_name || user.username}
          </span>
          {user.is_admin && (
            <span className="bg-em/10 border border-em/40 text-em text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md flex items-center gap-1">
              <RiShieldStarLine size={10} />
              Admin
            </span>
          )}
          {!user.is_active && (
            <span className="bg-red/10 border border-red/40 text-red text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-t4 text-xs">
          <span className="flex items-center gap-1">
            <RiMailLine size={11} />
            {user.email}
          </span>
          <span className="flex items-center gap-1">
            <RiUser3Line size={11} />
            @{user.username}
          </span>
          <span className="flex items-center gap-1">
            <RiCalendarLine size={11} />
            {dateStr}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {!user.is_admin && (
          <button
            onClick={() => onAction('makeAdmin', user)}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg border border-em/40 text-em text-xs font-semibold hover:bg-em/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RiShieldStarLine size={12} />
            Make Admin
          </button>
        )}
        {user.is_active ? (
          <button
            onClick={() => onAction('deactivate', user)}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg border border-amber/40 text-amber text-xs font-semibold hover:bg-amber/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RiUserUnfollowLine size={12} />
            Deactivate
          </button>
        ) : (
          <button
            onClick={() => onAction('activate', user)}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg border border-em/40 text-em text-xs font-semibold hover:bg-em/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RiUserFollowLine size={12} />
            Activate
          </button>
        )}
        <button
          onClick={() => onAction('delete', user)}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg border border-red/40 text-red text-xs font-semibold hover:bg-red/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <RiDeleteBinLine size={12} />
          Delete
        </button>
      </div>
    </div>
  )
}

//  Confirm dialog 
function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          {danger && (
            <div className="w-10 h-10 rounded-full bg-red/10 border border-red/30 flex items-center justify-center flex-shrink-0">
              <RiAlertLine size={20} className="text-red" />
            </div>
          )}
          <div>
            <h3 className="text-t1 font-bold text-base">{title}</h3>
            <p className="text-t3 text-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-t2 text-sm font-medium hover:bg-surface2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              danger
                ? 'bg-red text-white hover:bg-red/90'
                : 'bg-em text-bg hover:bg-em/90'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

//  Generic list 
function GenericList({ items, columns, loading, empty }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <RiLoader4Line size={22} className="text-em animate-spin" />
        <span className="text-t3 text-sm">Loading…</span>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
        <div className="w-14 h-14 rounded-full bg-surface3 border border-border flex items-center justify-center mb-2">
          <RiFileTextLine size={22} className="text-t4" />
        </div>
        <p className="text-t2 text-sm font-medium">{empty || 'No items found'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-3 px-5 py-3 text-t4 text-xs font-semibold uppercase tracking-wide border-b border-border"
           style={{ gridTemplateColumns: columns.map(c => c.width || '1fr').join(' ') }}>
        {columns.map(c => (
          <span key={c.key}>{c.label}</span>
        ))}
      </div>

      {items.map((item, i) => (
        <div key={i}
             className="grid gap-3 px-5 py-3 text-t2 text-sm hover:bg-surface2 rounded-lg transition-colors items-center"
             style={{ gridTemplateColumns: columns.map(c => c.width || '1fr').join(' ') }}>
          {columns.map(c => (
            <span key={c.key} className={c.className || ''}>
              {c.render ? c.render(item) : (item[c.key] ?? '—')}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

//    Tab content components  
function OverviewTab({ stats, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <RiLoader4Line size={22} className="text-em animate-spin" />
        <span className="text-t3 text-sm">Loading stats…</span>
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Users', value: stats?.total_users,
      Icon: RiUser3Line, color: 'bg-em/10 text-em',
      sub: stats?.users_today !== undefined ? `${stats.users_today} new today` : null,
    },
    {
      label: 'Admins', value: stats?.total_admins,
      Icon: RiShieldStarLine, color: 'bg-amber/10 text-amber',
    },
    {
      label: 'Resumes', value: stats?.total_resumes,
      Icon: RiFileTextLine, color: 'bg-cyan/10 text-cyan',
    },
    {
      label: 'Job Searches', value: stats?.total_searches,
      Icon: RiSearchLine, color: 'bg-em/10 text-em',
    },
    {
      label: 'Applications', value: stats?.total_applications,
      Icon: RiBriefcaseLine, color: 'bg-em/10 text-em',
    },
    {
      label: 'New Today', value: stats?.users_today,
      Icon: RiCalendarLine, color: 'bg-cyan/10 text-cyan',
      sub: 'registered today',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(c => <StatCard key={c.label} {...c} />)}
    </div>
  )
}

function UsersTab({ users, loading, onAction, busy, onRefresh }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="label-xs flex items-center gap-2">
          <RiUser3Line size={14} className="text-em" />
          {users.length} {users.length === 1 ? 'user' : 'users'}
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-border text-t2 text-xs font-medium hover:bg-surface2 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RiRefreshLine size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <RiLoader4Line size={22} className="text-em animate-spin" />
          <span className="text-t3 text-sm">Loading users…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-surface3 border border-border flex items-center justify-center mb-2">
            <RiUser3Line size={22} className="text-t4" />
          </div>
          <p className="text-t2 text-sm font-medium">No users found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map(u => (
            <UserRow key={u.id} user={u} onAction={onAction} busy={busy} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResumesTab({ items, loading, onRefresh }) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px', className: 'font-mono text-t4' },
    {
      key: 'user_id', label: 'User',
      render: item => (
        <span className="text-t2">
          {item.user_id ?? item.user?.username ?? '—'}
        </span>
      ),
    },
    {
      key: 'title', label: 'Title',
      render: item => (
        <span className="text-t1 font-medium truncate">
          {item.title ?? item.name ?? 'Untitled'}
        </span>
      ),
    },
    {
      key: 'created_at', label: 'Created',
      render: item => item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : '—',
      className: 'text-t4 text-xs',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="label-xs flex items-center gap-2">
          <RiFileTextLine size={14} className="text-em" />
          {items.length} {items.length === 1 ? 'resume' : 'resumes'}
        </span>
        <button onClick={onRefresh} disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-border text-t2 text-xs font-medium hover:bg-surface2 transition-colors flex items-center gap-1.5 disabled:opacity-50">
          <RiRefreshLine size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      <GenericList items={items} columns={columns} loading={loading} empty="No resumes yet" />
    </div>
  )
}

function SearchesTab({ items, loading, onRefresh }) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px', className: 'font-mono text-t4' },
    {
      key: 'query', label: 'Query',
      render: item => (
        <span className="text-t1 font-medium truncate">
          {item.query ?? item.search_term ?? item.keyword ?? '—'}
        </span>
      ),
    },
    {
      key: 'user_id', label: 'User',
      render: item => item.user_id ?? item.user?.username ?? '—',
      className: 'text-t4',
    },
    {
      key: 'created_at', label: 'When',
      render: item => item.created_at
        ? new Date(item.created_at).toLocaleString()
        : '—',
      className: 'text-t4 text-xs',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="label-xs flex items-center gap-2">
          <RiSearchLine size={14} className="text-em" />
          {items.length} {items.length === 1 ? 'search' : 'searches'}
        </span>
        <button onClick={onRefresh} disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-border text-t2 text-xs font-medium hover:bg-surface2 transition-colors flex items-center gap-1.5 disabled:opacity-50">
          <RiRefreshLine size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      <GenericList items={items} columns={columns} loading={loading} empty="No searches yet" />
    </div>
  )
}

function ApplicationsTab({ items, loading, onRefresh }) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px', className: 'font-mono text-t4' },
    {
      key: 'job_title', label: 'Job',
      render: item => (
        <span className="text-t1 font-medium truncate">
          {item.job_title ?? item.title ?? item.position ?? '—'}
        </span>
      ),
    },
    {
      key: 'company', label: 'Company',
      render: item => item.company ?? item.company_name ?? '—',
    },
    {
      key: 'status', label: 'Status',
      render: item => {
        const status = item.status ?? 'pending'
        const colorMap = {
          pending:  'bg-amber/10 text-amber border-amber/30',
          accepted: 'bg-em/10 text-em border-em/30',
          rejected: 'bg-red/10 text-red border-red/30',
          applied:  'bg-cyan/10 text-cyan border-cyan/30',
        }
        return (
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${colorMap[status] || colorMap.pending}`}>
            {status}
          </span>
        )
      },
    },
    {
      key: 'created_at', label: 'Applied',
      render: item => item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : '—',
      className: 'text-t4 text-xs',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="label-xs flex items-center gap-2">
          <RiBriefcaseLine size={14} className="text-em" />
          {items.length} {items.length === 1 ? 'application' : 'applications'}
        </span>
        <button onClick={onRefresh} disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-border text-t2 text-xs font-medium hover:bg-surface2 transition-colors flex items-center gap-1.5 disabled:opacity-50">
          <RiRefreshLine size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      <GenericList items={items} columns={columns} loading={loading} empty="No applications yet" />
    </div>
  )
}

//    Main admin page        ─
export default function Admin() {
  const [tab, setTab] = useState('Overview')

  const [stats, setStats]             = useState(null)
  const [users, setUsers]             = useState([])
  const [resumes, setResumes]         = useState([])
  const [searches, setSearches]       = useState([])
  const [applications, setApplications] = useState([])

  const [loading, setLoading] = useState({})
  const [error, setError]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [confirm, setConfirm] = useState(null)

  const fetchStats = async () => {
    setLoading(l => ({ ...l, stats: true }))
    try {
      const res = await adminApi.getStats()
      const data = typeof res === 'string' ? JSON.parse(res) : res
      setStats(data)
    } catch (e) {
      setError(errMessage(e, 'Failed to load stats.'))
    } finally {
      setLoading(l => ({ ...l, stats: false }))
    }
  }

  const fetchUsers = async () => {
    setLoading(l => ({ ...l, users: true }))
    try {
      const res = await adminApi.listUsers(0, 100)
      let arr = res
      if (typeof res === 'string') {
        try { arr = JSON.parse(res) } catch { arr = [] }
      }
      setUsers(Array.isArray(arr) ? arr : [])
    } catch (e) {
      setError(errMessage(e, 'Failed to load users.'))
    } finally {
      setLoading(l => ({ ...l, users: false }))
    }
  }

  const fetchResumes = async () => {
    setLoading(l => ({ ...l, resumes: true }))
    try {
      const res = await adminApi.listResumes(0, 100)
      let arr = res
      if (typeof res === 'string') {
        try { arr = JSON.parse(res) } catch { arr = [] }
      }
      setResumes(Array.isArray(arr) ? arr : [])
    } catch (e) {
      setError(errMessage(e, 'Failed to load resumes.'))
    } finally {
      setLoading(l => ({ ...l, resumes: false }))
    }
  }

  const fetchSearches = async () => {
    setLoading(l => ({ ...l, searches: true }))
    try {
      const res = await adminApi.listSearches(0, 100)
      let arr = res
      if (typeof res === 'string') {
        try { arr = JSON.parse(res) } catch { arr = [] }
      }
      setSearches(Array.isArray(arr) ? arr : [])
    } catch (e) {
      setError(errMessage(e, 'Failed to load searches.'))
    } finally {
      setLoading(l => ({ ...l, searches: false }))
    }
  }

  const fetchApplications = async () => {
    setLoading(l => ({ ...l, applications: true }))
    try {
      const res = await adminApi.listApplications(0, 100)
      let arr = res
      if (typeof res === 'string') {
        try { arr = JSON.parse(res) } catch { arr = [] }
      }
      setApplications(Array.isArray(arr) ? arr : [])
    } catch (e) {
      setError(errMessage(e, 'Failed to load applications.'))
    } finally {
      setLoading(l => ({ ...l, applications: false }))
    }
  }

  useEffect(() => {
    if (tab === 'Overview')     fetchStats()
    if (tab === 'Users')        fetchUsers()
    if (tab === 'Resumes')      fetchResumes()
    if (tab === 'Searches')     fetchSearches()
    if (tab === 'Applications') fetchApplications()
  }, [tab])

  const handleUserAction = (action, user) => {
    if (action === 'delete') {
      setConfirm({
        title: 'Delete user?',
        message: `This will permanently delete ${user.full_name || user.username}. This action cannot be undone.`,
        danger: true,
        action: () => doAction('delete', user),
      })
    } else if (action === 'deactivate') {
      setConfirm({
        title: 'Deactivate user?',
        message: `${user.full_name || user.username} will lose access immediately.`,
        danger: false,
        action: () => doAction('deactivate', user),
      })
    } else if (action === 'activate') {
      setConfirm({
        title: 'Activate user?',
        message: `${user.full_name || user.username} will regain access.`,
        danger: false,
        action: () => doAction('activate', user),
      })
    } else if (action === 'makeAdmin') {
      setConfirm({
        title: 'Grant admin privileges?',
        message: `${user.full_name || user.username} will have full admin access.`,
        danger: false,
        action: () => doAction('makeAdmin', user),
      })
    }
  }

  const doAction = async (action, user) => {
    setConfirm(null)
    setBusy(true)
    try {
      let res
      if (action === 'delete')     res = await adminApi.deleteUser(user.id)
      if (action === 'makeAdmin')  res = await adminApi.makeAdmin(user.id)
      if (action === 'deactivate') res = await adminApi.deactivateUser(user.id)
      if (action === 'activate')   res = await adminApi.activateUser(user.id)

      console.log(`[Admin] ${action} response:`, res)
      await fetchUsers()
    } catch (e) {
      setError(errMessage(e, `Failed to ${action} user.`))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full">
      {/* ✅ NEW: Nested admin sidebar */}
      <AdminSidebar activeTab={tab} onTabChange={setTab} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 md:px-10 py-6 md:py-9 max-w-[1500px] w-full mx-auto animate-in">

        {/* ✅ NEW: Breadcrumbs */}
        <Breadcrumbs activeTab={tab} onTabChange={setTab} />

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
              <RiShieldStarLine size={26} className="text-amber" />
              {tab === 'Overview' ? 'Admin Dashboard' : tab}
            </h1>
            <p className="text-t3 text-sm mt-1.5">
              {tab === 'Overview'
                ? 'Manage users, monitor activity, and review platform data.'
                : `Viewing ${tab.toLowerCase()} data across the platform.`}
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3 mb-5 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-t4 hover:text-t1">
              <RiCloseLine size={16} />
            </button>
          </div>
        )}

        {/* Tab content */}
        {tab === 'Overview' && (
          <OverviewTab stats={stats} loading={loading.stats} />
        )}
        {tab === 'Users' && (
          <UsersTab
            users={users}
            loading={loading.users}
            onAction={handleUserAction}
            busy={busy}
            onRefresh={fetchUsers}
          />
        )}
        {tab === 'Resumes' && (
          <ResumesTab items={resumes} loading={loading.resumes} onRefresh={fetchResumes} />
        )}
        {tab === 'Searches' && (
          <SearchesTab items={searches} loading={loading.searches} onRefresh={fetchSearches} />
        )}
        {tab === 'Applications' && (
          <ApplicationsTab
            items={applications}
            loading={loading.applications}
            onRefresh={fetchApplications}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={confirm?.action}
      />
    </div>
  )
}