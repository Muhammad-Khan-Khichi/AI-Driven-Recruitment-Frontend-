import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiFlashlightLine, RiLoader4Line,
  RiSearchLine, RiSparklingLine,
  RiAlertLine,
} from 'react-icons/ri'
import { useResume } from './context/ResumeContext'
import { semanticApi } from './api/semantic'
import { jobsApi } from './api/jobs'
import { coverLetterApi } from './api/coverLetter'
import { errMessage } from './utils/errors'
import JobCard from '../components/jobs/JobCard'
import { useStore } from '../store/useStore'

// ── Deduplicate jobs ──────────────────────────────────────────
function deduplicateJobs(jobs) {
  const seen = new Map()
  for (const job of jobs) {
    const key = `${job.title ?? ''}__${job.company ?? ''}__${job.location ?? ''}`.toLowerCase()
    const existing = seen.get(key)
    const score = job.score ?? job.similarity ?? job.semantic_score ?? job.final_score ?? 0
    if (!existing || score > (existing.score ?? 0)) {
      seen.set(key, job)
    }
  }
  return Array.from(seen.values())
}

// ── Helper: build the payload based on what we have ─────────
// Different backends want different things — try multiple strategies
function buildCoverLetterPayload(job, resumeId) {
  const base = {
    job_title: job.title || '',
    company: job.company || '',
    job_description: job.description || '',
    job_url: job.url || '',
    location: job.location || '',
    tone: 'professional',
  }

  // Only attach resume_id when it's a real positive integer
  if (resumeId !== null && resumeId !== undefined && resumeId !== '') {
    const numId = Number(resumeId)
    if (Number.isFinite(numId) && numId > 0) {
      base.resume_id = numId
    }
  }

  return base
}

// ── Main page ─────────────────────────────────────────────────
export default function Semantic() {
  const navigate = useNavigate()
  const { resumeData } = useResume()
  const resumeId = resumeData?.resume_id ?? resumeData?.id ?? null

  const query = useStore((s) => s.semanticQuery)
  const setQuery = useStore((s) => s.setSemanticQuery)
  const topK = useStore((s) => s.topK)
  const setTopK = useStore((s) => s.setTopK)
  const results = useStore((s) => s.semanticResults)
  const setResults = useStore((s) => s.setSemanticResults)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [trackingIdx, setTrackingIdx] = useState(null)
  const [letterIdx, setLetterIdx]     = useState(null)
  const [trackedMsg, setTrackedMsg]   = useState('')
  const [letterMsg, setLetterMsg]     = useState('')
  const [letterWarning, setLetterWarning] = useState('')

  const execute = async () => {
    if (!query.trim()) { setError('Enter a query to search.'); return }
    setLoading(true)
    setError('')
    setTrackedMsg('')
    setLetterMsg('')
    setLetterWarning('')
    try {
      const res = await semanticApi.search(query.trim(), topK)
      const rawItems = Array.isArray(res) ? res : (res?.results || res?.jobs || [])
      const items = deduplicateJobs(rawItems)
      setResults(items)
    } catch (e) {
      setError(errMessage(e, 'Semantic search failed.'))
      setResults([])
    } finally {
      setLoading(false)
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
    } catch (e) {
      setError(errMessage(e, 'Could not track application.'))
    } finally {
      setTrackingIdx(null)
    }
  }

  // ✅ Generate cover letter — graceful handling for no resume
  const handleGenerateCoverLetter = async (job, idx) => {
    setLetterIdx(idx)
    setError('')
    setLetterWarning('')

    // Warn the user upfront if no resume — but still try
    if (!resumeId) {
      setLetterWarning('No resume attached — the cover letter will use the job description only.')
    }

    try {
      const payload = buildCoverLetterPayload(job, resumeId)
      console.log('[Semantic] cover letter payload:', payload)

      const res = await coverLetterApi.generate(payload)

      const variant = res?.variants?.find(v => v.tone === 'professional') || res?.variants?.[0]
      if (variant?.body) {
        setResults(prev => prev.map((j, i) =>
          i === idx ? { ...j, cover_letter: variant.body, cover_letter_id: res.id } : j
        ))
      }
      setLetterMsg(`Generated for ${job.company} — view all 3 variants in Cover Letters`)
      setTimeout(() => setLetterMsg(''), 5000)
    } catch (e) {
      // ✅ Handle the specific "resume_id required" error gracefully
      const errorMsg = errMessage(e, 'Could not generate cover letter.')

      // If backend says resume_id is missing, try a fallback
      if (errorMsg.includes('resume_id') || errorMsg.includes('Field required')) {
        // Option: don't show error, just disable the button instead
        setError(
          'Cover letter generation requires a resume. ' +
          'Upload a resume first, or use the "Generate cover letters" option during search.'
        )
      } else {
        setError(errorMsg)
      }
    } finally {
      setLetterIdx(null)
    }
  }

  const handleInterviewPrep = (job) => {
    navigate('/interview', {
      state: { jobTitle: job.title, company: job.company }
    })
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            <RiSparklingLine size={26} className="text-t3 flex-shrink-0" />
            Semantic Job Search
          </h1>
          <p className="text-t3 text-sm mt-1.5">
            Vector-based matching for nuanced career opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-2.5 self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-em animate-pulse-slow" />
          <span className="text-t2 text-xs font-mono font-semibold tracking-wide">Vector Engine Active</span>
        </div>
      </div>

      {/* No resume warning banner */}
      {!resumeId && (
        <div className="
          flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4
          bg-[#3D2400] border border-amber rounded-xl px-4 sm:px-5 py-4 mb-6
        ">
          <div className="flex items-center gap-3">
            <RiAlertLine size={20} className="text-amber flex-shrink-0" />
            <div>
              <div className="text-amber font-bold text-[15px]">No Resume Detected</div>
              <div className="text-[#FBBF7E] text-xs mt-0.5">
                Semantic search works without a resume, but cover letter generation requires one. Upload a CV to enable cover letters.
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

      {/* Query panel */}
      <div className="card px-4 sm:px-5 py-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <label className="label-xs block mb-2">Neural Query</label>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && execute()}
              placeholder="e.g. Lead UI Designer with dark mode aesthetic expertise..."
              className="input-base py-4 text-[15px] w-full"
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
              className="input-base py-4 text-center font-mono text-lg w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={execute}
              disabled={loading}
              className="btn-primary !w-full sm:!w-auto px-7 py-4 gap-2 whitespace-nowrap justify-center inline-flex items-center"
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
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-4 sm:px-5 py-3 mb-5">
          {error}
        </div>
      )}

      {letterWarning && (
        <div className="bg-[#3D2400] border border-amber text-amber text-sm rounded-xl px-4 sm:px-5 py-3 mb-5">
          {letterWarning}
        </div>
      )}

      {trackedMsg && (
        <div className="bg-[#052E1C] border border-em text-em text-sm rounded-xl px-4 sm:px-5 py-3 mb-5">
          [tracked] {trackedMsg}
        </div>
      )}

      {letterMsg && (
        <div className="bg-[#052E1C] border border-em text-em text-sm rounded-xl px-4 sm:px-5 py-3 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>[letter] {letterMsg}</span>
          <button
            onClick={() => navigate('/cover-letter')}
            className="text-em font-bold text-xs border border-em rounded-lg px-3 py-1.5 hover:bg-em hover:text-bg transition-all self-start sm:self-auto"
          >
            View all variants →
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 sm:py-24 gap-3">
          <RiLoader4Line size={24} className="text-em animate-spin" />
          <span className="text-t3 text-sm">Running vector similarity search…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && results === null && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center gap-2 px-4">
          <div className="w-14 h-14 rounded-full bg-surface3 border border-border flex items-center justify-center mb-2">
            <RiSearchLine size={24} className="text-t4" />
          </div>
          <p className="text-t2 text-sm font-medium">Enter a natural language query and hit Execute</p>
          <p className="text-t4 text-xs">Results are ranked by vector similarity, not keyword frequency.</p>
        </div>
      )}

      {/* No results */}
      {!loading && results !== null && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center gap-2 px-4">
          <p className="text-t2 text-sm font-medium">No matches found</p>
          <p className="text-t4 text-xs">Try a different query or broaden your search terms.</p>
        </div>
      )}

      {/* Results grid — 2 columns on big screens */}
      {!loading && results?.length > 0 && (
        <div>
          <p className="text-t3 text-sm mb-4">
            Found <span className="text-t1 font-bold">{results.length}</span> unique semantic matches
          </p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
            {results.map((job, idx) => (
              <JobCard
                key={`${job.title}-${job.company}-${job.location}-${idx}`}
                job={job}
                tracking={trackingIdx === idx}
                generatingLetter={letterIdx === idx}
                onTrack={(j) => handleTrack(j, idx)}
                onGenerateCoverLetter={(j) => handleGenerateCoverLetter(j, idx)}
                onInterviewPrep={handleInterviewPrep}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}