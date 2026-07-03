import { useState, useEffect, useMemo } from 'react'
import {
  RiHistoryLine, RiFilter3Line, RiArrowDownSLine, RiArrowUpSLine,
  RiLoader4Line, RiSearchLine, RiPlayLine,
  RiPushpin2Line, RiCheckLine, RiFileListLine,
} from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import { jobsApi } from './api/jobs'
import { errMessage } from './utils/errors'

const SORT_OPTIONS = ['Recent First', 'Oldest First', 'Most Jobs', 'Most Matches']

// ── Circular confidence ring ─────────────────────────────────
function ConfidenceRing({ value }) {
  const circumference = 2 * Math.PI * 38
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        <circle cx="44" cy="44" r="38" fill="none" stroke="var(--color-border)" strokeWidth="5" />
        <circle
          cx="44" cy="44" r="38" fill="none"
          stroke="#10B981" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-em font-extrabold text-xl">
        {value}%
      </span>
    </div>
  )
}

// ── History row ──────────────────────────────────────────────
function HistoryRow({ record, defaultOpen = false, onRerun }) {
  const [open, setOpen] = useState(defaultOpen)

  const jobsCount    = record.jobs_count    ?? record.total_jobs    ?? 0
  const matchesCount = record.top_matches_count ?? record.top_matches ?? record.matches_count ?? 0
  const confidence   = record.ai_confidence ?? record.confidence ?? null
  const profiles     = record.matched_profiles ?? record.career_profiles ?? []
  const minScore     = record.min_score ?? record.minimum_score ?? null
  const location     = record.location ?? record.location_radius ?? null
  const engine       = record.search_engine ?? record.engine ?? record.search_type ?? null

  const executedAt = record.created_at
    ? new Date(record.created_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
    : '—'

  return (
    <div className="card overflow-hidden">
      {/* Row header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-surface2/40 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-surface2 border border-border flex items-center justify-center text-t3 flex-shrink-0 mt-0.5">
            <RiPushpin2Line size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-t1 font-bold text-[17px] leading-snug">
              {record.query ?? record.search_query ?? record.location ?? `Search #${record.id}`}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-t4 text-xs">
              <span>Executed {executedAt}</span>
              {engine && <><span>·</span><span className="font-mono">{engine}</span></>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {jobsCount > 0 && (
            <span className="bg-surface2 border border-border text-t3 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg">
              {jobsCount.toLocaleString()} Jobs
            </span>
          )}
          {matchesCount > 0 && (
            <span className="bg-[#052E1C] border border-[#074D2F] text-em text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg">
              {matchesCount} Top Matches
            </span>
          )}
          {open ? <RiArrowUpSLine size={18} className="text-t3" /> : <RiArrowDownSLine size={18} className="text-t3" />}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-border px-5 py-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 animate-in">
          <div className="flex flex-col gap-5">
            {/* Matched profiles */}
            {profiles.length > 0 && (
              <div>
                <span className="label-xs block mb-3">Matched Career Profiles</span>
                <div className="flex flex-wrap gap-2">
                  {profiles.map((p, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 bg-surface2 border border-border text-t2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      <RiCheckLine size={12} className="text-em flex-shrink-0" />
                      {typeof p === 'string' ? p : p.name ?? p.title ?? JSON.stringify(p)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Session parameters */}
            {(minScore !== null || location !== null) && (
              <div>
                <span className="label-xs block mb-3">Session Parameters</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {minScore !== null && (
                    <div className="bg-surface2 border border-border rounded-lg px-4 py-3">
                      <div className="label-xs mb-1">Minimum Score</div>
                      <div className="text-em font-bold text-lg">{minScore}%</div>
                    </div>
                  )}
                  {location !== null && (
                    <div className="bg-surface2 border border-border rounded-lg px-4 py-3">
                      <div className="label-xs mb-1">Location Radius</div>
                      <div className="text-t1 font-semibold text-sm">{location}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top job titles if available */}
            {record.top_job_titles?.length > 0 && (
              <div>
                <span className="label-xs block mb-3">Top Role Matches</span>
                <div className="flex flex-wrap gap-2">
                  {record.top_job_titles.slice(0, 8).map((t, i) => (
                    <span key={i} className="text-t3 text-xs bg-surface2 border border-border px-2.5 py-1 rounded-md">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — confidence ring + rerun */}
          <div className="flex flex-col items-center gap-4 min-w-[160px]">
            {confidence !== null ? (
              <>
                <ConfidenceRing value={Math.round(confidence)} />
                <span className="label-xs text-center">AI Confidence</span>
              </>
            ) : matchesCount > 0 ? (
              <>
                <ConfidenceRing value={Math.round((matchesCount / Math.max(jobsCount, 1)) * 100)} />
                <span className="label-xs text-center">Match Rate</span>
              </>
            ) : null}

            <button
              onClick={() => onRerun(record)}
              className="btn-primary !w-auto px-5 gap-2"
            >
              <RiPlayLine size={14} /> Resume Search
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function History() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [sort, setSort]       = useState('Recent First')
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    jobsApi.history()
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(e => setError(errMessage(e, 'Could not load search history.')))
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => {
    const list = [...records]
    if (sort === 'Recent First') list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    if (sort === 'Oldest First') list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    if (sort === 'Most Jobs')    list.sort((a, b) => (b.jobs_count ?? 0) - (a.jobs_count ?? 0))
    if (sort === 'Most Matches') list.sort((a, b) => (b.top_matches_count ?? 0) - (a.top_matches_count ?? 0))
    return list
  }, [records, sort])

  // Cumulative stats from real history data
  const totalJobsScanned = records.reduce((s, r) => s + (r.jobs_count ?? 0), 0)
  const allScores = records.map(r => r.avg_score ?? r.ai_confidence ?? r.confidence).filter(Boolean)
  const avgMatchScore = allScores.length
    ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
    : null

  // Top keyword: most common query term across history records
  const topKeyword = useMemo(() => {
    const counts = {}
    records.forEach(r => {
      const q = r.query ?? r.search_query ?? r.location ?? ''
      if (q) counts[q] = (counts[q] || 0) + 1
    })
    const entries = Object.entries(counts)
    if (!entries.length) return null
    entries.sort((a, b) => b[1] - a[1])
    return entries[0][0]
  }, [records])

  const handleRerun = (record) => {
    navigate('/job-search', {
      state: { location: record.location, query: record.query ?? record.search_query }
    })
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
        <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
          <RiFileListLine size={26} className="text-t3 flex-shrink-0" />
          Search History
        </h1>
        <div className="relative">
          <button
            onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-2 bg-surface2 border border-border text-t1 text-sm font-mono px-4 py-2.5 rounded-lg hover:border-border2 transition-all"
          >
            <RiFilter3Line size={14} className="text-t3" />
            Sort: {sort}
            <RiArrowDownSLine size={14} className="text-t3" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-surface3 border border-border2 rounded-lg shadow-lg py-1 z-20">
              {SORT_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setSort(s); setSortOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${sort === s ? 'text-em font-semibold' : 'text-t2 hover:bg-surface2'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3 mb-5">{error}</div>
      )}

      {/* History list */}
      {loading ? (
        <div className="flex items-center justify-center py-32 gap-3">
          <RiLoader4Line size={24} className="text-em animate-spin" />
          <span className="text-t3 text-sm">Loading history…</span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-3">
          <RiHistoryLine size={32} className="text-t4" />
          <p className="text-t2 text-sm font-medium">No search history yet</p>
          <p className="text-t4 text-xs">Run your first job search to see results here.</p>
          <button onClick={() => navigate('/job-search')} className="btn-primary !w-auto px-5 mt-2">
            <RiSearchLine size={14} /> Start Searching
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-8">
          {sorted.map((record, i) => (
            <HistoryRow
              key={record.id ?? i}
              record={record}
              defaultOpen={i === 0}
              onRerun={handleRerun}
            />
          ))}
        </div>
      )}

      {/* Cumulative impact row — only shown when real data exists */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card px-6 py-5 md:col-span-1">
            <h3 className="text-t1 font-bold text-lg mb-1">Cumulative Impact</h3>
            <div className="flex items-end gap-2 mt-3">
              <span className="text-em text-4xl font-extrabold">{totalJobsScanned.toLocaleString()}</span>
              <span className="text-t4 text-sm mb-1">Jobs scanned this month</span>
            </div>
            <div className="mt-4 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-em rounded-full"
                style={{ width: `${Math.min((totalJobsScanned / 2000) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="card px-6 py-5">
            <span className="label-xs block mb-3">Top Keyword</span>
            {topKeyword ? (
              <>
                <div className="text-t1 font-bold text-base">"{topKeyword}"</div>
                <div className="text-t3 text-xs mt-1">Most searched this session</div>
              </>
            ) : (
              <div className="text-t4 text-sm">No keyword data yet</div>
            )}
          </div>

          <div className="card px-6 py-5">
            <span className="label-xs block mb-3">Avg Match Score</span>
            {avgMatchScore ? (
              <>
                <div className="text-cyan font-bold text-2xl">{avgMatchScore}%</div>
                <div className="text-t3 text-xs mt-1">Across all history</div>
              </>
            ) : (
              <div className="text-t4 text-sm">No score data yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}