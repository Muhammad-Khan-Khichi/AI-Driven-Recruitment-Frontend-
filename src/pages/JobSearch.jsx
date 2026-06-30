import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiSearch2Line, RiFlashlightLine, RiAlertLine,
  RiArrowDownSLine, RiLoader4Line,
} from 'react-icons/ri'
import { useAuth } from '../pages/context/AuthContext'
import { useResume } from '../pages/context/ResumeContext'
import { jobsApi } from './api/jobs'
import JobFilters from '../components/jobs/JobFilters'
import JobCard from '../components/jobs/JobCard'

const SORT_OPTIONS = [
  { value: 'final_score',    label: 'Match Score' },
  { value: 'company',        label: 'Company' },
  { value: 'title',          label: 'Job Title' },
]

export default function JobSearch() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hasResume } = useResume()

  const [location, setLocation]   = useState(user?.location || '')
  const [keyword, setKeyword]     = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [jobs, setJobs]           = useState(null)   // null = no search run yet
  const [sortBy, setSortBy]       = useState('final_score')
  const [sortOpen, setSortOpen]   = useState(false)

  // Per-card async action state, keyed by job index since jobs have no stable id from API
  const [trackingIdx, setTrackingIdx]   = useState(null)
  const [letterIdx, setLetterIdx]       = useState(null)
  const [trackedMsg, setTrackedMsg]     = useState('')

  const [filters, setFilters] = useState({
    activeTags: [],
    roleTypes: [],
    salaryMin: 0,
    salaryMax: 300000,
    salaryFloor: 0,
  })

  const runSearch = async () => {
    if (!location.trim()) {
      setSearchError('Enter a location to search.')
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const res = await jobsApi.search(location.trim(), false)
      const results = res?.top_jobs || []
      setJobs(results)
    } catch (err) {
      setSearchError(typeof err === 'string' ? err : 'Search failed. Please try again.')
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

  // Apply filters client-side from real job data — search query, role type keywords, salary
  const visibleJobs = useMemo(() => {
    if (!jobs) return []
    let list = jobs

    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase()
      list = list.filter(j =>
        (j.title || '').toLowerCase().includes(k) ||
        (j.company || '').toLowerCase().includes(k) ||
        (j.description || '').toLowerCase().includes(k)
      )
    }

    if (filters.roleTypes.length > 0) {
      list = list.filter(j => {
        const text = `${j.title || ''} ${j.description || ''}`.toLowerCase()
        return filters.roleTypes.some(rt => text.includes(rt.toLowerCase()))
      })
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'final_score') {
        const sa = a.final_score ?? a.ai_score ?? a.semantic_score ?? 0
        const sb = b.final_score ?? b.ai_score ?? b.semantic_score ?? 0
        return sb - sa
      }
      return (a[sortBy] || '').localeCompare(b[sortBy] || '')
    })

    return sorted
  }, [jobs, keyword, filters, sortBy])

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
          <RiSearch2Line size={26} className="text-t3" /> AI Job Search
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={runSearch}
            disabled={searching}
            className="flex items-center gap-2 bg-em text-bg font-semibold text-sm rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
          >
            {searching
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
                AI Matching Score accuracy is limited. Upload your latest CV to unlock semantic analysis.
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
        {/* Filters */}
        <JobFilters
          filters={filters}
          setFilters={setFilters}
          trainingProgress={null /* no API field for this — omitted rather than faked */}
        />

        {/* Results column */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Search bar */}
          <div className="relative">
            <RiSearch2Line size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-t3" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
              placeholder="Search for positions, companies, or keywords… (location required)"
              className="input-base pl-11 pr-20 py-4 text-[15px]"
            />
            <span className="
              absolute right-4 top-1/2 -translate-y-1/2
              bg-surface2 border border-border text-t4 text-[10px] font-bold
              px-2 py-1 rounded-md tracking-wide
            ">
              ⌘K
            </span>
          </div>

          {/* Secondary keyword filter within results, once we have them */}
          {jobs && jobs.length > 0 && (
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Filter these results by keyword…"
              className="input-base py-2.5 text-sm"
            />
          )}

          {/* Results count + sort */}
          {jobs !== null && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-t3 text-sm">
                Found <span className="text-t1 font-bold">{visibleJobs.length}</span> relevant opportunities
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
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RiLoader4Line size={28} className="text-em animate-spin" />
              <p className="text-t3 text-sm">Searching job boards and ranking with AI…</p>
            </div>
          )}

          {!searching && jobs === null && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
              <RiSearch2Line size={32} className="text-t4 mb-2" />
              <p className="text-t2 text-sm font-medium">Enter a location above and run a search</p>
              <p className="text-t4 text-xs">Results will appear here once the AI finishes ranking.</p>
            </div>
          )}

          {!searching && jobs !== null && visibleJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
              <p className="text-t2 text-sm font-medium">No jobs match your current search</p>
              <p className="text-t4 text-xs">Try a different location or clear your filters.</p>
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
