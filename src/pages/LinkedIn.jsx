import { useState } from 'react'
import { 
  RiSparklingLine,
  RiLoader4Line,
  RiLinkedinBoxLine,
  RiUserStarLine,
  RiLightbulbLine,
  RiRocketLine,
  RiAwardLine,
  RiDownloadLine,
  RiSearchLine,
} from 'react-icons/ri'
import { linkedinApi } from './api/linkedin'
import { errMessage } from './utils/errors'
import { useStore } from '../store/useStore'

//    Score ring                      ─
function ScoreRing({ score }) {
  const s    = Math.round(score)
  const r    = 26
  const circ = 2 * Math.PI * r
  const off  = circ - (s / 100) * circ
  const color = s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444'
  const label = s >= 80 ? 'Strong Profile' : s >= 60 ? 'Needs Attention' : 'Needs Work'

  return (
    <div className="flex items-center gap-4">
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
      <div>
        <div className="text-t1 font-semibold text-sm">{label}</div>
        <div className="text-t4 text-xs mt-0.5">Optimization Score</div>
      </div>
    </div>
  )
}

//    Parse whatever the backend returns                                 
function parseProfileResponse(raw) {
  if (!raw) return null
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (t.startsWith('{') || t.startsWith('[')) {
      try { return JSON.parse(t) } catch {}
    }
    return { rawText: t }
  }
  return { rawText: String(raw) }
}

//    Full Profile mode                
function FullProfileMode({ 
  currentHeadline, setCurrentHeadline,
  currentAbout, setCurrentAbout,
  currentSkills, setCurrentSkills,
  targetRole, setTargetRole,
  yearsExp, setYearsExp,
  industry, setIndustry,
  result, setResult,
  loading, setLoading,
  error, setError 
}) {
  // ✅ Check if form is empty (About is required)
  const isFormEmpty = !currentAbout.trim()

  const handleGenerate = async () => {
    if (isFormEmpty) {
      setError('Paste your current LinkedIn About section to continue.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const raw = await linkedinApi.optimizeProfile({
        currentHeadline: currentHeadline.trim() || undefined,
        currentAbout:    currentAbout.trim(),
        currentSkills:   currentSkills.split(',').map(s => s.trim()).filter(Boolean),
        targetRole:      targetRole.trim() || undefined,
        yearsExperience: yearsExp ? Number(yearsExp) : undefined,
        industry:        industry.trim() || undefined,
      })
      setResult(parseProfileResponse(raw))
    } catch (e) {
      setError(errMessage(e, 'Profile optimization failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const score       = result?.score ?? result?.optimization_score ?? null
  const headline    = result?.headline ?? result?.improved_headline ?? result?.optimized_headline ?? ''
  const about       = result?.about   ?? result?.improved_about   ?? result?.optimized_about
                    ?? result?.optimized_summary ?? result?.summary ?? ''
  const skills      = result?.skills  ?? result?.recommended_skills ?? result?.improved_skills ?? []
  const tips        = result?.tips    ?? result?.suggestions ?? []
  const rawText     = result?.rawText ?? ''
  const hasStructured = headline || about || skills.length > 0 || tips.length > 0

  const downloadContent = [
    headline && `HEADLINE:\n${headline}`,
    about    && `\nABOUT:\n${about}`,
    skills.length && `\nSKILLS:\n${skills.join(', ')}`,
    tips.length   && `\nTIPS:\n${tips.map((t,i) => `${i+1}. ${typeof t === 'string' ? t : t.tip ?? JSON.stringify(t)}`).join('\n')}`,
    rawText && !hasStructured && `\n${rawText}`,
  ].filter(Boolean).join('\n')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:h-[calc(100vh-200px)]">
      {/*    Left — inputs    */}
      <div 
        className="flex flex-col gap-4 overflow-y-auto pr-2" 
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        <div className="card px-5 py-5 flex flex-col gap-4">
          <div>
            <label className="label-xs block mb-2 flex items-center gap-1.5">
              <RiUserStarLine size={12} />
              Current Headline
            </label>
            <input value={currentHeadline} onChange={e => setCurrentHeadline(e.target.value)}
              placeholder="e.g. Software Engineer at Acme" className="input-base" />
          </div>

          <div>
            <label className="label-xs block mb-2 flex items-center gap-1.5">
              <RiLinkedinBoxLine size={12} />
              Current About / Summary *
            </label>
            <textarea value={currentAbout} onChange={e => setCurrentAbout(e.target.value)}
              placeholder="Paste your current LinkedIn 'About' section here..."
              rows={7} className="input-base resize-none text-sm leading-relaxed" />
          </div>

          <div>
            <label className="label-xs block mb-2 flex items-center gap-1.5">
              <RiLightbulbLine size={12} />
              Current Skills (comma-separated)
            </label>
            <input value={currentSkills} onChange={e => setCurrentSkills(e.target.value)}
              placeholder="Python, FastAPI, LangChain, React…" className="input-base" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="label-xs block mb-2 flex items-center gap-1.5">
              <RiRocketLine size={12} />
              Target Role
            </label>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
              placeholder="Senior AI Engineer" className="input-base" />
          </div>
          <div>
            <label className="label-xs block mb-2 flex items-center gap-1.5">
              <RiSearchLine size={12} />
              Industry
            </label>
            <input value={industry} onChange={e => setIndustry(e.target.value)}
              placeholder="Artificial Intelligence" className="input-base" />
          </div>
          <div>
            <label className="label-xs block mb-2 flex items-center gap-1.5">
              <RiAwardLine size={12} />
              Years Experience
            </label>
            <input type="number" min={0} max={40} value={yearsExp}
              onChange={e => setYearsExp(e.target.value)}
              placeholder="e.g. 3" className="input-base" />
          </div>
        </div>

        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
        )}

        {/* ✅ Button is disabled when form is empty OR loading */}
        <button 
          onClick={handleGenerate} 
          disabled={loading || isFormEmpty}  // ✅ Disabled logic
          className={`btn-primary py-4 gap-3 ${
            (loading || isFormEmpty) 
              ? 'opacity-50 cursor-not-allowed'  // ✅ Visual feedback
              : ''
          }`}
        >
          {loading
            ? <><RiLoader4Line size={17} className="animate-spin" /> Optimizing profile…</>
            : <>
                <RiSparklingLine size={17} />
                {isFormEmpty ? 'Fill About to Continue' : 'Generate Optimized Profile'}  {/* ✅ Dynamic text */}
              </>}
        </button>

        {/* ✅ Helper text under button */}
        {isFormEmpty && !loading && (
          <p className="text-t4 text-xs text-center -mt-2">
            Paste your About section to enable this button
          </p>
        )}
      </div>

      {/*    Right — results    */}
      <div 
        className="flex flex-col gap-4 overflow-y-auto pr-2" 
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {!result && !loading && (
          <div className="card px-5 py-10 flex flex-col items-center justify-center text-center gap-2">
            <RiSparklingLine className="text-em opacity-30" size={48} />
            <p className="text-t2 text-sm font-medium">Results appear here</p>
            <p className="text-t4 text-xs">Fill in your profile details and click Generate.</p>
          </div>
        )}

        {loading && (
          <div className="card px-5 py-10 flex flex-col items-center justify-center gap-3">
            <RiLoader4Line size={24} className="text-em animate-spin" />
            <p className="text-t3 text-sm">AI is optimizing your profile…</p>
          </div>
        )}

        {result && !loading && (
          <>
            {score !== null && (
              <div className="card px-5 py-5">
                <ScoreRing score={score} />
              </div>
            )}

            {headline && (
              <div className="card px-5 py-4">
                <span className="label-xs block mb-2">Optimized Headline</span>
                <p className="text-t1 font-semibold text-sm leading-relaxed">{headline}</p>
              </div>
            )}

            {about && (
              <div className="card px-5 py-4">
                <span className="label-xs block mb-3">Optimized About</span>
                <p className="text-t2 text-sm leading-relaxed whitespace-pre-wrap">{about}</p>
              </div>
            )}

            {skills.length > 0 && (
              <div className="card px-5 py-4">
                <span className="label-xs block mb-3">Recommended Skills</span>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="bg-surface2 border border-border text-t2 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {typeof s === 'string' ? s : JSON.stringify(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tips.length > 0 && (
              <div className="card px-5 py-4">
                <span className="label-xs block mb-3">Profile Tips</span>
                <ul className="flex flex-col gap-2">
                  {tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-t3 text-xs leading-relaxed">
                      <span className="text-em flex-shrink-0 mt-0.5">✓</span>
                      {typeof t === 'string' ? t : t.tip ?? t.text ?? JSON.stringify(t)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!hasStructured && rawText && (
              <div className="card px-5 py-4">
                <span className="label-xs block mb-3">AI Response</span>
                <pre className="text-t2 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-auto max-h-80">
                  {rawText}
                </pre>
              </div>
            )}

            {downloadContent && (
              <button
                onClick={() => {
                  const blob = new Blob([downloadContent], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = 'linkedin_profile.txt'; a.click()
                  URL.revokeObjectURL(url)
                }}
                className="btn-outline gap-2"
              >
                <RiDownloadLine size={15} />
                Download Optimized Profile
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

//    Headline Only mode              ─
function HeadlineMode({
  currentHeadline, setCurrentHeadline,
  targetRole, setTargetRole,
  headlineResult, setHeadlineResult,
  loading, setLoading,
  error, setError 
}) {
  // ✅ Headline mode: need at least target role OR current headline
  const isFormEmpty = !currentHeadline.trim() && !targetRole.trim()

  const generate = async () => {
    if (isFormEmpty) {
      setError('Enter at least a current headline or target role.')
      return
    }
    setLoading(true)
    setError('')
    setHeadlineResult(null)
    try {
      const raw = await linkedinApi.optimizeHeadline({
        currentHeadline: currentHeadline.trim() || undefined,
        targetRole:      targetRole.trim()      || undefined,
      })
      setHeadlineResult(raw)
    } catch (e) {
      setError(errMessage(e, 'Headline optimization failed.'))
    } finally {
      setLoading(false)
    }
  }

  const headlines = (() => {
    if (!headlineResult) return []
    if (typeof headlineResult === 'object') {
      return headlineResult?.headlines ?? headlineResult?.alternatives
        ?? (Array.isArray(headlineResult) ? headlineResult : [headlineResult?.headline].filter(Boolean))
    }
    if (typeof headlineResult === 'string') {
      const t = headlineResult.trim()
      try {
        const parsed = JSON.parse(t)
        return parsed?.headlines ?? parsed?.alternatives
          ?? (Array.isArray(parsed) ? parsed : [parsed?.headline ?? t].filter(Boolean))
      } catch {
        return t.split('\n').map(l => l.replace(/^[\d\.\-\*]+\s*/, '').trim()).filter(l => l.length > 5)
      }
    }
    return []
  })()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[calc(100vh-200px)]">
      {/* Left - inputs */}
      <div 
        className="flex flex-col gap-4 overflow-y-auto pr-2" 
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        <div className="card px-5 py-5 flex flex-col gap-4">
          <div>
            <label className="label-xs block mb-2 flex items-center gap-1.5">
              <RiUserStarLine size={12} />
              Current Headline
            </label>
            <input value={currentHeadline} onChange={e => setCurrentHeadline(e.target.value)}
              placeholder="Software Engineer at Acme Corp" className="input-base" />
          </div>
          <div>
            <label className="label-xs block mb-2 flex items-center gap-1.5">
              <RiRocketLine size={12} />
              Target Role
            </label>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
              placeholder="Senior AI/ML Engineer" className="input-base" />
          </div>
        </div>

        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
        )}

        {/* ✅ Disabled when empty OR loading */}
        <button 
          onClick={generate} 
          disabled={loading || isFormEmpty}
          className={`btn-primary gap-2 ${
            (loading || isFormEmpty)
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          {loading 
            ? <RiLoader4Line size={15} className="animate-spin" />
            : <RiSparklingLine size={15} />
          }
          {loading 
            ? 'Generating…' 
            : isFormEmpty 
              ? 'Fill a field to Continue' 
              : 'Generate Headlines'
          }
        </button>

        {/* ✅ Helper text */}
        {isFormEmpty && !loading && (
          <p className="text-t4 text-xs text-center -mt-2">
            Enter at least one field to enable this button
          </p>
        )}
      </div>

      {/* Right - results */}
      <div 
        className="flex flex-col gap-3 overflow-y-auto pr-2" 
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <RiLoader4Line size={22} className="text-em animate-spin" />
            <span className="text-t3 text-sm">Generating headlines…</span>
          </div>
        )}

        {!loading && !headlineResult && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <RiSparklingLine className="text-em opacity-30" size={48} />
            <p className="text-t2 text-sm font-medium">Headlines appear here</p>
            <p className="text-t4 text-xs">Click any result to copy it to clipboard.</p>
          </div>
        )}

        {!loading && headlineResult && headlines.length === 0 && (
          <div className="card px-5 py-4">
            <span className="label-xs block mb-3">AI Response</span>
            <pre className="text-t2 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-auto max-h-64">
              {typeof headlineResult === 'string' ? headlineResult : JSON.stringify(headlineResult, null, 2)}
            </pre>
          </div>
        )}

        {!loading && headlines.length > 0 && (
          <>
            <span className="label-xs">Suggested Headlines ({headlines.length})</span>
            {headlines.map((h, i) => {
              const text = typeof h === 'string' ? h : h.headline ?? h.text ?? JSON.stringify(h)
              return (
                <div key={i}
                  className="card px-5 py-4 cursor-pointer hover:border-em transition-colors group"
                  onClick={() => navigator.clipboard?.writeText(text)}>
                  <p className="text-t1 font-semibold text-sm leading-relaxed">{text}</p>
                  <span className="text-t4 text-[10px] mt-2 block group-hover:text-em transition-colors">
                    Click to copy
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

//    Main page                        
export default function LinkedIn() {
  const [mode, setMode] = useState('full')

  // ✅ All form state lives in parent (never gets destroyed)
  const currentHeadline = useStore((s) => s.linkedinHeadline)
  const setCurrentHeadline = useStore((s) => s.setLinkedinHeadline)
  const currentAbout = useStore((s) => s.linkedinAbout)
  const setCurrentAbout = useStore((s) => s.setLinkedinAbout)
  const currentSkills = useStore((s) => s.linkedinSkills)
  const setCurrentSkills = useStore((s) => s.setLinkedinSkills)
  const targetRole = useStore((s) => s.linkedinTargetRole)
  const setTargetRole = useStore((s) => s.setLinkedinTargetRole)
  const yearsExp = useStore((s) => s.linkedinYearsExp)
  const setYearsExp = useStore((s) => s.setLinkedinYearsExp)
  const industry = useStore((s) => s.linkedinIndustry)
  const setIndustry = useStore((s) => s.setLinkedinIndustry)
  const result = useStore((s) => s.linkedinResult)
  const setResult = useStore((s) => s.setLinkedinResult)
  const headlineResult = useStore((s) => s.linkedinHeadlineResult)
  const setHeadlineResult = useStore((s) => s.setLinkedinHeadlineResult)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  return (
    <div className="animate-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            <RiLinkedinBoxLine className="text-em" size={32} />
            LinkedIn Optimizer
          </h1>
          <p className="text-t3 text-sm mt-1.5">Refine your professional narrative with AI precision.</p>
        </div>
        <div className="flex bg-surface2 border border-border rounded-lg p-1 gap-1">
          <button onClick={() => setMode('full')}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'full' ? 'bg-em text-bg' : 'text-t3 hover:text-t1'}`}>
            Full Profile
          </button>
          <button onClick={() => setMode('headline')}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'headline' ? 'bg-surface3 text-t1 border border-border2' : 'text-t3 hover:text-t1'}`}>
            Headline Only
          </button>
        </div>
      </div>

      {mode === 'full' && (
        <FullProfileMode
          currentHeadline={currentHeadline} setCurrentHeadline={setCurrentHeadline}
          currentAbout={currentAbout} setCurrentAbout={setCurrentAbout}
          currentSkills={currentSkills} setCurrentSkills={setCurrentSkills}
          targetRole={targetRole} setTargetRole={setTargetRole}
          yearsExp={yearsExp} setYearsExp={setYearsExp}
          industry={industry} setIndustry={setIndustry}
          result={result} setResult={setResult}
          loading={loading} setLoading={setLoading}
          error={error} setError={setError}
        />
      )}

      {mode === 'headline' && (
        <HeadlineMode
          currentHeadline={currentHeadline} setCurrentHeadline={setCurrentHeadline}
          targetRole={targetRole} setTargetRole={setTargetRole}
          headlineResult={headlineResult} setHeadlineResult={setHeadlineResult}
          loading={loading} setLoading={setLoading}
          error={error} setError={setError}
        />
      )}
    </div>
  )
}