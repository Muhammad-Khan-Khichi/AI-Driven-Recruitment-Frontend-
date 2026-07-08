import { useState, memo } from 'react'
import {
  RiDownload2Line, RiPushpinLine, RiMicLine, RiLoader4Line,
  RiPaletteLine,
  RiBarChartBoxLine,
  RiTerminalLine,
  RiCheckLine,
  RiErrorWarningLine,
} from 'react-icons/ri'
import { coverLetterApi } from '../../pages/api/coverLetter'
import { useResume } from '../../pages/context/ResumeContext'
import ScoreRing from './ScoreRing'

function deriveIcon(job) {
  const source = (job.source || '').toLowerCase()
  if (source.includes('design'))   return { bg: '#0C2233', Icon: RiPaletteLine }
  if (source.includes('data') || source.includes('backend')) return { bg: '#162019', Icon: RiBarChartBoxLine }
  return { bg: '#162019', Icon: RiTerminalLine }
}

function JobCard({ 
  job, 
  idx,
  resumeId,  
  onTrack, 
  onGenerateCoverLetter, 
  onInterviewPrep, 
  onLetterGenerated,
  tracking, 
  generatingLetter 
}) {
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState(null) 

  const { resumeData } = useResume()
  const contextResumeId = resumeData?.resume_id ?? resumeData?.id ?? null
  const effectiveResumeId = resumeId || job.resume_id || contextResumeId

  const score = job.final_score ?? job.ai_score ?? job.semantic_score ?? job.score ?? 0
  const { bg, Icon } = deriveIcon(job)
  const tags = job.tags || job.skills || []

  const handleTrack = (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (e?.stopPropagation) e.stopPropagation()
    onTrack(job, idx, e)
  }

  const handleGenerateCoverLetter = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (e?.stopPropagation) e.stopPropagation()

    if (!effectiveResumeId) {
      setMsg({ type: 'error', text: 'Please upload a resume first to generate cover letters.' })
      setTimeout(() => setMsg(null), 5000)
      return
    }

    setGenerating(true)
    setMsg(null)

    const payload = {
      resume_id: Number(effectiveResumeId),
      job_title: job.title || '',
      company: job.company || '',
      job_description: job.description || job.job_description || '',
      job_url: job.url || '',
      location: job.location || '',
      tone: 'professional',
    }

    try {
      const res = await coverLetterApi.generate(payload)
      
      const variant = res?.variants?.find(v => v.tone === 'professional') 
                   || res?.variants?.[0]
      
      if (variant?.body) {
        setGenerated(true)
        setMsg({ type: 'success', text: `Cover letter generated for ${job.company}` })
        onLetterGenerated?.(idx, variant.body, res.id)
        setTimeout(() => setMsg(null), 4000)
      } else {
        setMsg({ type: 'error', text: 'No variant returned' })
        setTimeout(() => setMsg(null), 4000)
      }
    } catch (err) {
      let detail = 'Generation failed'
      try {
        const parsed = JSON.parse(err.message)
        if (Array.isArray(parsed)) {
          detail = parsed.map(e => e.msg).join(', ')
        } else if (parsed?.detail) {
          detail = parsed.detail
        }
      } catch {
        detail =
          err?.response?.data?.detail?.[0]?.msg ||
          err?.response?.data?.detail ||
          err?.data?.detail ||
          err?.message ||
          'Generation failed'
      }
      
      setMsg({ type: 'error', text: detail })
      setTimeout(() => setMsg(null), 5000)
    } finally {
      setGenerating(false)
    }
  }

  const handleInterviewPrep = (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (e?.stopPropagation) e.stopPropagation()
    onInterviewPrep(job, e)
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: bg }}
          >
            <Icon size={22} className="text-t1" />
          </span>
          <div className="min-w-0">
            <h3 className="text-t1 font-bold text-[17px] leading-snug">{job.title || 'Untitled role'}</h3>
            <p className="text-t3 text-[13px] mt-1">
              {job.company || 'Unknown company'}
              {job.location && <> · {job.location}</>}
            </p>
          </div>
        </div>

        <ScoreRing score={score} />
      </div>

      {/* Inline message */}
      {msg && (
        <div className={`text-xs font-semibold rounded-lg px-3 py-2 flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-[#052E1C] border border-em text-em' :
          msg.type === 'error' ? 'bg-[#2D0A0A] border border-red text-red' :
          'bg-surface2 border border-border text-t2'
        }`}>
          {msg.type === 'success' 
            ? <RiCheckLine size={14} className="flex-shrink-0" /> 
            : <RiErrorWarningLine size={14} className="flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 6).map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="bg-surface2 border border-border text-t2 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {job.description && (
        <p className="text-t3 text-[13px] leading-relaxed line-clamp-2">
          {job.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5 mt-1">
        {generated ? (
          <button
            type="button"
            disabled
            className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-[#052E1C] border border-em text-em font-semibold text-xs rounded-lg px-3 py-2.5 cursor-default"
          >
            <RiCheckLine size={14} /> Generated
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerateCoverLetter}
            disabled={generating}
            title="Generate cover letter for this job"
            className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-em text-bg font-semibold text-xs rounded-lg px-3 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
          >
            {generating
              ? <RiLoader4Line size={14} className="animate-spin" />
              : <RiDownload2Line size={14} />}
            {generating ? 'Generating…' : 'Cover Letter'}
          </button>
        )}

        <button
          type="button"
          onClick={handleTrack}
          disabled={tracking}
          className="btn-outline flex-1 min-w-[80px] !py-2.5 text-xs"
        >
          {tracking ? <RiLoader4Line size={14} className="animate-spin" /> : <RiPushpinLine size={14} />}
          Track
        </button>

        <button
          type="button"
          onClick={handleInterviewPrep}
          className="btn-outline flex-1 min-w-[80px] !py-2.5 text-xs"
        >
          <RiMicLine size={14} /> Prep
        </button>
      </div>

      {/* View full posting */}
      {job.url && job.url !== '#' && (
        <button
          type="button"
          onClick={(e) => {
            if (e?.preventDefault) e.preventDefault()
            if (e?.stopPropagation) e.stopPropagation()
            window.open(job.url, '_blank', 'noopener,noreferrer')
          }}
          className="text-em text-xs font-medium hover:underline self-start -mt-1 text-left"
        >
          View full posting →
        </button>
      )}
    </div>
  )
}

export default memo(JobCard, (prevProps, nextProps) => {
  return (
    prevProps.job === nextProps.job &&
    prevProps.idx === nextProps.idx &&
    prevProps.resumeId === nextProps.resumeId &&
    prevProps.tracking === nextProps.tracking &&
    prevProps.generatingLetter === nextProps.generatingLetter
  )
})