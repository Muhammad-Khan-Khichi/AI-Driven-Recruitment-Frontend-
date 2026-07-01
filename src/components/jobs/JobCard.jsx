import { useState } from 'react'
import { RiDownload2Line, RiPushpinLine, RiMicLine, RiLoader4Line } from 'react-icons/ri'
import ScoreRing from './ScoreRing'

// Stable icon/bg chosen from job source or first skill — purely visual, derived from real data
function deriveIcon(job) {
  const source = (job.source || '').toLowerCase()
  if (source.includes('design')) return { bg: '#0C2233', glyph: '🎨' }
  if (source.includes('data') || source.includes('backend')) return { bg: '#162019', glyph: '📊' }
  return { bg: '#162019', glyph: '💻' }
}

export default function JobCard({ job, onTrack, onGenerateCoverLetter, onInterviewPrep, tracking, generatingLetter }) {
  const score = job.final_score ?? job.ai_score ?? job.semantic_score ?? job.score ?? 0
  const icon = deriveIcon(job)

  // Tags: prefer explicit tags/skills field if backend provides one, else nothing (no fabricated tags)
  const tags = job.tags || job.skills || []

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-11 h-11 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: icon.bg }}
          >
            {icon.glyph}
          </span>
          <div className="min-w-0">
            <h3 className="text-t1 font-bold text-[17px] leading-snug">{job.title || 'Untitled role'}</h3>
            <p className="text-t3 text-[13px] mt-1">
              {job.company || 'Unknown company'}
              {job.location && <> &middot; {job.location}</>}
            </p>
          </div>
        </div>

        <ScoreRing score={score} />
      </div>

      {/* Tags — only rendered if the API actually returned some */}
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
        {job.cover_letter ? (
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(job.cover_letter)}`}
            download={`cover_letter_${(job.company || 'job').replace(/\s+/g, '_')}.txt`}
            className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-em text-bg font-semibold text-xs rounded-lg px-3 py-2.5 hover:brightness-110 transition-all"
          >
            <RiDownload2Line size={14} /> Cover Letter
          </a>
        ) : (
          <button
            onClick={() => onGenerateCoverLetter(job)}
            disabled={generatingLetter}
            title="Tries a dedicated cover-letter endpoint — if your backend doesn't have one, use the 'Generate cover letters' option before searching instead"
            className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-em text-bg font-semibold text-xs rounded-lg px-3 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
          >
            {generatingLetter
              ? <RiLoader4Line size={14} className="animate-spin" />
              : <RiDownload2Line size={14} />}
            Cover Letter
          </button>
        )}

        <button
          onClick={() => onTrack(job)}
          disabled={tracking}
          className="btn-outline flex-1 min-w-[80px] !py-2.5 text-xs"
        >
          {tracking ? <RiLoader4Line size={14} className="animate-spin" /> : <RiPushpinLine size={14} />}
          Track
        </button>

        <button
          onClick={() => onInterviewPrep(job)}
          className="btn-outline flex-1 min-w-[80px] !py-2.5 text-xs"
        >
          <RiMicLine size={14} /> Prep
        </button>
      </div>

      {job.url && job.url !== '#' && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="text-em text-xs font-medium hover:underline self-start -mt-1"
        >
          View full posting →
        </a>
      )}
    </div>
  )
}
