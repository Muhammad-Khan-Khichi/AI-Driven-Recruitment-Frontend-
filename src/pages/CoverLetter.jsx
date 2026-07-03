import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiMailLine, RiLoader4Line, RiFileCopyLine, RiDownload2Line,
  RiDeleteBinLine, RiEyeLine, RiCloseLine, RiCheckLine,
  RiEditLine, RiSaveLine, RiRefreshLine, RiBriefcaseLine,
  RiFileTextLine, RiSparklingLine,
} from 'react-icons/ri'
import { useResume } from './context/ResumeContext'
import { coverLetterApi } from './api/coverLetter'
import { errMessage } from './utils/errors'

// ─── helpers ────────────────────────────────────────────────────────────────

function extractResumeId(resumeData) {
  if (!resumeData) return ''
  return String(resumeData.resume_id ?? resumeData.id ?? '')
}

const TONES = [
  { value: 'professional',   label: 'Professional',   color: 'text-cyan',  bg: 'bg-[#0C2233]', border: 'border-[#0E3347]', dot: 'bg-cyan' },
  { value: 'conversational', label: 'Conversational',  color: 'text-em',    bg: 'bg-[#052E1C]', border: 'border-[#074D2F]', dot: 'bg-em' },
  { value: 'enthusiastic',   label: 'Enthusiastic',    color: 'text-amber', bg: 'bg-[#2D1A00]', border: 'border-[#3D2400]', dot: 'bg-amber' },
]

function toneConfig(tone) {
  return TONES.find(t => t.value === tone?.toLowerCase()) || TONES[0]
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── sub-components ─────────────────────────────────────────────────────────

/** Single variant card rendered in the generator result area */
function VariantCard({ variant, letterId, onSaved }) {
  const cfg = toneConfig(variant.tone)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(variant.body)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(variant.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([variant.body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover_letter_${variant.tone}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveEdit = async () => {
    if (!letterId) return
    setSaving(true)
    try {
      await coverLetterApi.update(letterId, draft)
      setSaveMsg('Saved!')
      setEditing(false)
      onSaved?.()
    } catch (err) {
      setSaveMsg(errMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 2500)
    }
  }

  return (
    <div className="email-card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`variant-circle text-sm`}>
            {variant.tone?.[0]?.toUpperCase() ?? 'A'}
          </span>
          <div>
            <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
            <p className="text-t4 text-[11px] tracking-wide uppercase">Tone variant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(e => !e)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              editing
                ? 'bg-surface3 border-border2 text-t1'
                : 'bg-surface2 border-border text-t3 hover:text-t1 hover:border-border2'
            }`}
          >
            <RiEditLine size={13} /> {editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={handleCopy} className="btn-outline-em !px-3 !py-1.5 !text-xs">
            {copied ? <RiCheckLine size={13} /> : <RiFileCopyLine size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleDownload} className="btn-outline-cyan !px-3 !py-1.5 !text-xs">
            <RiDownload2Line size={13} /> .txt
          </button>
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={14}
            className="input-base font-mono text-xs leading-relaxed resize-y"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="btn-primary !w-auto px-4 py-2 text-xs"
            >
              {saving ? <RiLoader4Line size={13} className="animate-spin" /> : <RiSaveLine size={13} />}
              Save edits
            </button>
            {saveMsg && (
              <span className={`text-xs font-semibold ${saveMsg === 'Saved!' ? 'text-em' : 'text-red'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      ) : (
        <pre className="text-t2 text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
          {variant.body}
        </pre>
      )}
    </div>
  )
}

/** Saved letter card in the right panel */
function SavedCard({ letter, onView, onDelete, deleting }) {
  return (
    <div className="contact-card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="contact-avatar w-10 h-10 text-sm flex-shrink-0">
            {(letter.company || letter.job_title || '?')[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-t1 font-semibold text-sm truncate">{letter.job_title || 'Untitled'}</p>
            <p className="text-t3 text-xs truncate">{letter.company || 'Unknown company'}</p>
            <p className="text-t4 text-[11px] mt-0.5">{formatDate(letter.created_at)}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(letter)}
          className="btn-outline-em !px-3 !py-1.5 !text-xs flex-1"
        >
          <RiEyeLine size={13} /> View
        </button>
        <button
          onClick={() => onDelete(letter.id)}
          disabled={deleting}
          className="btn-outline-red !px-3 !py-1.5 !text-xs"
        >
          {deleting ? <RiLoader4Line size={13} className="animate-spin" /> : <RiDeleteBinLine size={13} />}
        </button>
      </div>
    </div>
  )
}

/** Modal to view full cover letter detail */
function DetailModal({ letter, onClose }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    coverLetterApi.getOne(letter.id)
      .then(data => setDetail(data))
      .catch(err => setError(errMessage(err, 'Could not load cover letter.')))
      .finally(() => setLoading(false))
  }, [letter.id])

  const variants = detail?.variants || (detail?.body ? [{ tone: 'professional', body: detail.body }] : [])

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal-card p-6 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-t1 font-bold text-lg">{detail?.job_title || letter.job_title || 'Cover Letter'}</h2>
            <p className="text-t3 text-sm">{detail?.company || letter.company}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center text-t3 hover:text-t1 transition-all"
          >
            <RiCloseLine size={16} />
          </button>
        </div>

        <div className="gradient-divider" />

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RiLoader4Line size={24} className="text-em animate-spin" />
          </div>
        )}
        {error && <p className="text-red text-sm">{error}</p>}
        {!loading && !error && variants.map((v, i) => (
          <VariantCard key={i} variant={v} letterId={detail?.id} />
        ))}
      </div>
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function CoverLetter() {
  const navigate = useNavigate()
  const { resumeData, hasResume } = useResume()
  const resumeId = extractResumeId(resumeData)

  // Form
  const [form, setForm] = useState({
    resume_id: resumeId ? Number(resumeId) : '',
    job_title: '',
    company: '',
    job_description: '',
    job_url: '',
    location: '',
    tone: 'professional',
  })

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [result, setResult] = useState(null)   // { id, variants, job_title, company, created_at }
  const [elapsedSec, setElapsedSec] = useState(0)
  const timerRef = useRef(null)

  // Saved letters
  const [saved, setSaved] = useState([])
  const [savedLoading, setSavedLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  // Modal
  const [viewLetter, setViewLetter] = useState(null)

  // Update resume_id whenever context loads
  useEffect(() => {
    if (resumeId) setForm(f => ({ ...f, resume_id: Number(resumeId) }))
  }, [resumeId])

  // Elapsed timer
  useEffect(() => {
    if (generating) {
      setElapsedSec(0)
      timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [generating])

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  // Fetch saved letters
  const fetchSaved = () => {
    setSavedLoading(true)
    coverLetterApi.list()
      .then(data => setSaved(Array.isArray(data) ? data : []))
      .catch(() => setSaved([]))
      .finally(() => setSavedLoading(false))
  }

  useEffect(() => { fetchSaved() }, [])

  const handleChange = (field, value) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleGenerate = async () => {
    if (!form.job_title.trim() || !form.company.trim()) {
      setGenError('Job title and company are required.')
      return
    }
    setGenerating(true)
    setGenError('')
    setResult(null)
    try {
      const payload = {
        resume_id: form.resume_id || undefined,
        job_title: form.job_title.trim(),
        company: form.company.trim(),
        job_description: form.job_description.trim(),
        job_url: form.job_url.trim(),
        location: form.location.trim() || '',
        tone: form.tone,
      }
      const res = await coverLetterApi.generate(payload)
      setResult(res)
      fetchSaved()   // refresh saved list after generation
    } catch (err) {
      setGenError(errMessage(err, 'Generation failed. Please try again.'))
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await coverLetterApi.remove(id)
      setSaved(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      // silent — still remove optimistically on 200
    } finally {
      setDeletingId(null)
    }
  }

  const isFormValid = form.job_title.trim() && form.company.trim()

  return (
    <div className="animate-in">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            <RiMailLine size={26} className="text-t3" /> Cover Letters
          </h1>
          <p className="text-t3 text-sm mt-1.5">
            Generate 3-tone AI cover letters with Mistral — Professional, Conversational, Enthusiastic.
          </p>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      {/* ✅ FIX: h-[calc(100vh-...] makes columns same height, then we scroll only the right side */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 xl:items-start">

        {/* ════ Left — Generator (scrolls naturally with page) ════ */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* No-resume banner */}
          {!hasResume && (
            <div className="flex items-center justify-between gap-4 flex-wrap bg-[#3D2400] border border-amber rounded-xl px-5 py-4">
              <div>
                <p className="text-amber font-bold text-sm">No Resume Detected</p>
                <p className="text-[#FBBF7E] text-xs mt-0.5">
                  Upload a resume to pre-fill your resume ID and improve generation quality.
                </p>
              </div>
              <button
                onClick={() => navigate('/resume')}
                className="bg-amber text-bg text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg hover:brightness-110 transition-all flex-shrink-0"
              >
                Upload
              </button>
            </div>
          )}

          {/* Form card */}
          <div className="card px-6 py-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 mb-1">
              <RiSparklingLine size={16} className="text-em" />
              <span className="label-xs text-em">Generator</span>
            </div>

            {/* Row 1: Job title + Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="label-xs">Job Title *</label>
                <input
                  value={form.job_title}
                  onChange={e => handleChange('job_title', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="input-base"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-xs">Company *</label>
                <input
                  value={form.company}
                  onChange={e => handleChange('company', e.target.value)}
                  placeholder="e.g. Stripe"
                  className="input-base"
                />
              </div>
            </div>

            {/* Row 2: Job URL + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="label-xs">Job URL</label>
                <input
                  value={form.job_url}
                  onChange={e => handleChange('job_url', e.target.value)}
                  placeholder="https://…"
                  className="input-base"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-xs">Location</label>
                <input
                  value={form.location}
                  onChange={e => handleChange('location', e.target.value)}
                  placeholder="e.g. Remote, London"
                  className="input-base"
                />
              </div>
            </div>

            {/* Resume ID */}
            <div className="flex flex-col gap-1.5">
              <label className="label-xs flex items-center gap-2">
                Resume ID
                {hasResume && (
                  <span className="text-em text-[10px] font-bold normal-case tracking-normal">
                    ✓ auto-filled from your uploaded resume
                  </span>
                )}
              </label>
              <input
                type="number"
                value={form.resume_id}
                onChange={e => handleChange('resume_id', e.target.value ? Number(e.target.value) : '')}
                placeholder="Leave blank if unknown"
                className="input-base"
              />
            </div>

            {/* Job description */}
            <div className="flex flex-col gap-1.5">
              <label className="label-xs">Job Description</label>
              <textarea
                value={form.job_description}
                onChange={e => handleChange('job_description', e.target.value)}
                placeholder="Paste the job posting here — the more detail the better…"
                rows={5}
                className="input-base resize-y"
              />
            </div>

            {/* Tone selector */}
            <div className="flex flex-col gap-2">
              <span className="label-xs">Primary Tone</span>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => handleChange('tone', t.value)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all
                      ${form.tone === t.value
                        ? `${t.bg} ${t.color} ${t.border}`
                        : 'bg-surface2 text-t3 border-border hover:border-border2 hover:text-t2'}
                    `}
                  >
                    <span className={`w-2 h-2 rounded-full ${form.tone === t.value ? t.dot : 'bg-t4'}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {genError && (
              <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-lg px-4 py-3">
                {genError}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !isFormValid}
              className="btn-gradient"
            >
              {generating
                ? <><RiLoader4Line size={16} className="animate-spin" /> Generating…</>
                : <><RiSparklingLine size={16} /> Generate 3 Variants</>}
            </button>

            {/* Elapsed timer during generation */}
            {generating && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="bg-surface2 border border-border rounded-lg px-5 py-2 inline-flex items-center gap-3">
                  <span className="text-em font-mono text-lg font-bold">{formatElapsed(elapsedSec)}</span>
                  <span className="text-t4 text-xs">elapsed</span>
                </div>
                <p className="text-t4 text-xs max-w-sm">
                  Mistral is crafting 3 personalised variants — this usually takes 20–60 seconds.
                </p>
              </div>
            )}
          </div>

          {/* ── Results ── */}
          {result && (
            <div className="flex flex-col gap-5 animate-in">
              {/* Success banner */}
              <div className="flex items-center gap-3 bg-[#052E1C] border border-em rounded-xl px-5 py-3.5">
                <RiCheckLine size={18} className="text-em flex-shrink-0" />
                <div>
                  <p className="text-em font-bold text-sm">3 variants generated!</p>
                  <p className="text-t3 text-xs">
                    {result.job_title} @ {result.company} · saved {formatDate(result.created_at)}
                  </p>
                </div>
              </div>

              {/* Variant cards */}
              {(result.variants || []).map((v, i) => (
                <VariantCard
                  key={i}
                  variant={v}
                  letterId={result.id}
                  onSaved={fetchSaved}
                />
              ))}
            </div>
          )}
        </div>

        {/* ════ Right — Saved letters (✅ INDEPENDENT SCROLL) ════ */}
        {/* ✅ Sticky + max-height + overflow-y-auto = right column scrolls, page doesn't */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="flex flex-col gap-4 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 saved-letters-scroll">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiFileTextLine size={14} className="text-t3" />
                <span className="label-xs">Saved Letters</span>
              </div>
              <button
                onClick={fetchSaved}
                disabled={savedLoading}
                className="text-t4 hover:text-t2 transition-colors"
                title="Refresh"
              >
                <RiRefreshLine size={14} className={savedLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {savedLoading && (
              <div className="flex items-center justify-center py-10">
                <RiLoader4Line size={20} className="text-em animate-spin" />
              </div>
            )}

            {!savedLoading && saved.length === 0 && (
              <div className="empty-state !p-8">
                <RiBriefcaseLine size={28} className="text-t4 mx-auto mb-3" />
                <p className="text-t3 text-sm font-medium">No saved letters yet</p>
                <p className="text-t4 text-xs mt-1">Generated letters appear here automatically.</p>
              </div>
            )}

            {!savedLoading && saved.length > 0 && (
              <div className="flex flex-col gap-3">
                {saved.map(letter => (
                  <SavedCard
                    key={letter.id ?? letter}
                    letter={typeof letter === 'object' ? letter : { id: letter }}
                    onView={setViewLetter}
                    onDelete={handleDelete}
                    deleting={deletingId === (letter.id ?? letter)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail modal ── */}
      {viewLetter && (
        <DetailModal
          letter={viewLetter}
          onClose={() => setViewLetter(null)}
        />
      )}
    </div>
  )
}