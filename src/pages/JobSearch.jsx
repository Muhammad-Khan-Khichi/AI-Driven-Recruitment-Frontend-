import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiSearch2Line, RiFlashlightLine, RiAlertLine,
  RiArrowDownSLine, RiLoader4Line, RiUserStarLine, RiMapPin2Line,
} from 'react-icons/ri'
import { useAuth } from '../pages/context/AuthContext'
import { useResume } from '../pages/context/ResumeContext'
import { jobsApi } from './api/jobs'
import JobFilters from '../components/jobs/JobFilters'
import JobCard from '../components/jobs/JobCard'

const SORT_OPTIONS = [
  { value: 'final_score', label: 'Match Score' },
  { value: 'company',     label: 'Company' },
  { value: 'title',       label: 'Job Title' },
]

// Best-effort extraction of a resume id from whatever shape the upload
// endpoint actually returns — the documented schema is just `"string"`,
// so we defensively check a few common field names rather than assume.
function extractResumeId(resumeData) {
  if (!resumeData) return null
  return resumeData.resume_id ?? resumeData.id ?? null
}

export default function JobSearch() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hasResume, resumeData } = useResume()
  const resumeId = extractResumeId(resumeData)

  const [location, setLocation]       = useState(user?.location || '')
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')
  const [jobs, setJobs]               = useState(null)   // null = no search run yet
  const [searchMode, setSearchMode]   = useState(null)   // 'general' | 'resume'
  const [sortBy, setSortBy]           = useState('final_score')
  const [sortOpen, setSortOpen]       = useState(false)

  // Per-card async action state, keyed by job index since jobs have no stable id from API
  const [trackingIdx, setTrackingIdx] = useState(null)
  const [letterIdx, setLetterIdx]     = useState(null)
  const [trackedMsg, setTrackedMsg]   = useState('')

  const [filters, setFilters] = useState({
    activeTags:    [],
    roleTypes:     [],
    salaryMin:     0,
    salaryMax:     300000,
    salaryFloor:   0,
    remoteOnly:    false,
  })
  const [filtering, setFiltering] = useState(false)

  // Real elapsed-time tracking — this pipeline genuinely takes 1-6+ minutes
  // (confirmed from backend logs: each keyword combo runs job-board fetches +
  // semantic search + Mistral ranking sequentially, ~45-55s per combo), so a
  // fake progress bar would be misleading. We show actual seconds elapsed instead.
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

  // POST /jobs/search — generic search, location only, no resume tie-in at all
  const runGeneralSearch = async () => {
    if (!location.trim()) {
      setSearchError('Enter a location to search.')
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const res = await jobsApi.search(location.trim(), false)
      setJobs(res?.top_jobs || res?.jobs || [])
      setSearchMode('general')
    } catch (err) {
      setSearchError(typeof err === 'string' ? err : 'Search failed. Please try again.')
      setJobs([])
    } finally {
      setSearching(false)
    }
  }

  // POST /jobs/search-by-resume — extracts skills from a specific resume,
  // builds keyword combinations, scores jobs against resume skills, sorts
  // by match score, filters by min_match_score.
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
      const res = await jobsApi.searchByResume({
        resumeId,
        location: location.trim(),
        maxResultsPerKeyword: 20,
        minMatchScore: 20,
        generateCoverLetters: false,
      })
      setJobs(res?.top_jobs || res?.jobs || [])
      setSearchMode('resume')
    } catch (err) {
      setSearchError(typeof err === 'string' ? err : 'Resume search failed. Please try again.')
      setJobs([])
    } finally {
      setSearching(false)
    }
  }

  // POST /jobs/filter — real server-side filtering against the rich contract
  const applyServerFilters = async () => {
    if (!jobs || jobs.length === 0) return
    setFiltering(true)
    setSearchError('')
    try {
      const res = await jobsApi.filterJobs({
        jobs,
        remoteOnly:       filters.remoteOnly || undefined,
        minSalary:        filters.salaryFloor || undefined,
        experienceLevel:  filters.roleTypes.length ? filters.roleTypes.join(',') : undefined,
      })
      const filtered = Array.isArray(res) ? res : (res?.jobs || [])
      setJobs(filtered)
    } catch (err) {
      setSearchError(typeof err === 'string' ? err : 'Filtering failed.')
    } finally {
      setFiltering(false)
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
      setSearchError(typeof err === 'string' ? err : 'Could not track application.')
    } finally {
      setTrackingIdx(null)
    }
  }

  const handleGenerateCoverLetter = async (job, idx) => {
    setLetterIdx(idx)
    try {
      const res = await jobsApi.generateCoverLetter({
        job_title: job.title,
        company: job.company,
        job_description: job.description || '',
        user_name: user?.full_name || user?.username || 'Candidate',
      })
      if (res?.content) {
        setJobs(prev => prev.map((j, i) => i === idx ? { ...j, cover_letter: res.content } : j))
      }
    } catch (err) {
      setSearchError(typeof err === 'string' ? err : 'Could not generate cover letter.')
    } finally {
      setLetterIdx(null)
    }
  }

  const handleInterviewPrep = (job) => {
    navigate('/interview', { state: { jobTitle: job.title, company: job.company } })
  }

  // Client-side sort only — actual filtering now goes through the real /jobs/filter endpoint
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

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
          <RiSearch2Line size={26} className="text-t3" /> AI Job Search
        </h1>

        <div className="flex items-center gap-3">
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

      {/* No resume banner — real state from ResumeContext */}
      {!hasResume && (
        <div className="
          flex items-center justify-between gap-4 flex-wrap
          bg-[#3D2400] border border-amber rounded-xl px-5 py-4 mb-6
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
            className="bg-amber text-bg text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg hover:brightness-110 transition-all flex-shrink-0"
          >
            Upload Now
          </button>
        </div>
      )}

      {searchError && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3.5 mb-6">
          {searchError}
        </div>
      )}

      {trackedMsg && (
        <div className="bg-[#052E1C] border border-em text-em text-sm rounded-xl px-5 py-3 mb-6">
          ✅ {trackedMsg}
        </div>
      )}

      {/* Layout: filters sidebar + results */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters — applies via real /jobs/filter call */}
        <JobFilters
          filters={filters}
          setFilters={setFilters}
          trainingProgress={null /* no API field for this — omitted rather than faked */}
          onApply={applyServerFilters}
          applying={filtering}
          hasResults={Boolean(jobs && jobs.length > 0)}
        />

        {/* Results column */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Mode 1 — General location search: POST /jobs/search, no resume involved */}
          <div className="card px-5 py-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <RiMapPin2Line size={13} className="text-cyan" />
              <span className="label-xs text-cyan">General Search</span>
              <span className="text-t4 text-[11px]">— searches all open roles in a location</span>
            </div>
            <div className="flex gap-2.5">
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runGeneralSearch()}
                placeholder="City, country, or 'Remote'…"
                className="input-base py-3"
              />
              <button
                onClick={runGeneralSearch}
                disabled={searching}
                className="btn-outline !w-auto px-5 whitespace-nowrap text-cyan border-[#0E3347] hover:border-cyan"
              >
                {searching && searchMode !== 'resume'
                  ? <RiLoader4Line size={15} className="animate-spin" />
                  : <RiSearch2Line size={15} />}
                Search
              </button>
            </div>
          </div>

          {/* Mode 2 — Resume-matched search: POST /jobs/search-by-resume */}
          <div className="card px-5 py-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <RiUserStarLine size={13} className="text-em" />
              <span className="label-xs text-em">Resume Match Search</span>
              <span className="text-t4 text-[11px]">— extracts skills from your CV and scores results against them</span>
            </div>
            <div className="flex gap-2.5">
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runResumeSearch()}
                placeholder="City, country, or 'Remote'…"
                className="input-base py-3"
                disabled={!hasResume}
              />
              <button
                onClick={runResumeSearch}
                disabled={searching || !hasResume}
                className="btn-primary !w-auto px-5 whitespace-nowrap disabled:opacity-50"
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

          {/* Results count + sort */}
          {jobs !== null && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-t3 text-sm">
                Found <span className="text-t1 font-bold">{visibleJobs.length}</span> relevant opportunities
                {searchMode && (
                  <span className="text-t4"> &middot; via {searchMode === 'resume' ? 'resume match' : 'general search'}</span>
                )}
              </span>

              <div className="relative">
                <button
                  onClick={() => setSortOpen(o => !o)}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-t4">Sort by:</span>
                  <span className="text-em font-semibold">
                    {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                  </span>
                  <RiArrowDownSLine size={15} className="text-t3" />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-surface3 border border-border2 rounded-lg shadow-lg z-20 py-1.5">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                        className={`
                          w-full text-left px-3.5 py-2 text-sm transition-colors
                          ${sortBy === opt.value ? 'text-em font-semibold' : 'text-t2 hover:bg-surface2'}
                        `}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job grid / states */}
          {searching && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <RiLoader4Line size={28} className="text-em animate-spin" />
              <div>
                <p className="text-t2 text-sm font-medium">
                  {searchMode === 'resume'
                    ? 'Extracting skills, querying job boards, and ranking with AI…'
                    : 'Searching job boards and ranking with AI…'}
                </p>
                <p className="text-t4 text-xs mt-1.5">
                  This can take a few minutes — multiple job boards and AI ranking run per search.
                </p>
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

          {!searching && jobs === null && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
              <RiSearch2Line size={32} className="text-t4 mb-2" />
              <p className="text-t2 text-sm font-medium">Run a general or resume-matched search above</p>
              <p className="text-t4 text-xs">Results will appear here once the AI finishes ranking.</p>
            </div>
          )}

          {!searching && jobs !== null && visibleJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
              <p className="text-t2 text-sm font-medium">No jobs matched this search</p>
              <p className="text-t4 text-xs max-w-sm">
                {searchMode === 'resume'
                  ? 'The AI ranked all results below the minimum match threshold, or job boards returned no listings for this location. Try a broader location or re-run the search.'
                  : 'Try a different location, or switch to Resume Match Search for AI-ranked results.'}
              </p>
            </div>
          )}

          {!searching && visibleJobs.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
    </div>
  )
}
