import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  RiMicLine, RiPlayCircleLine, RiLoader4Line,
  RiArrowDownSLine, RiCheckboxCircleLine, RiBookOpenLine,
  RiUser3Line,
} from 'react-icons/ri'
import { interviewApi } from './api/interview'
import { errMessage } from './utils/errors'

// ── Shared: Tab bar ───────────────────────────────────────────
const TABS = ['Generate Questions', 'Evaluate Answer', 'Study Plan']

function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-border mb-7">
      {TABS.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`pb-3 pr-8 text-sm font-medium relative transition-colors ${active === t ? 'text-t1' : 'text-t3 hover:text-t2'}`}
        >
          {t}
          {active === t && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-em rounded-full" />}
        </button>
      ))}
    </div>
  )
}

// ── Shared: Readiness ring ────────────────────────────────────
function ReadinessRing({ score }) {
  const s    = Math.round(score ?? 0)
  const r    = 52
  const circ = 2 * Math.PI * r
  const off  = circ - (s / 100) * circ
  const color = s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1A2B20" strokeWidth="8" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold text-3xl text-t1">{s}%</span>
        <span className="text-t4 text-[11px] uppercase tracking-wide">Ready to hire</span>
      </div>
    </div>
  )
}

// ── Question type chip ────────────────────────────────────────
const Q_TYPES = [
  { key: 'Technical',   icon: '🖥', color: 'border-em text-em bg-[#052E1C]' },
  { key: 'Behavioral',  icon: '👥', color: 'border-em text-em bg-[#052E1C]' },
  { key: 'Situational', icon: '🎯', color: 'border-amber text-amber bg-[#2D1A00]' },
  { key: 'Culture fit', icon: '🤝', color: 'border-cyan text-cyan bg-[#0C2233]' },
]

function TypeChip({ label, icon, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold
        transition-all duration-150
        ${active ? color : 'border-border text-t3 bg-surface2 hover:border-border2 hover:text-t2'}
      `}
    >
      <span>{icon}</span> {label}
    </button>
  )
}

// ── Custom select ─────────────────────────────────────────────
function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label-xs">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input-base appearance-none pr-10 cursor-pointer"
        >
          {options.map(o => (
            <option key={o} value={o} className="bg-surface text-t1">{o}</option>
          ))}
        </select>
        <RiArrowDownSLine size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3 pointer-events-none" />
      </div>
    </div>
  )
}

// ── Question card ─────────────────────────────────────────────
function QuestionCard({ n, question }) {
  const text = typeof question === 'string' ? question : question.question ?? ''
  const tags = (typeof question === 'object' && (question.tags || question.type))
    ? [...(question.tags || []), ...(question.type && !question.tags ? [question.type] : [])]
    : []
  const tip = typeof question === 'object' ? question.tip : null

  return (
    <div className="card px-5 py-4 flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface3 border border-border flex items-center justify-center text-t2 text-xs font-bold font-mono">
          Q{n}
        </span>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-t1 text-sm leading-relaxed">{text}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <span key={i} className="bg-surface2 border border-border text-t3 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {tip && <p className="text-t4 text-xs italic border-l-2 border-em/30 pl-2">{tip}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Generate Questions tab ────────────────────────────────────
function GenerateTab({ incomingJobTitle, incomingCompany, onQuestionsGenerated }) {
  const [selectedTypes, setTypes]   = useState(['Technical', 'Behavioral'])
  const [roleType, setRoleType]     = useState(incomingJobTitle || 'Senior Software Engineer')
  const [difficulty, setDifficulty] = useState('Staff/Architect')
  const [count, setCount]           = useState(8)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [questions, setQuestions]   = useState([])
  const [readiness, setReadiness]   = useState(null)

  const toggleType = (t) => setTypes(prev =>
    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
  )

  const generate = async () => {
    if (selectedTypes.length === 0) { setError('Select at least one question type.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await interviewApi.generateQuestions({
        job_title:      roleType,
        company:        incomingCompany || '',
        question_types: selectedTypes,
        count,
        difficulty,
      })
      const qs = res?.questions || (Array.isArray(res) ? res : [])
      setQuestions(qs)
      // Readiness score may come from the response or not be present at all
      setReadiness(res?.readiness_score ?? res?.confidence ?? null)
      onQuestionsGenerated?.(qs)
    } catch (e) {
      setError(errMessage(e, 'Could not generate questions. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* Left */}
      <div className="flex flex-col gap-5">
        {/* Config card */}
        <div className="card px-5 py-5">
          <h2 className="text-em font-bold text-base mb-5">Question Configuration</h2>

          <div className="flex flex-col gap-5">
            <div>
              <span className="label-xs block mb-3">Question Types</span>
              <div className="flex flex-wrap gap-2">
                {Q_TYPES.map(({ key, icon, color }) => (
                  <TypeChip
                    key={key} label={key} icon={icon} color={color}
                    active={selectedTypes.includes(key)}
                    onClick={() => toggleType(key)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Role Type"
                value={roleType}
                onChange={setRoleType}
                options={[
                  'Junior Developer', 'Mid-level Engineer', 'Senior Software Engineer',
                  'Staff Engineer', 'Principal Engineer', 'Engineering Manager',
                  'Product Manager', 'Data Scientist', 'ML Engineer', 'DevOps Engineer',
                ]}
              />
              <Select
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                options={['Junior', 'Mid-level', 'Senior', 'Staff/Architect', 'Principal']}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="label-xs">Number of Questions</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCount(c => Math.max(1, c - 1))} className="w-8 h-8 rounded-lg border border-border text-t2 hover:border-border2 hover:text-em transition-all">−</button>
                  <span className="text-t1 font-bold w-6 text-center">{count}</span>
                  <button onClick={() => setCount(c => Math.min(20, c + 1))} className="w-8 h-8 rounded-lg border border-border text-t2 hover:border-border2 hover:text-em transition-all">+</button>
                </div>
              </div>
              <button
                onClick={generate}
                disabled={loading}
                className="btn-primary !w-auto px-6 gap-2"
              >
                {loading ? <RiLoader4Line size={15} className="animate-spin" /> : <RiMicLine size={15} />}
                Generate
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
        )}

        {/* Generated questions */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <RiLoader4Line size={22} className="text-em animate-spin" />
            <span className="text-t3 text-sm">AI is generating questions…</span>
          </div>
        )}

        {!loading && questions.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="label-xs">Generated Questions</span>
            {questions.map((q, i) => (
              <QuestionCard key={i} n={i + 1} question={q} />
            ))}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex flex-col gap-4">
        {/* Readiness score */}
        <div className="card px-5 py-6 flex flex-col gap-5">
          <span className="label-xs">Readiness Score</span>
          <ReadinessRing score={readiness ?? 75} />
          <div className="flex flex-col gap-3 mt-1">
            {[
              { label: 'Technical Proficiency', value: readiness ? Math.min(100, readiness + 10) : 80, text: 'High',     color: 'bg-em' },
              { label: 'Communication',          value: readiness ? Math.max(0, readiness - 15) : 60, text: 'Moderate', color: 'bg-amber' },
            ].map(({ label, value, text, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-t2">{label}</span>
                  <span className={`font-semibold ${color === 'bg-em' ? 'text-em' : 'text-amber'}`}>{text}</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Mock Interviewer */}
        <div className="card px-5 py-5 flex flex-col gap-4">
          <span className="label-xs">AI Mock Interviewer</span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface3 border border-border2 flex items-center justify-center text-t2 flex-shrink-0">
              <RiUser3Line size={20} />
            </div>
            <div>
              <div className="text-t1 font-bold">Aria-1</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-em" />
                <span className="text-em text-[11px] font-semibold uppercase tracking-wide">Online</span>
              </div>
            </div>
          </div>
          <button className="w-full bg-surface2 border border-border text-t2 font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl hover:border-border2 hover:text-t1 transition-all">
            Schedule Mock Call
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Evaluate Answer tab ───────────────────────────────────────
function EvaluateTab() {
  const [question, setQuestion]   = useState('')
  const [answer, setAnswer]       = useState('')
  const [jobTitle, setJobTitle]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)

  const evaluate = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Both question and answer are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await interviewApi.evaluateAnswer({
        question: question.trim(),
        answer:   answer.trim(),
        job_title: jobTitle.trim() || undefined,
      })
      setResult(res)
    } catch (e) {
      setError(errMessage(e, 'Evaluation failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const score    = result?.score ?? null
  const scoreColor = score === null ? 'text-t4' : score >= 7 ? 'text-em' : score >= 5 ? 'text-amber' : 'text-red'
  const verdict  = result?.verdict ?? ''
  const feedback = result?.feedback ?? ''
  const improved = result?.improved_answer ?? ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <input
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          placeholder="Job title context (optional)…"
          className="input-base"
        />
        <div className="flex flex-col gap-1.5">
          <label className="label-xs">Interview Question</label>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Paste the interview question here…"
            rows={4}
            className="input-base resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-xs">Your Answer</label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type or paste your answer…"
            rows={6}
            className="input-base resize-none"
          />
        </div>
        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
        )}
        <button onClick={evaluate} disabled={loading} className="btn-primary gap-2">
          {loading ? <RiLoader4Line size={15} className="animate-spin" /> : '⚡'}
          Evaluate Answer
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {result ? (
          <>
            <div className="card px-5 py-5 flex items-center gap-5">
              <span className={`text-5xl font-extrabold ${scoreColor}`}>{score}<span className="text-2xl text-t4">/10</span></span>
              <div>
                <div className="text-t1 font-bold">{verdict}</div>
                <div className="text-t4 text-xs mt-1">AI Evaluation Score</div>
              </div>
            </div>
            {feedback && (
              <div className="card px-5 py-4">
                <span className="label-xs block mb-3">Feedback</span>
                <p className="text-t2 text-sm leading-relaxed">{feedback}</p>
              </div>
            )}
            {improved && (
              <div className="card px-5 py-4">
                <span className="label-xs block mb-3">Stronger Answer</span>
                <p className="text-t3 text-sm leading-relaxed">{improved}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <span className="text-3xl mb-2">⚡</span>
            <p className="text-t2 text-sm font-medium">Paste a question and your answer</p>
            <p className="text-t4 text-xs">AI will score it 0-10 and give detailed feedback.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Study Plan tab ────────────────────────────────────────────
function StudyPlanTab() {
  const [role, setRole]         = useState('')
  const [level, setLevel]       = useState('Intermediate')
  const [weeks, setWeeks]       = useState(4)
  const [weakAreas, setWeakAreas] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [plan, setPlan]         = useState(null)

  const generate = async () => {
    if (!role.trim()) { setError('Enter a target role.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await interviewApi.studyPlan({
        target_role:    role.trim(),
        current_level:  level,
        weeks_available: weeks,
        weak_areas: weakAreas.split(',').map(s => s.trim()).filter(Boolean),
      })
      setPlan(res)
    } catch (e) {
      setError(errMessage(e, 'Could not generate study plan.'))
    } finally {
      setLoading(false)
    }
  }

  const weekItems = plan?.plan || (Array.isArray(plan) ? plan : null)
  const resources = plan?.resources || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <input
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="Target role, e.g. Senior AI Engineer…"
          className="input-base"
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Current Level" value={level} onChange={setLevel}
            options={['Beginner','Intermediate','Advanced','Expert']} />
          <div className="flex flex-col gap-1.5">
            <label className="label-xs">Weeks Available</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setWeeks(w => Math.max(1, w - 1))} className="w-8 h-8 rounded-lg border border-border text-t2 hover:border-border2 transition-all">−</button>
              <span className="text-t1 font-bold w-6 text-center">{weeks}</span>
              <button onClick={() => setWeeks(w => Math.min(24, w + 1))} className="w-8 h-8 rounded-lg border border-border text-t2 hover:border-border2 transition-all">+</button>
            </div>
          </div>
        </div>
        <input
          value={weakAreas}
          onChange={e => setWeakAreas(e.target.value)}
          placeholder="Weak areas (comma-separated, e.g. System Design, DSA)…"
          className="input-base"
        />
        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
        )}
        <button onClick={generate} disabled={loading} className="btn-primary gap-2">
          {loading ? <RiLoader4Line size={15} className="animate-spin" /> : <RiBookOpenLine size={15} />}
          Generate Study Plan
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <RiLoader4Line size={22} className="text-em animate-spin" />
            <span className="text-t3 text-sm">Building your plan…</span>
          </div>
        )}

        {!loading && !plan && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <span className="text-3xl mb-2">📚</span>
            <p className="text-t2 text-sm font-medium">Fill in your details and generate a plan</p>
            <p className="text-t4 text-xs">AI creates a week-by-week roadmap tailored to your role.</p>
          </div>
        )}

        {!loading && weekItems && (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px]">
            {weekItems.map((w, i) => {
              const week   = w.week ?? (i + 1)
              const theme  = w.theme ?? w.title ?? ''
              const topics = w.topics ?? w.content ?? []
              return (
                <div key={i} className="card px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-em text-bg text-[10px] font-bold px-2 py-0.5 rounded-md">W{week}</span>
                    <span className="text-t1 font-semibold text-sm">{theme}</span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {(Array.isArray(topics) ? topics : [topics]).map((t, j) => (
                      <li key={j} className="flex items-start gap-2 text-t3 text-xs">
                        <RiCheckboxCircleLine size={13} className="text-em flex-shrink-0 mt-0.5" />
                        {typeof t === 'string' ? t : JSON.stringify(t)}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
            {resources.length > 0 && (
              <div className="card px-4 py-4">
                <span className="label-xs block mb-3">Recommended Resources</span>
                <ul className="flex flex-col gap-1.5">
                  {resources.map((r, i) => (
                    <li key={i} className="text-cyan text-xs hover:underline cursor-pointer">
                      {typeof r === 'string' ? r : r.title ?? r.url ?? JSON.stringify(r)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Interview() {
  const location = useLocation()
  const state    = location.state || {}
  const [tab, setTab] = useState('Generate Questions')
  const [questions, setQuestions] = useState([])

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            🎤 Interview Prep
          </h1>
          <p className="text-t3 text-sm mt-1.5">
            Master your next career move with AI-powered simulations and feedback.
          </p>
        </div>
        <button className="btn-primary !w-auto px-6 gap-2">
          <RiPlayCircleLine size={16} /> Start Simulation
        </button>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'Generate Questions' && (
        <GenerateTab
          incomingJobTitle={state.jobTitle}
          incomingCompany={state.company}
          onQuestionsGenerated={setQuestions}
        />
      )}
      {tab === 'Evaluate Answer'    && <EvaluateTab />}
      {tab === 'Study Plan'         && <StudyPlanTab />}
    </div>
  )
}
