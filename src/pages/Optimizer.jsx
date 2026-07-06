import { useState } from 'react'
import {
  RiMagicLine, RiFileTextLine, RiBriefcaseLine,
  RiCheckboxCircleLine, RiDownload2Line, RiLoader4Line,
  RiSparklingLine, RiLineChartLine, RiFileEditLine,
  RiAlertLine, RiQuestionLine, RiFileChartLine,
} from 'react-icons/ri'
import { resumeApi } from './api/resume'
import { useResume } from './context/ResumeContext'
import { errMessage } from './utils/errors'
import { useStore } from '../store/useStore'

// ── Text normalizer ──────────────────────────────────────────
function normalizeText(text) {
  if (!text) return ''
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/([A-Za-z])\s+([A-Za-z])/g, '$1$2')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

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

function relevancyColor(val) {
  const v = (val || '').toLowerCase()
  if (v === 'high' || v === 'excellent') return 'text-em'
  if (v === 'medium' || v === 'moderate') return 'text-amber'
  return 'text-red'
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function Optimizer() {
  const { resumeData } = useResume()

  const jobDesc = useStore((s) => s.optimizerJobDesc)
  const setJobDesc = useStore((s) => s.setOptimizerJobDesc)
  const resumeText = useStore((s) => s.optimizerResumeText)
  const setResumeText = useStore((s) => s.setOptimizerResumeText)
  const result = useStore((s) => s.optimizerResult)
  const setResult = useStore((s) => s.setOptimizerResult)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

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
        job_title:       '',
      })
      console.log('[Optimizer] API response:', res)
      setResult(res)
    } catch (e) {
      console.error('[Optimizer] API error:', e)
      setError(errMessage(e, 'Optimization failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const atsScore     = result?.ats_score    ?? result?.score    ?? result?.match_score ?? null
  const relevancy    = result?.relevancy    ?? result?.relevance ?? null
  const keywordMatch = result?.keyword_match ?? result?.keywords_matched ?? null
  const keywordTotal = result?.keyword_total ?? result?.total_keywords ?? null

  // ✅ Use the normalizer for ALL text fields
  const summary = normalizeText(
    result?.summary ?? result?.optimized_text ?? result?.rewritten_resume ?? ''
  )
  const missingKws = result?.missing_keywords ?? []

  const allBullets = [
    ...(result?.weak_bullets     || []),
    ...(result?.suggested_bullets || []),
    ...(result?.gaps              || []),
    ...(result?.suggestions       || []),
    ...(result?.improvements      || []),
  ].map(b => {
    const text = typeof b === 'string' ? b : (b.text ?? b.suggestion ?? JSON.stringify(b))
    return normalizeText(text)
  }).filter(Boolean)

  const strengths = (result?.strengths || []).map(s => {
    const text = typeof s === 'string' ? s : (s.text ?? JSON.stringify(s))
    return normalizeText(text)
  }).filter(Boolean)

  const headerAccuracy = atsScore !== null ? `${atsScore}%` : null

  return (
    <div className="animate-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            <RiFileEditLine size={28} className="text-em" />
            Resume Optimizer
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
              <RiLineChartLine size={18} />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3 mb-5 flex items-start gap-2">
          <RiAlertLine size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left — inputs (sticky) */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-4 self-start">
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
                Use my uploaded resume
              </button>
            )}
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading || !canOptimize}
            className="btn-primary py-4 gap-3 text-base disabled:opacity-50"
          >
            {loading
              ? <><RiLoader4Line size={18} className="animate-spin" /> Optimizing...</>
              : <><RiMagicLine size={18} /> OPTIMIZE NOW</>
            }
          </button>
        </div>

        {/* Right — results (independent scroll) */}
        <div className="flex flex-col gap-5 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 -mr-2 optimizer-scroll">
          {result ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="card px-4 py-4 flex flex-col items-center gap-3">
                  <span className="label-xs">ATS Score</span>
                  {atsScore !== null
                    ? <ScoreRing score={atsScore} />
                    : <span className="text-t4 text-sm">-</span>}
                </div>

                <div className="card px-4 py-4 flex flex-col items-center justify-center gap-2">
                  <span className="label-xs">Relevancy</span>
                  {relevancy
                    ? <span className={`text-2xl font-extrabold capitalize ${relevancyColor(relevancy)}`}>{relevancy}</span>
                    : <span className="text-t4 text-sm">-</span>}
                </div>

                <div className="card px-4 py-4 flex flex-col items-center justify-center gap-2">
                  <span className="label-xs">Keyword Match</span>
                  {keywordMatch !== null
                    ? <span className="text-t1 font-extrabold text-2xl">
                        {keywordMatch}{keywordTotal ? `/${keywordTotal}` : ''}
                      </span>
                    : <span className="text-t4 text-sm">-</span>}
                </div>
              </div>

              {missingKws.length > 0 && (
                <div className="card px-5 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <RiQuestionLine size={16} className="text-amber" />
                    <span className="text-t1 font-semibold">Missing Keywords ({missingKws.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {missingKws.map((k, i) => (
                      <span key={i} className="text-xs bg-amber/10 text-amber border border-amber/30 px-2.5 py-1 rounded-md">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {strengths.length > 0 && (
                <div className="card px-5 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <RiCheckboxCircleLine size={16} className="text-em" />
                    <span className="text-t1 font-semibold">Your Strengths</span>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {strengths.map((text, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-t2">
                        <RiCheckboxCircleLine size={16} className="flex-shrink-0 mt-0.5 text-em" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {allBullets.length > 0 && (
                <div className="card px-5 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <RiSparklingLine size={16} className="text-em" />
                    <span className="text-t1 font-semibold">Optimization Suggestions</span>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {allBullets.map((text, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-t2">
                        <RiSparklingLine size={14} className="flex-shrink-0 mt-1 text-cyan" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary && (
                <div className="card px-5 py-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RiFileChartLine size={16} className="text-em" />
                      <span className="text-t1 font-semibold">AI Summary</span>
                    </div>
                    <button
                      onClick={() => downloadText(summary, 'optimized_resume.txt')}
                      className="flex items-center gap-2 bg-em text-bg text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg hover:brightness-110 transition-all"
                    >
                      <RiDownload2Line size={13} /> Download
                    </button>
                  </div>

                  {/* ✅ Plain div, no <pre>, no font-mono */}
                  <div className="px-5 py-4 text-sm text-t2 leading-relaxed overflow-auto max-h-72 whitespace-pre-wrap">
                    {summary}
                  </div>
                </div>
              )}

              {atsScore === null && missingKws.length === 0 && allBullets.length === 0 && strengths.length === 0 && !summary && (
                <div className="card px-5 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <RiAlertLine size={16} className="text-amber" />
                    <span className="text-t1 font-semibold">No analysis returned</span>
                  </div>
                  <pre className="text-xs text-t3 bg-[#0A120D] border border-border rounded-lg p-3 overflow-auto max-h-60">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="card px-5 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="label-xs">ATS Score</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full border-4 border-border flex items-center justify-center text-t4 text-2xl font-bold opacity-30">
                    -
                  </div>
                  <p className="text-t4 text-sm leading-relaxed">
                    Paste a job description and your resume, then click Optimize Now to see your ATS score, missing keywords, and AI suggestions.
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
                    <span className="text-t1 font-semibold">AI Summary</span>
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