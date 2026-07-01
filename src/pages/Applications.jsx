import { useState, useEffect, useMemo } from 'react'
import {
  RiBarChartBoxLine, RiDownload2Line, RiAddLine, RiSearchLine,
  RiArrowDownSLine, RiArrowLeftSLine, RiArrowRightSLine,
  RiExternalLinkLine, RiLoader4Line, RiArrowUpSLine,
  RiCalendarLine,
} from 'react-icons/ri'
import { jobsApi } from './api/jobs'
import { errMessage } from './utils/errors'

// ── Constants ────────────────────────────────────────────────
const STATUS_OPTIONS = ['All Applications', 'pending', 'applied', 'interview', 'offer', 'rejected']
const SORT_OPTIONS   = ['Most Recent', 'Oldest', 'Highest Score', 'Company A-Z']
const PAGE_SIZE      = 5

const STATUS_STYLE = {
  pending:   { label: 'Pending',           className: 'bg-surface2 text-t3 border border-border' },
  applied:   { label: 'Applied',           className: 'bg-surface2 text-t2 border border-border' },
  interview: { label: 'Interviewing',      className: 'bg-[#0C2233] text-cyan border border-[#0E3347]' },
  offer:     { label: 'Offer Received',    className: 'bg-[#052E1C] text-em border border-[#074D2F]' },
  rejected:  { label: 'Rejected',         className: 'bg-[#2D0A0A] text-red border border-[#3D1212]' },
  assessment:{ label: 'Assessment',       className: 'bg-surface3 text-t2 border border-border2' },
}

function statusStyle(status = 'pending') {
  return STATUS_STYLE[status.toLowerCase()] ?? STATUS_STYLE.pending
}

function scoreBar(score = 0) {
  const s = Math.round(score)
  const color = s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444'
  return { s, color }
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = 'text-em' }) {
  return (
    <div className="card px-5 py-5 flex flex-col gap-1 min-w-0">
      <span className="label-xs">{label}</span>
      <div className="flex items-end gap-2 mt-1">
        <span className={`text-3xl font-extrabold tracking-tight ${accent}`}>{value ?? '—'}</span>
        {sub && <span className="text-t3 text-xs mb-1">{sub}</span>}
      </div>
    </div>
  )
}

// ── Application row ──────────────────────────────────────────
function AppRow({ app, onStatusChange, updating }) {
  const [expanded, setExpanded] = useState(false)
  const { s, color } = scoreBar(app.match_score ?? app.ai_score ?? app.score)
  const st = statusStyle(app.status)

  return (
    <div className={`border-b border-border transition-colors ${expanded ? 'bg-surface2/30' : 'hover:bg-surface/50'}`}>
      {/* Main row */}
      <div className="grid grid-cols-[1fr_140px_130px_160px_140px] items-center gap-4 px-4 py-4">
        {/* Company & Role */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-surface3 border border-border flex items-center justify-center text-t2 font-bold text-sm flex-shrink-0">
            {(app.company || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-t1 font-semibold text-[15px] truncate">{app.company || 'Unknown'}</div>
            <div className="text-em text-xs truncate font-mono">{app.job_title || 'Unknown role'}</div>
          </div>
        </div>

        {/* Applied date */}
        <div>
          <div className="text-t1 text-sm">
            {app.applied_at
              ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
          </div>
          {app.source && <div className="text-t4 text-[11px] mt-0.5">{app.source}</div>}
        </div>

        {/* AI match score */}
        <div className="flex items-center gap-2.5">
          {s > 0 ? (
            <>
              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s}%`, background: color }} />
              </div>
              <span className="text-sm font-bold w-10 text-right" style={{ color }}>{s}%</span>
            </>
          ) : (
            <span className="text-t4 text-xs">No score</span>
          )}
        </div>

        {/* Status */}
        <div>
          <select
            value={app.status || 'pending'}
            onChange={e => onStatusChange(app.id, e.target.value)}
            disabled={updating}
            className={`
              text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg
              border outline-none cursor-pointer appearance-none
              ${st.className}
              ${updating ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {['pending','applied','interview','offer','rejected'].map(s => (
              <option key={s} value={s} className="bg-surface text-t1 uppercase">
                {statusStyle(s).label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {app.status === 'interview' && (
            <span className="text-xs text-cyan font-semibold border border-[#0E3347] bg-[#0C2233] px-2.5 py-1 rounded-lg">
              Prep Interview
            </span>
          )}
          {app.status === 'offer' && (
            <span className="text-xs text-em font-semibold">View Details</span>
          )}
          {app.status === 'rejected' && (
            <span className="text-xs text-t3 font-semibold">View Feedback</span>
          )}
          {app.status === 'applied' && (
            <span className="text-xs text-amber font-semibold border border-amber/30 bg-amber/10 px-2.5 py-1 rounded-lg">
              Follow Up
            </span>
          )}
          {app.job_url && (
            <a href={app.job_url} target="_blank" rel="noreferrer" className="text-t3 hover:text-em transition-colors">
              <RiExternalLinkLine size={14} />
            </a>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-t3 hover:text-t1 transition-colors ml-1">
            {expanded ? <RiArrowUpSLine size={16} /> : <RiArrowDownSLine size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded notes */}
      {expanded && (
        <div className="px-16 pb-4">
          <textarea
            defaultValue={app.notes || ''}
            placeholder="Add notes about this application…"
            rows={2}
            className="input-base text-xs resize-none"
            onBlur={e => e.target.value !== (app.notes || '') && onStatusChange(app.id, app.status, e.target.value)}
          />
          {app.cover_letter && (
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(app.cover_letter)}`}
              download={`cover_letter_${(app.company || 'job').replace(/\s+/g, '_')}.txt`}
              className="inline-flex items-center gap-1.5 text-em text-xs font-semibold mt-2 hover:underline"
            >
              <RiDownload2Line size={13} /> Download Cover Letter
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── New Entry modal ──────────────────────────────────────────
function NewEntryModal({ onClose, onSave }) {
  const [form, setForm] = useState({ job_title: '', company: '', job_url: '', status: 'applied', notes: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.job_title || !form.company) { setErr('Role and company are required.'); return }
    setSaving(true)
    try { await onSave(form); onClose() }
    catch (e) { setErr(errMessage(e, 'Could not save.')) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 animate-in shadow-lg">
        <h2 className="text-t1 font-bold text-lg mb-5">+ New Application</h2>
        <div className="flex flex-col gap-3">
          <input className="input-base" placeholder="Job title *" value={form.job_title} onChange={e => set('job_title')(e.target.value)} />
          <input className="input-base" placeholder="Company *" value={form.company} onChange={e => set('company')(e.target.value)} />
          <input className="input-base" placeholder="Job URL (optional)" value={form.job_url} onChange={e => set('job_url')(e.target.value)} />
          <select className="input-base" value={form.status} onChange={e => set('status')(e.target.value)}>
            {['pending','applied','interview','offer','rejected'].map(s => (
              <option key={s} value={s}>{statusStyle(s).label}</option>
            ))}
          </select>
          <textarea className="input-base resize-none" rows={2} placeholder="Notes (optional)" value={form.notes} onChange={e => set('notes')(e.target.value)} />
          {err && <p className="text-red text-xs">{err}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <RiLoader4Line size={14} className="animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function Applications() {
  const [apps, setApps]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [statusFilter, setFilter] = useState('All Applications')
  const [sortOption, setSort]     = useState('Most Recent')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [updatingId, setUpdatingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await jobsApi.listApplications()
      setApps(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(errMessage(e, 'Could not load applications.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id, status, notes) => {
    setUpdatingId(id)
    try {
      await jobsApi.updateApplication(id, { status, notes })
      setApps(prev => prev.map(a => a.id === id ? { ...a, status, notes: notes ?? a.notes } : a))
    } catch (e) {
      setError(errMessage(e, 'Could not update application.'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleNewEntry = async (form) => {
    const saved = await jobsApi.trackApplication(form)
    await load() // reload to get server-assigned id/dates
  }

  // Derived stats from real data
  const total     = apps.length
  const interviews = apps.filter(a => a.status === 'interview').length
  const offers    = apps.filter(a => a.status === 'offer').length
  const rejected  = apps.filter(a => a.status === 'rejected').length
  const scores    = apps.map(a => a.match_score ?? a.ai_score ?? a.score).filter(Boolean)
  const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  const filtered = useMemo(() => {
    let list = [...apps]

    if (statusFilter !== 'All Applications')
      list = list.filter(a => a.status === statusFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        (a.company || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (sortOption === 'Most Recent') return new Date(b.applied_at || 0) - new Date(a.applied_at || 0)
      if (sortOption === 'Oldest')      return new Date(a.applied_at || 0) - new Date(b.applied_at || 0)
      if (sortOption === 'Highest Score') {
        const sa = a.match_score ?? a.ai_score ?? a.score ?? 0
        const sb = b.match_score ?? b.ai_score ?? b.score ?? 0
        return sb - sa
      }
      if (sortOption === 'Company A-Z') return (a.company || '').localeCompare(b.company || '')
      return 0
    })

    return list
  }, [apps, statusFilter, search, sortOption])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Export CSV from real data only
  const exportCSV = () => {
    const headers = ['Company', 'Role', 'Status', 'Match Score', 'Applied Date', 'URL']
    const rows = apps.map(a => [
      a.company || '', a.job_title || '', a.status || '',
      a.match_score ?? a.ai_score ?? a.score ?? '',
      a.applied_at ? new Date(a.applied_at).toLocaleDateString() : '',
      a.job_url || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'applications.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            <RiBarChartBoxLine size={26} className="text-t3" /> Application Tracker
          </h1>
          <p className="text-t3 text-sm mt-1.5">
            Real-time surveillance of your active career trajectory and AI-assisted pipelines.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="btn-outline !w-auto px-4 gap-2">
            <RiDownload2Line size={14} /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary !w-auto px-4 gap-2">
            <RiAddLine size={15} /> New Entry
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3 mb-5">{error}</div>
      )}

      {/* Stats row — all from real data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Active"  value={total}     sub={total === 1 ? '1 tracked' : `${total} tracked`}  />
        <StatCard label="Interviews"    value={interviews} sub={`${interviews} active`}  accent="text-cyan" />
        <StatCard label="Offers"        value={offers}     sub={offers === 1 ? '1 pending' : `${offers} received`} accent="text-em" />
        <StatCard label="Archived"      value={rejected}   sub="Lifetime"                accent="text-t3" />
        <StatCard
          label="Avg Match"
          value={avgScore !== null ? `${avgScore}%` : '—'}
          sub={avgScore !== null ? 'AI Verified' : 'No scores yet'}
          accent="text-em"
        />
      </div>

      {/* Table card */}
      <div className="card overflow-hidden mb-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border">
          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => { setFilterOpen(o => !o); setSortOpen(false) }}
              className="flex items-center gap-2 bg-surface2 border border-border text-t1 text-sm font-mono px-4 py-2.5 rounded-lg hover:border-border2 transition-all"
            >
              Status: {statusFilter} <RiArrowDownSLine size={14} className="text-t3" />
            </button>
            {filterOpen && (
              <div className="absolute top-full mt-1 left-0 w-52 bg-surface3 border border-border2 rounded-lg shadow-lg py-1 z-20">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setFilter(s); setFilterOpen(false); setPage(1) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${statusFilter === s ? 'text-em font-semibold' : 'text-t2 hover:bg-surface2'}`}
                  >
                    {s === 'All Applications' ? s : statusStyle(s).label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => { setSortOpen(o => !o); setFilterOpen(false) }}
              className="flex items-center gap-2 bg-surface2 border border-border text-t1 text-sm font-mono px-4 py-2.5 rounded-lg hover:border-border2 transition-all"
            >
              Sort: {sortOption} <RiArrowDownSLine size={14} className="text-t3" />
            </button>
            {sortOpen && (
              <div className="absolute top-full mt-1 left-0 w-44 bg-surface3 border border-border2 rounded-lg shadow-lg py-1 z-20">
                {SORT_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSort(s); setSortOpen(false); setPage(1) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortOption === s ? 'text-em font-semibold' : 'text-t2 hover:bg-surface2'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <RiSearchLine size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t3" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search applications..."
              className="input-base pl-9 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_140px_130px_160px_140px] gap-4 px-4 py-2.5 border-b border-border">
          {['Company & Role', 'Applied Date', 'AI Match Score', 'Current Status', 'Actions'].map(h => (
            <span key={h} className="label-xs">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <RiLoader4Line size={22} className="text-em animate-spin" />
            <span className="text-t3 text-sm">Loading applications…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <RiBarChartBoxLine size={28} className="text-t4 mb-1" />
            <p className="text-t2 text-sm font-medium">No applications found</p>
            <p className="text-t4 text-xs">Track a job from the Job Search page, or add one manually.</p>
          </div>
        ) : (
          paginated.map(app => (
            <AppRow
              key={app.id}
              app={app}
              onStatusChange={handleStatusChange}
              updating={updatingId === app.id}
            />
          ))
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <span className="text-t3 text-sm">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} applications
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-t3 hover:border-border2 hover:text-t1 disabled:opacity-40 transition-all"
              >
                <RiArrowLeftSLine size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                    page === n
                      ? 'bg-em text-bg'
                      : 'border border-border text-t3 hover:border-border2 hover:text-t1'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-t3 hover:border-border2 hover:text-t1 disabled:opacity-40 transition-all"
              >
                <RiArrowRightSLine size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom widgets row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weekly AI Forecast — derived from real data, not fabricated */}
        <div className="card px-5 py-5">
          <h3 className="text-t1 font-semibold flex items-center gap-2 mb-4">
            📈 Pipeline Summary
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Active pipeline', value: total - rejected, max: total },
              { label: 'Interview rate',  value: interviews, max: Math.max(total, 1), pct: total ? Math.round((interviews / total) * 100) : 0 },
              { label: 'Offer rate',      value: offers,     max: Math.max(total, 1), pct: total ? Math.round((offers / total) * 100) : 0 },
            ].map(({ label, value, max, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-t3">{label}</span>
                  <span className="text-t1 font-semibold">{pct !== undefined ? `${pct}%` : value}</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-em rounded-full" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming — only shown if interviews/offers exist */}
        <div className="card px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-t1 font-semibold flex items-center gap-2">
              <RiCalendarLine size={16} className="text-cyan" /> Active Pipeline
            </h3>
          </div>
          {apps.filter(a => ['interview', 'offer', 'applied'].includes(a.status)).length === 0 ? (
            <p className="text-t4 text-sm">No active applications in pipeline.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {apps
                .filter(a => ['interview', 'offer', 'applied'].includes(a.status))
                .slice(0, 3)
                .map(a => (
                  <div key={a.id} className="flex items-center gap-3 bg-surface2 rounded-lg px-3 py-2.5">
                    <div className="text-center flex-shrink-0">
                      <div className={`text-xs font-bold px-2 py-1 rounded-md ${statusStyle(a.status).className}`}>
                        {statusStyle(a.status).label}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-t1 text-sm font-semibold truncate">{a.job_title}</div>
                      <div className="text-t4 text-xs truncate">{a.company}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewEntryModal onClose={() => setShowModal(false)} onSave={handleNewEntry} />
      )}
    </div>
  )
}
