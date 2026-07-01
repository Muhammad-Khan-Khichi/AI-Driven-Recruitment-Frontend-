import { useState } from 'react'
import {
  RiFlashlightLine, RiLoader4Line, RiExternalLinkLine,
  RiDatabase2Line, RiBarChartLine,
} from 'react-icons/ri'
import { semanticApi } from './api/semantic'
import { errMessage } from './utils/errors'

// ── Tab bar ──────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-border mb-7">
      {['Search', 'Index Jobs', 'Stats'].map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`
            pb-3 pr-8 text-sm font-medium relative transition-colors
            ${active === t ? 'text-t1' : 'text-t3 hover:text-t2'}
          `}
        >
          {t}
          {active === t && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-em rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}

// ── Match badge ───────────────────────────────────────────────
function MatchBadge({ score }) {
  const s = Math.round((score ?? 0) * 100) || Math.round(score ?? 0)
  const display = s > 1 ? s : Math.round(s * 100) // handle 0-1 or 0-100 range
  const color =
    display >= 90 ? 'bg-em/20 text-em border border-em/40' :
    display >= 80 ? 'bg-cyan/15 text-cyan border border-cyan/30' :
    'bg-surface3 text-t2 border border-border2'
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${color}`}>
      {display}% Match
    </span>
  )
}

// ── Result card ───────────────────────────────────────────────
function ResultCard({ job }) {
  const score  = job.score ?? job.similarity ?? job.semantic_score ?? job.final_score ?? 0
  // Normalize score to 0-100
  const pct    = score > 1 ? Math.round(score) : Math.round(score * 100)
  const tags   = job.tags || job.skills || []
  const salary = job.salary_range || job.salary || null

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-border2 transition-colors">
      {/* Top row: icon + match badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-11 h-11 rounded-lg bg-surface3 border border-border flex items-center justify-center text-lg flex-shrink-0">
          💼
        </div>
        <MatchBadge score={score} />
      </div>

      {/* Title + company */}
      <div>
        <h3 className="text-t1 font-bold text-[17px] leading-snug">{job.title || 'Untitled'}</h3>
        <p className="text-t3 text-[13px] mt-1">
          {job.company || 'Unknown'}
          {job.location && <> &bull; {job.location}</>}
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 5).map((t, i) => (
            <span
              key={i}
              className="bg-surface2 border border-border text-t3 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="h-px bg-border" />

      {/* Salary + link */}
      <div className="flex items-center justify-between">
        <span className="text-t2 text-sm">
          {salary || (job.description?.match(/\$[\d,]+k?\s*[-–]\s*\$[\d,]+k?/i)?.[0] ?? '')}
        </span>
        {job.url && job.url !== '#' ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-em text-xs font-semibold hover:underline flex items-center gap-1"
          >
            View Details <RiExternalLinkLine size={12} />
          </a>
        ) : (
          <span className="text-em text-xs font-semibold">View Details</span>
        )}
      </div>
    </div>
  )
}

// ── Search tab ────────────────────────────────────────────────
function SearchTab() {
  const [query, setQuery]     = useState('')
  const [topK, setTopK]       = useState(10)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError]     = useState('')

  const execute = async () => {
    if (!query.trim()) { setError('Enter a query to search.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await semanticApi.search(query.trim(), topK)
      const items = Array.isArray(res) ? res : (res?.results || res?.jobs || [])
      setResults(items)
    } catch (e) {
      setError(errMessage(e, 'Semantic search failed. Make sure jobs have been indexed first.'))
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Query panel */}
      <div className="card px-5 py-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="label-xs block mb-2">Neural Query</label>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && execute()}
              placeholder="e.g. Lead UI Designer with dark mode aesthetic expertise..."
              className="input-base py-4 text-[15px]"
            />
          </div>
          <div className="w-full sm:w-28">
            <label className="label-xs block mb-2">Top-K</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={e => setTopK(Number(e.target.value))}
              className="input-base py-4 text-center font-mono text-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={execute}
              disabled={loading}
              className="btn-primary !w-auto px-7 py-4 gap-2 whitespace-nowrap"
            >
              {loading
                ? <RiLoader4Line size={16} className="animate-spin" />
                : <RiFlashlightLine size={16} />}
              Execute
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3 mb-5">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 gap-3">
          <RiLoader4Line size={24} className="text-em animate-spin" />
          <span className="text-t3 text-sm">Running vector similarity search…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && results === null && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
          <span className="text-4xl mb-2">🔎</span>
          <p className="text-t2 text-sm font-medium">Enter a natural language query and hit Execute</p>
          <p className="text-t4 text-xs">Results are ranked by vector similarity, not keyword frequency.</p>
        </div>
      )}

      {/* No results */}
      {!loading && results !== null && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
          <p className="text-t2 text-sm font-medium">No matches found</p>
          <p className="text-t4 text-xs">Try indexing some jobs first via the "Index Jobs" tab.</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && results?.length > 0 && (
        <div>
          <p className="text-t3 text-sm mb-4">
            Found <span className="text-t1 font-bold">{results.length}</span> semantic matches
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {results.map((job, i) => (
              <ResultCard key={`${job.title}-${job.company}-${i}`} job={job} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ── Index Jobs tab ────────────────────────────────────────────
function IndexTab() {
  const [jobsJson, setJobsJson] = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')

  const index = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      let payload = {}
      if (jobsJson.trim()) {
        try {
          payload = { jobs: JSON.parse(jobsJson) }
        } catch {
          setError('Invalid JSON — check the format and try again.')
          setLoading(false)
          return
        }
      }
      const res = await semanticApi.index(payload)
      setResult(res)
    } catch (e) {
      setError(errMessage(e, 'Indexing failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-t3 text-sm mb-5">
        Trigger indexing of jobs into the vector store. Leave the field blank to re-index results from your last search, or paste a JSON array of job objects.
      </p>

      <div className="card px-5 py-5 mb-4">
        <label className="label-xs block mb-3">Jobs JSON Array (optional)</label>
        <textarea
          value={jobsJson}
          onChange={e => setJobsJson(e.target.value)}
          placeholder={`[\n  { "title": "...", "company": "...", "description": "..." }\n]`}
          rows={8}
          className="input-base font-mono text-xs resize-none"
        />
      </div>

      {error && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3 mb-4">{error}</div>
      )}

      {result && (
        <div className="bg-[#052E1C] border border-em text-em text-sm rounded-xl px-5 py-3 mb-4">
          ✅ Indexed successfully — {typeof result === 'string' ? result : JSON.stringify(result)}
        </div>
      )}

      <button onClick={index} disabled={loading} className="btn-primary !w-auto px-7 gap-2">
        {loading ? <RiLoader4Line size={15} className="animate-spin" /> : <RiDatabase2Line size={15} />}
        Index Jobs
      </button>
    </div>
  )
}

// ── Stats tab ─────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [fetched, setFetched] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await semanticApi.stats()
      setStats(data)
      setFetched(true)
    } catch (e) {
      setError(errMessage(e, 'Could not load stats.'))
    } finally {
      setLoading(false)
    }
  }

  if (!fetched) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <RiBarChartLine size={28} className="text-t4" />
        <p className="text-t2 text-sm">Load current index statistics</p>
        <button onClick={load} disabled={loading} className="btn-primary !w-auto px-6 gap-2">
          {loading ? <RiLoader4Line size={15} className="animate-spin" /> : <RiBarChartLine size={15} />}
          Load Stats
        </button>
      </div>
    )
  }

  if (error) {
    return <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-t3 text-sm">Current semantic index state</p>
        <button onClick={load} disabled={loading} className="btn-outline !w-auto px-4 gap-2 text-xs">
          {loading ? <RiLoader4Line size={13} className="animate-spin" /> : '↻'} Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats && Object.entries(stats).map(([key, val]) => (
          <div key={key} className="card px-5 py-4">
            <span className="label-xs block mb-2">{key.replace(/_/g, ' ')}</span>
            <span className="text-t1 font-bold text-xl">{String(val)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Semantic() {
  const [tab, setTab] = useState('Search')

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            🔍 Semantic Job Search
          </h1>
          <p className="text-t3 text-sm mt-1.5">
            Vector-based matching for nuanced career opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-em animate-pulse-slow" />
          <span className="text-t2 text-xs font-mono font-semibold tracking-wide">Vector Engine Active</span>
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'Search'     && <SearchTab />}
      {tab === 'Index Jobs' && <IndexTab />}
      {tab === 'Stats'      && <StatsTab />}
    </div>
  )
}
