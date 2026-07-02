import { useState } from 'react'
import {
  RiBriefcaseLine, RiSparklingLine, RiLoader4Line,
  RiAddLine, RiDeleteBin6Line, RiBarChartLine,
} from 'react-icons/ri'
import { linkedinApi } from './api/linkedin'
import { errMessage } from './utils/errors'

// ── Score ring (small) ────────────────────────────────────────
function MiniRing({ score }) {
  const s    = Math.round(score ?? 0)
  const r    = 26
  const circ = 2 * Math.PI * r
  const off  = circ - (s / 100) * circ
  const color = s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4.5" />
        <circle cx="32" cy="32" r={r} fill="none"
          stroke={color} strokeWidth="4.5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-extrabold text-base" style={{ color }}>{s}</span>
    </div>
  )
}

// ── Full Profile mode ─────────────────────────────────────────
function FullProfileMode() {
  const [summary, setSummary]       = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [industry, setIndustry]     = useState('')
  const [skills, setSkills]         = useState('')
  const [experiences, setExperiences] = useState([
    { title: '', company: '', achievements: '' },
  ])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [result, setResult]         = useState(null)

  const addExp = () => setExperiences(prev => [...prev, { title: '', company: '', achievements: '' }])
  const removeExp = (i) => setExperiences(prev => prev.filter((_, idx) => idx !== i))
  const updateExp = (i, field, val) => setExperiences(prev =>
    prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e)
  )

  const handleGenerate = async () => {
    if (!summary.trim()) { setError('Paste your current LinkedIn summary to continue.'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await linkedinApi.optimizeProfile({
        current_summary: summary.trim(),
        target_role:     targetRole.trim() || undefined,
        industry:        industry.trim() || undefined,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        experiences: experiences.filter(e => e.title || e.company),
      })
      setResult(res)
    } catch (e) {
      setError(errMessage(e, 'Profile optimization failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // Defensive field extraction
  const score          = result?.score ?? result?.optimization_score ?? null
  const optimized      = result?.optimized_summary ?? result?.summary ?? ''
  const tips           = result?.tips ?? result?.suggestions ?? []
  const insight        = result?.insight ?? result?.note ?? ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      {/* Left inputs */}
      <div className="flex flex-col gap-5">
        {/* Current summary */}
        <div className="card px-5 py-5">
          <span className="label-xs text-em block mb-3">Current Summary</span>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Paste your current LinkedIn 'About' section here..."
            rows={7}
            className="input-base resize-none text-sm leading-relaxed"
          />
        </div>

        {/* Target role + industry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label-xs">Target Role</label>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior AI Engineer" className="input-base" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-xs">Industry</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. Artificial Intelligence" className="input-base" />
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-1.5">
          <label className="label-xs">Key Skills (comma-separated)</label>
          <input value={skills} onChange={e => setSkills(e.target.value)}
            placeholder="FastAPI, LangChain, RAG, React…" className="input-base" />
        </div>

        {/* Experience highlights */}
        <div className="card px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <span className="label-xs text-em">Experience Highlights</span>
            <button onClick={addExp} className="flex items-center gap-1.5 text-em text-xs font-semibold hover:brightness-110 transition-all">
              <RiAddLine size={14} /> Add Experience
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {experiences.map((exp, i) => (
              <div key={i} className="bg-surface2 border border-border rounded-xl px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    value={exp.title ? `${exp.title}${exp.company ? ` @ ${exp.company}` : ''}` : ''}
                    onChange={e => {
                      const parts = e.target.value.split('@')
                      updateExp(i, 'title', parts[0].trim())
                      if (parts[1]) updateExp(i, 'company', parts[1].trim())
                    }}
                    placeholder="Title @ Company"
                    className="input-base text-sm font-semibold !bg-surface3"
                  />
                  {experiences.length > 1 && (
                    <button onClick={() => removeExp(i)} className="text-t4 hover:text-red transition-colors flex-shrink-0">
                      <RiDeleteBin6Line size={15} />
                    </button>
                  )}
                </div>
                <textarea
                  value={exp.achievements}
                  onChange={e => updateExp(i, 'achievements', e.target.value)}
                  placeholder="Key achievements and responsibilities..."
                  rows={3}
                  className="input-base resize-none text-xs !bg-surface3"
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
        )}

        <button onClick={handleGenerate} disabled={loading} className="btn-primary py-4 gap-3">
          {loading
            ? <><RiLoader4Line size={17} className="animate-spin" /> Optimizing…</>
            : <><RiSparklingLine size={17} /> Generate Optimized Profile</>
          }
        </button>
      </div>

      {/* Right panel */}
      <div className="flex flex-col gap-4">
        {/* Optimization score */}
        <div className="card px-5 py-5">
          <div className="flex items-center gap-2 mb-4">
            <RiBarChartLine size={16} className="text-em" />
            <span className="text-t1 font-bold">Optimization Score</span>
          </div>
          <div className="flex items-center gap-4">
            <MiniRing score={score ?? 75} />
            <div>
              <div className="text-t1 font-semibold text-sm">
                {score === null ? 'Pending analysis' : score >= 80 ? 'Strong Profile' : score >= 60 ? 'Needs Attention' : 'Needs Work'}
              </div>
              <div className="text-t4 text-xs mt-1 leading-relaxed">
                {result ? (
                  insight || (tips[0] ? tips[0] : 'Profile analyzed.')
                ) : (
                  'Generate an optimized profile to see your score.'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LinkedIn profile preview mockup */}
        <div className="card px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <span className="label-xs">Profile Preview</span>
            <span className="bg-surface3 text-t4 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md">Preview</span>
          </div>

          {/* Mockup — blurred skeleton or real content */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-surface3 border border-border flex-shrink-0 flex items-center justify-center text-t4">
              👤
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className={`h-3 rounded-full ${optimized ? 'bg-em/20' : 'bg-border'}`} style={{ width: '65%' }} />
              <div className={`h-2.5 rounded-full ${optimized ? 'bg-surface3' : 'bg-border/60'}`} style={{ width: '45%' }} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            {[100, 85, 90, 60].map((w, i) => (
              <div key={i} className={`h-2 rounded-full ${optimized ? 'bg-surface3' : 'bg-border/50'}`} style={{ width: `${w}%` }} />
            ))}
          </div>

          {/* Insight quote / optimized summary preview */}
          {optimized ? (
            <div className="bg-[#0A120D] border border-border rounded-xl px-4 py-3">
              <p className="text-em text-xs italic leading-relaxed line-clamp-4">
                "{optimized.slice(0, 240)}{optimized.length > 240 ? '…' : ''}"
              </p>
            </div>
          ) : (
            <div className="bg-surface2 border border-border rounded-xl px-4 py-3">
              <p className="text-t4 text-xs italic leading-relaxed">
                Your optimized summary will appear here after generation.
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        {tips.length > 0 && (
          <div className="card px-5 py-5">
            <span className="label-xs block mb-3">Profile Tips</span>
            <ul className="flex flex-col gap-2">
              {tips.slice(0, 4).map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-t3 text-xs leading-relaxed">
                  <span className="text-em mt-0.5 flex-shrink-0">✓</span>
                  {typeof t === 'string' ? t : t.tip ?? JSON.stringify(t)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Download if available */}
        {optimized && (
          <button
            onClick={() => {
              const blob = new Blob([optimized], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'linkedin_summary.txt'; a.click()
              URL.revokeObjectURL(url)
            }}
            className="btn-outline gap-2"
          >
            ⬇️ Download Optimized Summary
          </button>
        )}
      </div>
    </div>
  )
}

// ── Headline Only mode ────────────────────────────────────────
function HeadlineMode() {
  const [current, setCurrent]   = useState('')
  const [role, setRole]         = useState('')
  const [skills, setSkills]     = useState('')
  const [tone, setTone]         = useState('Professional')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [headlines, setHeadlines] = useState([])

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await linkedinApi.optimizeHeadline({
        current_headline: current.trim() || undefined,
        target_role:      role.trim() || undefined,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        tone,
      })
      const hs = res?.headlines || (Array.isArray(res) ? res : [res?.headline].filter(Boolean))
      setHeadlines(hs)
    } catch (e) {
      setError(errMessage(e, 'Headline optimization failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-xs">Current Headline</label>
          <input value={current} onChange={e => setCurrent(e.target.value)}
            placeholder="Software Engineer at Acme Corp" className="input-base" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-xs">Target Role</label>
          <input value={role} onChange={e => setRole(e.target.value)}
            placeholder="Senior AI/ML Engineer" className="input-base" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-xs">Top 3 Skills (comma-separated)</label>
          <input value={skills} onChange={e => setSkills(e.target.value)}
            placeholder="Python, LLMs, FastAPI" className="input-base" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-xs">Tone</label>
          <div className="grid grid-cols-4 gap-2">
            {['Professional','Bold','Creative','Minimal'].map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                  tone === t ? 'bg-em text-bg border-em' : 'border-border text-t3 hover:border-border2 hover:text-t1'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
        )}
        <button onClick={generate} disabled={loading} className="btn-primary gap-2">
          {loading ? <RiLoader4Line size={15} className="animate-spin" /> : <RiSparklingLine size={15} />}
          Generate Headlines
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {headlines.length > 0 ? (
          <>
            <span className="label-xs">Suggested Headlines</span>
            {headlines.map((h, i) => {
              const text = typeof h === 'string' ? h : h.headline ?? h.text ?? JSON.stringify(h)
              return (
                <div key={i} className="card px-5 py-4 hover:border-border2 transition-colors cursor-pointer group"
                  onClick={() => navigator.clipboard?.writeText(text)}>
                  <p className="text-t1 font-semibold text-sm leading-relaxed">{text}</p>
                  <span className="text-t4 text-[10px] mt-2 block group-hover:text-em transition-colors">Click to copy</span>
                </div>
              )
            })}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <span className="text-3xl mb-2">💼</span>
            <p className="text-t2 text-sm font-medium">Generated headlines appear here</p>
            <p className="text-t4 text-xs">Click any headline to copy it to your clipboard.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function LinkedIn() {
  const [mode, setMode] = useState('full')

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            💼 LinkedIn Optimizer
          </h1>
          <p className="text-t3 text-sm mt-1.5">Refine your professional narrative with AI precision.</p>
        </div>

        {/* Mode toggle — matches screenshot */}
        <div className="flex bg-surface2 border border-border rounded-lg p-1 gap-1">
          <button
            onClick={() => setMode('full')}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
              mode === 'full'
                ? 'bg-em text-bg shadow-sm'
                : 'text-t3 hover:text-t1'
            }`}
          >
            Full Profile
          </button>
          <button
            onClick={() => setMode('headline')}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
              mode === 'headline'
                ? 'bg-surface3 text-t1 border border-border2'
                : 'text-t3 hover:text-t1'
            }`}
          >
            Headline Only
          </button>
        </div>
      </div>

      {mode === 'full'     && <FullProfileMode />}
      {mode === 'headline' && <HeadlineMode />}
    </div>
  )
}
