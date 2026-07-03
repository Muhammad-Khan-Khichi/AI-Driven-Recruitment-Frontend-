import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiSearch2Line, RiFlashlightLine, RiAlertLine,
  RiArrowDownSLine, RiLoader4Line, RiUserStarLine, RiMapPin2Line,
  RiTimeLine, RiCheckLine,
  RiInfinityLine,        // Any time (∞ = unlimited)
  RiFlashlightFill,      // 24h (lightning = instant/fast)
  RiCalendarLine,        // 7d (calendar week)
  RiCalendarEventLine,   // 30d (calendar month)
} from 'react-icons/ri'
import { useAuth } from './context/AuthContext'
import { useResume } from './context/ResumeContext'
import { jobsApi } from './api/jobs'
import { coverLetterApi } from './api/coverLetter'
import { errMessage } from './utils/errors'
import JobCard from '../components/jobs/JobCard'

const SORT_OPTIONS = [
  { value: 'final_score', label: 'Match Score' },
  { value: 'company',     label: 'Company' },
  { value: 'title',       label: 'Job Title' },
]

// ✅ Icons are React component refs, not emoji strings
const TIME_FILTER_OPTIONS = [
  { value: 'any',  label: 'Any time',      Icon: RiInfinityLine },
  { value: '24h',  label: 'Last 24 hours', Icon: RiFlashlightFill },
  { value: '7d',   label: 'Last 7 days',   Icon: RiCalendarLine },
  { value: '30d',  label: 'Last 30 days',  Icon: RiCalendarEventLine },
]

// Best-effort extraction of a resume id from whatever shape the upload
// endpoint actually returns — the documented schema is just `"string"`,
// so we defensively check a few common field names rather than assume.
function extractResumeId(resumeData) {
  if (!resumeData) return null
  return resumeData.resume_id ?? resumeData.id ?? null
}

// ── Custom dropdown component ─────────────────────────────────
function CustomDropdown({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
  accent = 'em', // 'em' | 'cyan'
  minWidth = '150px',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const selected = options.find(o => o.value === value) || options[0]
  const accentClasses = accent === 'cyan'
    ? 'text-cyan border-[#0E3347] hover:border-cyan'
    : 'text-em border-border hover:border-em'
  const accentTextClass = accent === 'cyan' ? 'text-cyan' : 'text-em'
  const accentBgClass   = accent === 'cyan' ? 'bg-[#0C2233]' : 'bg-surface2'

  return (
    <div ref={ref} className="relative w-full sm:w-auto" style={{ minWidth }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`
          w-full flex items-center justify-between gap-2
          bg-surface2 border text-sm font-mono
          px-3.5 py-3 rounded-lg transition-all
          ${accentClasses}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${open ? accentTextClass : ''}
        `}
      >
        <span className="flex items-center gap-2 truncate">
          {/* ✅ Render the icon as a React component */}
          {selected.Icon && (
            <selected.Icon size={16} className={`flex-shrink-0 ${accentTextClass}`} />
          )}
          <span className="truncate">{selected.label}</span>
        </span>
        <RiArrowDownSLine
          size={14}
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${accentTextClass}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="
            absolute top-full mt-1.5 left-0
            w-full sm:w-auto sm:min-w-full
            bg-surface3 border border-border2 rounded-lg
            shadow-2xl shadow-black/40
            py-1 z-30
            animate-in
          "
          style={{ minWidth }}
          role="listbox"
        >
          {options.map(opt => {
            const isSelected = opt.value === value
            const Icon = opt.Icon
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`
                  w-full flex items-center justify-between gap-2
                  px-3.5 py-2.5 text-sm text-left
                  transition-colors
                  ${isSelected
                    ? `${accentTextClass} ${accentBgClass}`
                    : 'text-t2 hover:bg-surface2 hover:text-t1'
                  }
                `}
              >
                <span className="flex items-center gap-2 truncate">
                  {/* ✅ Render the icon in the option */}
                  {Icon && (
                    <Icon size={16} className={`flex-shrink-0 ${isSelected ? accentTextClass : 'text-t3'}`} />
                  )}
                  <span className="truncate">{opt.label}</span>
                </span>
                {isSelected && (
                  <RiCheckLine
                    size={14}
                    className={`flex-shrink-0 ${accentTextClass}`}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Custom sort dropdown (matches your existing design) ───────
function SortDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const selected = options.find(o => o.value === value) || options[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 text-sm"
      >
        <span className="text-t4">Sort by:</span>
        <span className="text-em font-semibold">{selected.label}</span>
        <RiArrowDownSLine
          size={15}
          className={`text-t3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-44
            bg-surface3 border border-border2 rounded-lg
            shadow-lg py-1.5 z-30
          "
          role="listbox"
        >
          {options.map(opt => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`
                  w-full text-left px-3.5 py-2 text-sm transition-colors
                  flex items-center justify-between
                  ${isSelected ? 'text-em font-semibold' : 'text-t2 hover:bg-surface2'}
                `}
              >
                <span>{opt.label}</span>
                {isSelected && <RiCheckLine size={14} className="text-em flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function JobSearch() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hasResume, resumeData } = useResume()
  const resumeId = extractResumeId(resumeData)

  const [location, setLocation]       = useState(user?.location || '')
  const [timeFilter, setTimeFilter]   = useState('any')
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')
  const [jobs, setJobs]               = useState(null)
  const [searchMode, setSearchMode]   = useState(null)
  const [sortBy, setSortBy]           = useState('final_score')
  const [sortOpen, setSortOpen]       = useState(false)

  const [trackingIdx, setTrackingIdx] = useState(null)
  const [letterIdx, setLetterIdx]     = useState(null)
  const [trackedMsg, setTrackedMsg]   = useState('')
  const [letterMsg, setLetterMsg]     = useState('')

  const [wantCoverLetters, setWantCoverLetters] = useState(false)

  const [elapsedSec, setElapsedSec] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (searching) {
      setElapsedSec(0)
      timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [searching])

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  const runGeneralSearch = async () => {
    if (!location.trim()) {
      setSearchError('Enter a location to search.')
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      console.log('[JobSearch] general search:', { location: location.trim(), timeFilter })
      const res = await jobsApi.search(location.trim(), wantCoverLetters, timeFilter)
      setJobs(res?.top_jobs || res?.jobs || [])
      setSearchMode('general')
    } catch (err) {
      setSearchError(errMessage(err, 'Search failed. Please try again.'))
      setJobs([])
    } finally {
      setSearching(false)
    }
  }

  const runResumeSearch = async () => {
    if (!location.trim()) {
      setSearchError('Enter a location to search.')
      return
    }
    if (!hasResume || !resumeId) {
      setSearchError('Upload a resume first to use resume-matched search.')
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      console.log('[JobSearch] resume search:', { resumeId, location: location.trim(), timeFilter })
      const res = await jobsApi.searchByResume({
        resumeId,
        location: location.trim(),
        maxResultsPerKeyword: 20,
        minMatchScore: 20,
        generateCoverLetters: wantCoverLetters,
        timeFilter,
      })
      setJobs(res?.top_jobs || res?.jobs || [])
      setSearchMode('resume')
    } catch (err) {
      setSearchError(errMessage(err, 'Resume search failed. Please try again.'))
      setJobs([])
    } finally {
      setSearching(false)
    }
  }

  const handleTrack = async (job, idx) => {
    setTrackingIdx(idx)
    try {
      await jobsApi.trackApplication({
        job_title: job.title,
        company: job.company,
        job_url: job.url || '',
        cover_letter: job.cover_letter || '',
        status: 'pending',
      })
      setTrackedMsg(`Tracked: ${job.title}`)
      setTimeout(() => setTrackedMsg(''), 2500)
    } catch (err) {
      setSearchError(errMessage(err, 'Could not track application.'))
    } finally {
      setTrackingIdx(null)
    }
  }

  const handleGenerateCoverLetter = async (job, idx) => {
    setLetterIdx(idx)
    setSearchError('')
    try {
      const res = await coverLetterApi.generate({
        resume_id: resumeId ? Number(resumeId) : undefined,
        job_title: job.title,
        company: job.company,
        job_description: job.description || '',
        job_url: job.url || '',
        location: job.location || '',
        tone: 'professional',
      })
      const professionalVariant = res?.variants?.find(v => v.tone === 'professional') || res?.variants?.[0]
      if (professionalVariant?.body) {
        setJobs(prev => prev.map((j, i) => i === idx ? { ...j, cover_letter: professionalVariant.body, cover_letter_id: res.id } : j))
      }
      setLetterMsg(`Generated for ${job.company} — view all 3 variants in Cover Letters`)
      setTimeout(() => setLetterMsg(''), 5000)
    } catch (err) {
      setSearchError(errMessage(err, 'Could not generate cover letter.'))
    } finally {
      setLetterIdx(null)
    }
  }

  const handleInterviewPrep = (job) => {
    navigate('/interview', { state: { jobTitle: job.title, company: job.company } })
  }

  const visibleJobs = useMemo(() => {
    if (!jobs) return []
    return [...jobs].sort((a, b) => {
      if (sortBy === 'final_score') {
        const sa = a.final_score ?? a.ai_score ?? a.match_score ?? a.semantic_score ?? 0
        const sb = b.final_score ?? b.ai_score ?? b.match_score ?? b.semantic_score ?? 0
        return sb - sa
      }
      return (a[sortBy] || '').localeCompare(b[sortBy] || '')
    })
  }, [jobs, sortBy])

  const timeFilterLabel = TIME_FILTER_OPTIONS.find(o => o.value === timeFilter)?.label || 'Any time'

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
          <RiSearch2Line size={26} className="text-t3" /> AI Job Search
        </h1>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={runGeneralSearch}
            disabled={searching}
            className="flex items-center gap-2 bg-em text-bg font-semibold text-sm rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
          >
            {searching && searchMode !== 'resume'
              ? <RiLoader4Line size={15} className="animate-spin" />
              : <RiFlashlightLine size={15} />}
            Quick Sync
          </button>
          {user && (
            <div className="w-10 h-10 rounded-full bg-surface3 border border-border2 flex items-center justify-center text-t2 font-semibold text-sm flex-shrink-0">
              {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* No resume banner */}
      {!hasResume && (
        <div className="
          flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4
          bg-[#3D2400] border border-amber rounded-xl px-4 sm:px-5 py-4 mb-6
        ">
          <div className="flex items-center gap-3">
            <RiAlertLine size={20} className="text-amber flex-shrink-0" />
            <div>
              <div className="text-amber font-bold text-[15px]">No Resume Detected</div>
              <div className="text-[#FBBF7E] text-xs mt-0.5">
                Resume-matched search is unavailable until you upload a CV. General search still works.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/resume')}
            className="bg-amber text-bg text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg hover:brightness-110 transition-all self-start sm:self-auto"
          >
            Upload Now
          </button>
        </div>
      )}

      {searchError && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-4 sm:px-5 py-3.5 mb-6">
          {searchError}
        </div>
      )}

      {trackedMsg && (
        <div className="bg-[#052E1C] border border-em text-em text-sm rounded-xl px-4 sm:px-5 py-3 mb-6">
          [tracked] {trackedMsg}
        </div>
      )}

      {letterMsg && (
        <div className="bg-[#052E1C] border border-em text-em text-sm rounded-xl px-4 sm:px-5 py-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>[letter] {letterMsg}</span>
          <button
            onClick={() => navigate('/cover-letter')}
            className="text-em font-bold text-xs border border-em rounded-lg px-3 py-1.5 hover:bg-em hover:text-bg transition-all self-start sm:self-auto"
          >
            View all variants →
          </button>
        </div>
      )}

      {/* Results column — full width */}
      <div className="flex flex-col gap-5 min-w-0">
        {/* Mode 1 — General location search */}
        <div className="card px-4 sm:px-5 py-4">
          <div className="flex items-start sm:items-center gap-1.5 mb-2.5">
            <RiMapPin2Line size={13} className="text-cyan flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="label-xs text-cyan">General Search</span>
            <span className="text-t4 text-[11px]">— searches all open roles in a location</span>
          </div>

          {/* ✅ Responsive: stacks on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runGeneralSearch()}
              placeholder="City, country, or 'Remote'…"
              className="input-base py-3 w-full sm:flex-1 min-w-0"
            />

            {/* ✅ Custom time filter dropdown (uses React icons) */}
            <CustomDropdown
              value={timeFilter}
              onChange={setTimeFilter}
              options={TIME_FILTER_OPTIONS}
              ariaLabel="Time filter"
              accent="cyan"
            />

            <button
              onClick={runGeneralSearch}
              disabled={searching}
              className="btn-outline !w-full sm:!w-auto px-5 whitespace-nowrap text-cyan border-[#0E3347] hover:border-cyan justify-center inline-flex items-center"
            >
              {searching && searchMode !== 'resume'
                ? <RiLoader4Line size={15} className="animate-spin" />
                : <RiSearch2Line size={15} />}
              Search
            </button>
          </div>
        </div>

        {/* Mode 2 — Resume-matched search */}
        <div className="card px-4 sm:px-5 py-4">
          <div className="flex items-start sm:items-center gap-1.5 mb-2.5">
            <RiUserStarLine size={13} className="text-em flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="label-xs text-em">Resume Match Search</span>
            <span className="text-t4 text-[11px]">— extracts skills from your CV and scores results against them</span>
          </div>

          {/* ✅ Responsive: stacks on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runResumeSearch()}
              placeholder="City, country, or 'Remote'…"
              className="input-base py-3 w-full sm:flex-1 min-w-0"
              disabled={!hasResume}
            />

            {/* ✅ Custom time filter dropdown (uses React icons) */}
            <CustomDropdown
              value={timeFilter}
              onChange={setTimeFilter}
              options={TIME_FILTER_OPTIONS}
              disabled={!hasResume}
              ariaLabel="Time filter"
              accent="em"
            />

            <button
              onClick={runResumeSearch}
              disabled={searching || !hasResume}
              className="btn-primary !w-full sm:!w-auto px-5 whitespace-nowrap disabled:opacity-50 justify-center inline-flex items-center"
            >
              {searching && searchMode === 'resume'
                ? <RiLoader4Line size={15} className="animate-spin" />
                : <RiUserStarLine size={15} />}
              Match My Resume
            </button>
          </div>
          {!hasResume && (
            <p className="text-t4 text-xs mt-2">Upload a resume to unlock this mode.</p>
          )}
        </div>

        {/* Cover letters toggle */}
        <label className="flex items-start sm:items-center gap-2.5 cursor-pointer select-none px-1">
          <input
            type="checkbox"
            checked={wantCoverLetters}
            onChange={e => setWantCoverLetters(e.target.checked)}
            className="sr-only peer"
          />
          <span className="
            w-[18px] h-[18px] rounded-md border border-border2 flex items-center justify-center
            peer-checked:bg-em peer-checked:border-em transition-all flex-shrink-0 mt-0.5 sm:mt-0
          ">
            {wantCoverLetters && (
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="#07090A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="text-t2 text-sm leading-tight">Generate cover letters</span>
          <span className="text-t4 text-xs leading-tight">— adds time to the search, generated per result</span>
        </label>

        {/* Results count + sort */}
        {jobs !== null && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-t3 text-sm leading-relaxed">
              Found <span className="text-t1 font-bold">{visibleJobs.length}</span> relevant opportunities
              {searchMode && (
                <span className="text-t4"> &middot; via {searchMode === 'resume' ? 'resume match' : 'general search'}</span>
              )}
              {timeFilter !== 'any' && (
                <span className="text-t4"> &middot; {timeFilterLabel}</span>
              )}
            </span>

            {/* ✅ Custom sort dropdown */}
            <div className="self-start sm:self-auto">
              <SortDropdown
                value={sortBy}
                onChange={(v) => { setSortBy(v); setSortOpen(false) }}
                options={SORT_OPTIONS}
              />
            </div>
          </div>
        )}

        {/* Searching state */}
        {searching && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4 text-center px-4">
            <RiLoader4Line size={28} className="text-em animate-spin" />
            <div>
              <p className="text-t2 text-sm font-medium">
                {searchMode === 'resume'
                  ? 'Extracting skills, querying job boards, and ranking with AI…'
                  : 'Searching job boards and ranking with AI…'}
              </p>
              <p className="text-t4 text-xs mt-1.5 max-w-sm mx-auto">
                This can take a few minutes — multiple job boards and AI ranking run per search.
              </p>
              {timeFilter !== 'any' && (
                <p className="text-em text-xs mt-1.5 font-semibold">
                  Filtering: {timeFilterLabel}
                </p>
              )}
            </div>
            <div className="bg-surface2 border border-border rounded-lg px-4 py-2">
              <span className="text-em font-mono text-sm font-semibold">{formatElapsed(elapsedSec)}</span>
              <span className="text-t4 text-xs ml-2">elapsed</span>
            </div>
            {elapsedSec > 90 && (
              <p className="text-t4 text-xs max-w-sm">
                Still working — the AI is running multiple keyword combinations through job boards and ranking each result. This is normal for thorough searches.
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!searching && jobs === null && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center gap-2 px-4">
            <RiSearch2Line size={32} className="text-t4 mb-2" />
            <p className="text-t2 text-sm font-medium">Run a general or resume-matched search above</p>
            <p className="text-t4 text-xs">Results will appear here once the AI finishes ranking.</p>
          </div>
        )}

        {/* No results */}
        {!searching && jobs !== null && visibleJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center gap-2 px-4">
            <p className="text-t2 text-sm font-medium">No jobs matched this search</p>
            <p className="text-t4 text-xs max-w-sm">
              {searchMode === 'resume'
                ? 'The AI ranked all results below the minimum match threshold, or job boards returned no listings for this location. Try a broader location or re-run the search.'
                : 'Try a different location, or switch to Resume Match Search for AI-ranked results.'}
            </p>
          </div>
        )}

        {/* Results grid */}
        {!searching && visibleJobs.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
            {visibleJobs.map((job, idx) => (
              <JobCard
                key={`${job.title}-${job.company}-${idx}`}
                job={job}
                tracking={trackingIdx === idx}
                generatingLetter={letterIdx === idx}
                onTrack={(j) => handleTrack(j, idx)}
                onGenerateCoverLetter={(j) => handleGenerateCoverLetter(j, idx)}
                onInterviewPrep={handleInterviewPrep}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}