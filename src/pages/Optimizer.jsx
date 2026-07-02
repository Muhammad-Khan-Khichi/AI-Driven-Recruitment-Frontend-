import { useState } from 'react'
import {
  RiMagicLine, RiFileTextLine, RiBriefcaseLine,
  RiCheckboxCircleLine, RiDownload2Line, RiLoader4Line,
  RiSparklingLine,
} from 'react-icons/ri'
import { resumeApi } from './api/resume'
import { useResume } from './context/ResumeContext'
import { errMessage } from './utils/errors'

// ── Score ring ────────────────────────────────────────────────
function ScoreRing({ score, size = 96 }) {
  const s    = Math.round(score ?? 0)
  const r    = 34
  const circ = 2 * Math.PI * r
  const off  = circ - (s / 100) * circ
  const color = s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-border)" strokeWidth="5" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-extrabold text-xl" style={{ color }}>{s}</span>
      </div>
    </div>
  )
}

// ── Relevancy label ───────────────────────────────────────────
function relevancyColor(val) {
  const v = (val || '').toLowerCase()
  if (v === 'high' || v === 'excellent') return 'text-em'
  if (v === 'medium' || v === 'moderate') return 'text-amber'
  return 'text-red'
}

// ── Download helper ───────────────────────────────────────────
function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Main page ─────────────────────────────────────────────────
export default function Optimizer() {
  const { resumeData } = useResume()

  const [jobDesc, setJobDesc]     = useState('')
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)

  const canOptimize = jobDesc.trim().length > 20 && resumeText.trim().length > 50

  const handleOptimize = async () => {
    if (!canOptimize) {
      setError('Paste a job description (20+ chars) and your resume (50+ chars) to continue.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await resumeApi.optimize({
        job_description: jobDesc.trim(),
        resume_text:     resumeText.trim(),
        job_title:       '',   // optional — user didn't enter a separate title field
      })
      setResult(res)
    } catch (e) {
      setError(errMessage(e, 'Optimization failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // Extract result fields defensively — API schema is "string" in docs so
  // we check multiple possible field names for each concept.
  const atsScore       = result?.score        ?? result?.ats_score    ?? result?.match_score ?? null
  const relevancy      = result?.relevancy    ?? result?.relevance     ?? null
  const keywordMatch   = result?.keyword_match ?? result?.keywords_matched ?? null
  const keywordTotal   = result?.keyword_total ?? result?.total_keywords   ?? null
  const suggestions    = result?.suggestions  ?? result?.improvements ?? []
  const optimizedText  = result?.optimized_text ?? result?.rewritten_resume ?? result?.content ?? ''

  // Header match accuracy — derived from ATS score or keyword match
  const headerAccuracy = atsScore !== null
    ? `${atsScore}%`
    : keywordMatch !== null && keywordTotal
      ? `${Math.round((keywordMatch / keywordTotal) * 100)}%`
      : null

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            📝 Resume Optimizer
          </h1>
          <p className="text-t3 text-sm mt-1.5 max-w-2xl">
            Align your professional profile with target job requirements using neural semantic analysis.
          </p>
        </div>
        {headerAccuracy && (
          <div className="flex items-center gap-3 border border-border rounded-xl px-5 py-3">
            <div>
              <div className="label-xs">Match Accuracy</div>
              <div className="text-em font-extrabold text-2xl leading-tight">{headerAccuracy}</div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-em flex items-center justify-center text-em">
              📈
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3 mb-5">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left — inputs */}
        <div className="flex flex-col gap-5">
          {/* Job description */}
          <div className="card px-5 py-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <RiBriefcaseLine size={16} className="text-cyan" />
              <span className="text-t1 font-semibold">Job Description</span>
            </div>
            <textarea
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              placeholder="Paste the target job description here..."
              rows={10}
              className="input-base resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Current resume */}
          <div className="card px-5 py-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <RiFileTextLine size={16} className="text-em" />
              <span className="text-t1 font-semibold">Current Resume</span>
            </div>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your current resume content..."
              rows={10}
              className="input-base resize-none text-sm leading-relaxed"
            />
            {resumeData?.text && !resumeText && (
              <button
                onClick={() => setResumeText(resumeData.text)}
                className="text-em text-xs font-semibold self-start hover:underline"
              >
                ↑ Use my uploaded resume
              </button>
            )}
          </div>

          {/* Optimize button */}
          <button
            onClick={handleOptimize}
            disabled={loading || !canOptimize}
            className="btn-primary py-4 gap-3 text-base disabled:opacity-50"
          >
            {loading
              ? <><RiLoader4Line size={18} className="animate-spin" /> Optimizing…</>
              : <><RiSparklingLine size={18} /> OPTIMIZE NOW</>
            }
          </button>
        </div>

        {/* Right — results */}
        <div className="flex flex-col gap-5">
          {/* Score cards — shown when result exists */}
          {result ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {/* ATS Score */}
                <div className="card px-4 py-4 flex flex-col items-center gap-3">
                  <span className="label-xs">ATS Score</span>
                  {atsScore !== null
                    ? <ScoreRing score={atsScore} />
                    : <span className="text-t4 text-sm">—</span>}
                </div>

                {/* Relevancy */}
                <div className="card px-4 py-4 flex flex-col items-center justify-center gap-2">
                  <span className="label-xs">Relevancy</span>
                  {relevancy
                    ? <span className={`text-2xl font-extrabold capitalize ${relevancyColor(relevancy)}`}>{relevancy}</span>
                    : <span className="text-t4 text-sm">—</span>}
                </div>

                {/* Keyword match */}
                <div className="card px-4 py-4 flex flex-col items-center justify-center gap-2">
                  <span className="label-xs">Keyword Match</span>
                  {keywordMatch !== null
                    ? <span className="text-t1 font-extrabold text-2xl">
                        {keywordMatch}{keywordTotal ? `/${keywordTotal}` : ''}
                      </span>
                    : <span className="text-t4 text-sm">—</span>}
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="card px-5 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <RiSparklingLine size={16} className="text-em" />
                    <span className="text-t1 font-semibold">Optimization Suggestions</span>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {suggestions.map((s, i) => {
                      const text = typeof s === 'string' ? s : s.suggestion ?? s.text ?? JSON.stringify(s)
                      const active = i < 3
                      return (
                        <li key={i} className={`flex items-start gap-2.5 text-sm leading-relaxed ${active ? 'text-t2' : 'text-t4'}`}>
                          <RiCheckboxCircleLine size={16} className={`flex-shrink-0 mt-0.5 ${active ? 'text-em' : 'text-t4'}`} />
                          {text}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Optimized resume output */}
              {optimizedText && (
                <div className="card px-5 py-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RiCheckboxCircleLine size={16} className="text-em" />
                      <span className="text-t1 font-semibold">Optimized Resume</span>
                    </div>
                    <button
                      onClick={() => downloadText(optimizedText, 'optimized_resume.txt')}
                      className="flex items-center gap-2 bg-em text-bg text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg hover:brightness-110 transition-all"
                    >
                      <RiDownload2Line size={13} /> Download PDF
                    </button>
                  </div>

                  {/* Terminal-style preview */}
                  <div className="bg-[#0A120D] border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border">
                      <span className="w-2.5 h-2.5 rounded-full bg-red/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-em/60" />
                    </div>
                    <pre className="px-5 py-4 text-xs text-t2 font-mono leading-relaxed overflow-auto max-h-72 whitespace-pre-wrap">
                      {optimizedText}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Placeholder state — shown before any result */
            <div className="flex flex-col gap-5">
              <div className="card px-5 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="label-xs">ATS Score</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full border-4 border-border flex items-center justify-center text-t4 text-2xl font-bold opacity-30">
                    —
                  </div>
                  <p className="text-t4 text-sm leading-relaxed">
                    Paste a job description and your resume, then click Optimize Now to see your ATS score, relevancy, and AI-generated improvements.
                  </p>
                </div>
              </div>

              <div className="card px-5 py-5 opacity-40">
                <div className="flex items-center gap-2 mb-3">
                  <RiSparklingLine size={16} className="text-em" />
                  <span className="text-t1 font-semibold">Optimization Suggestions</span>
                </div>
                <div className="flex flex-col gap-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-3 bg-border rounded-full" style={{ width: `${85 - i * 8}%` }} />
                  ))}
                </div>
              </div>

              <div className="card px-5 py-5 opacity-40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <RiCheckboxCircleLine size={16} className="text-em" />
                    <span className="text-t1 font-semibold">Optimized Resume</span>
                  </div>
                  <div className="bg-border text-transparent text-xs px-4 py-2 rounded-lg">Download</div>
                </div>
                <div className="bg-surface3 rounded-xl h-40 border border-border" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
