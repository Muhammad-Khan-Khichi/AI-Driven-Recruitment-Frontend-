import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  RiMicLine, RiLoader4Line,
  RiArrowDownSLine, RiCheckboxCircleLine, RiBookOpenLine,
  RiUser3Line, RiTerminalLine, RiTeamLine,
  RiLightbulbLine, RiChatQuoteLine,
  RiArrowRightLine, RiCheckLine,
  RiSparklingLine, RiFileTextLine,
  RiFileCopyLine,
} from 'react-icons/ri'
import { interviewApi } from './api/interview'
import { errMessage } from './utils/errors'

import { useStore } from '../store/useStore'

//    Shared: Tab bar          
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

//    Question type chips      
const Q_TYPES = [
  { key: 'Technical',   Icon: RiTerminalLine,  color: 'border-em text-em bg-[#052E1C]' },
  { key: 'Behavioral',  Icon: RiTeamLine,      color: 'border-em text-em bg-[#052E1C]' },
  { key: 'Situational', Icon: RiLightbulbLine, color: 'border-amber text-amber bg-[#2D1A00]' },
  { key: 'Culture fit', Icon: RiUser3Line,     color: 'border-cyan text-cyan bg-[#0C2233]' },
]

function TypeChip({ label, Icon, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold
        transition-all duration-150
        ${active ? color : 'border-border text-t3 bg-surface2 hover:border-border2 hover:text-t2'}
      `}
    >
      <Icon size={14} /> {label}
    </button>
  )
}

//    Custom dropdown          
function CustomDropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (!e.target.closest(`[data-dropdown="${label}"]`)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, label])

  const displayValue = value.charAt(0).toUpperCase() + value.slice(1)

  return (
    <div className="flex flex-col gap-1.5" data-dropdown={label}>
      <label className="label-xs">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="input-base flex items-center justify-between w-full text-left cursor-pointer hover:border-border2 transition-colors"
        >
          <span className="text-t1">{displayValue}</span>
          <RiArrowDownSLine
            size={16}
            className={`text-t3 transition-transform duration-200 ${open ? 'rotate-180 text-em' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-lg overflow-hidden animate-in">
            {options.map(o => {
              const optLabel = o.charAt(0).toUpperCase() + o.slice(1)
              const isActive = o === value
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => { onChange(o); setOpen(false) }}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm text-left
                    transition-colors duration-100
                    ${isActive
                      ? 'bg-em/10 text-em font-semibold'
                      : 'text-t2 hover:bg-surface2 hover:text-t1'}
                  `}
                >
                  <span>{optLabel}</span>
                  {isActive && <RiCheckLine size={15} className="text-em flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

//    Robust parsers          ─
function parseAIResponse(res) {
  let data = res
  if (typeof res === 'string') {
    let cleaned = res.trim()
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    try {
      data = JSON.parse(cleaned)
    } catch {
      return {}
    }
  }
  if (!data || typeof data !== 'object') return {}
  return data
}

// 🔑 NEW: Unwrap envelope wrappers like { data: {...} }
function unwrapEnvelope(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  const envelopeKeys = ['data', 'result', 'response', 'payload', 'body', 'output']
  for (const k of envelopeKeys) {
    if (data[k] && typeof data[k] === 'object' && !Array.isArray(data[k])) {
      console.log(`[unwrap] Unwrapping envelope key: "${k}"`)
      return { ...data, ...data[k] }
    }
  }
  return data
}

function extractQuestions(res) {
  let data = parseAIResponse(res)
  data = unwrapEnvelope(data)

  const candidates = [
    data?.questions,
    data?.items,
    data?.data,
    data?.results,
    data?.question_list,
    data?.generated_questions,
  ]
  if (Array.isArray(data)) candidates.push(data)
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c
  }
  return []
}

function extractPlan(res) {
  let data = parseAIResponse(res)
  data = unwrapEnvelope(data)

  let plan = null
  if (Array.isArray(data)) plan = data
  else plan = data?.plan || data?.weeks || data?.days || data?.items || data?.data || []
  if (Array.isArray(plan) && plan.length > 0) {
    plan = plan.map(item => {
      if (item.week && typeof item.week === 'object') return item.week
      if (item.day_obj && typeof item.day_obj === 'object') return item.day_obj
      return item
    })
  }
  const resources = data?.resources || data?.links || data?.recommended_resources || []
  return { plan: Array.isArray(plan) ? plan : [], resources }
}

//                            
// ✅ FIX: Bulletproof extractor — finds the answer no matter
// what shape or field name the backend uses
//                            
function extractEvaluation(res) {
  let data = parseAIResponse(res)
  if (!data || typeof data !== 'object') data = {}
  data = unwrapEnvelope(data)

  let improved = ''

  // 1) Direct known fields (extended list)
  const directCandidates = [
    'improved_answer', 'improvedAnswer',
    'better_answer', 'betterAnswer',
    'sample_answer', 'sampleAnswer',
    'suggested_answer', 'suggestedAnswer',
    'rewritten_answer', 'rewrittenAnswer',
    'enhanced_answer', 'enhancedAnswer',
    'model_answer', 'modelAnswer',
    'ideal_answer', 'idealAnswer',
    'example', 'example_answer', 'exampleAnswer',
    'recommended_answer', 'recommendedAnswer',
    'corrected_answer', 'correctedAnswer',
    'optimal_answer', 'optimalAnswer',
    'best_answer', 'bestAnswer',
    'improved', 'better', 'rewritten', 'enhanced',
    'answer_improved', 'answerImproved',
    'better_version', 'betterVersion',
    'sample', 'example_response', 'exampleResponse',
    'answer', 'ai_answer', 'aiAnswer',
    'model_response', 'modelResponse',
    'suggested', 'proposed_answer', 'final_answer', 'new_answer',
  ]
  for (const key of directCandidates) {
    const val = data?.[key]
    if (typeof val === 'string' && val.trim().length > 5) {
      improved = val
      console.log(`[extractEvaluation] Found in direct field: "${key}"`)
      break
    }
  }

  // 2) Name-pattern match — any field containing "answer"/"response"
  if (!improved) {
    console.log('[extractEvaluation] Trying name-pattern match…')
    const nameCandidates = []
    for (const [key, val] of Object.entries(data)) {
      const lk = key.toLowerCase()
      if (typeof val === 'string' && val.trim().length > 10 &&
          (lk.includes('answer') || lk.includes('response') ||
           lk.includes('rephras') || lk.includes('improv'))) {
        nameCandidates.push({ key, val, length: val.length })
      }
    }
    nameCandidates.sort((a, b) => b.length - a.length)
    if (nameCandidates.length > 0) {
      improved = nameCandidates[0].val
      console.log(`[extractEvaluation] Found via name match: "${nameCandidates[0].key}"`)
    }
  }

  // 3) Longest-string fallback (with skip-list)
  if (!improved) {
    console.log('[extractEvaluation] Trying longest-string fallback…')
    const allStrings = []
    const skipKeys = ['feedback', 'comment', 'analysis', 'review', 'notes',
                      'verdict', 'overall', 'rating', 'summary']
    for (const [key, val] of Object.entries(data)) {
      if (typeof val !== 'string') continue
      const lk = key.toLowerCase()
      if (skipKeys.some(s => lk.includes(s))) continue
      if (val.trim().length > 20) {
        allStrings.push({ key, val, length: val.length })
      }
    }
    allStrings.sort((a, b) => b.length - a.length)
    if (allStrings.length > 0) {
      improved = allStrings[0].val
      console.log(`[extractEvaluation] Found via longest: "${allStrings[0].key}"`)
    }
  }

  // 4) Check nested objects one level deeper
  if (!improved) {
    for (const [key, val] of Object.entries(data)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        for (const innerKey of Object.keys(val)) {
          const innerVal = val[innerKey]
          const lik = innerKey.toLowerCase()
          if (typeof innerVal === 'string' && innerVal.trim().length > 10 &&
              (lik.includes('answer') || lik.includes('response') || lik.includes('improv'))) {
            improved = innerVal
            console.log(`[extractEvaluation] Found nested: "${key}.${innerKey}"`)
            break
          }
        }
        if (improved) break
      }
    }
  }

  // 5) Warn if nothing found
  if (!improved && Object.keys(data).length > 0) {
    console.warn('[extractEvaluation] No improved answer field found. Keys:', Object.keys(data))
  }

  return {
    score:        data?.score ?? data?.rating ?? null,
    verdict:      data?.verdict ?? data?.overall ?? data?.rating_label ?? '',
    feedback:     data?.feedback ?? data?.comment ?? data?.analysis ?? data?.review ?? data?.notes ?? '',
    strengths:    Array.isArray(data?.strengths) ? data.strengths
                 : (Array.isArray(data?.pros) ? data.pros : []),
    improvements: Array.isArray(data?.improvements) ? data.improvements
                 : (Array.isArray(data?.suggestions) ? data.suggestions
                 : (Array.isArray(data?.areas_to_improve) ? data.areas_to_improve : [])),
    improved,
  }
}

//    Question card            
function QuestionCard({ n, question }) {
  const text = (
    question?.question ??
    question?.text ??
    question?.prompt ??
    question?.content ??
    question?.title ??
    (typeof question === 'string' ? question : '')
  )

  const type = question?.type || question?.category || null
  const difficulty = question?.difficulty || question?.level || null
  const tips = question?.tips || question?.tip || question?.advice || null

  // ✅ Extended sample-answer detection
  const sampleAnswer =
    question?.sample_answer ??
    question?.example_answer ??
    question?.sample ??
    question?.answer ??
    question?.model_answer ??
    question?.suggested_answer ??
    question?.ideal_answer ??
    question?.better_answer ??
    (typeof question?.sample === 'object'
      ? (question.sample?.text ?? question.sample?.answer ?? question.sample?.content)
      : null) ??
    null

  return (
    <div className="card px-5 py-4 flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface3 border border-border flex items-center justify-center text-t2 text-xs font-bold font-mono">
          Q{n}
        </span>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-t1 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {text || '(no question text)'}
          </p>
          {(type || difficulty) && (
            <div className="flex flex-wrap gap-1.5">
              {type && (
                <span className="bg-em/10 border border-em/40 text-em text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md">
                  {type}
                </span>
              )}
              {difficulty && (
                <span className="bg-amber/10 border border-amber/40 text-amber text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md">
                  {difficulty}
                </span>
              )}
            </div>
          )}
          {tips && (
            <div className="flex items-start gap-2 text-t4 text-xs italic border-l-2 border-em/30 pl-2">
              <RiLightbulbLine size={12} className="text-em flex-shrink-0 mt-0.5" />
              <span className="whitespace-pre-wrap break-words">{tips}</span>
            </div>
          )}
          {sampleAnswer && (
            // ✅ Open by default so user sees it immediately
            <details open className="bg-surface2 border border-border rounded-lg px-3 py-2 mt-1">
              <summary className="label-xs flex items-center gap-1.5 cursor-pointer">
                <RiFileTextLine size={11} className="text-em" />
                Sample Answer
              </summary>
              <p className="text-t3 text-xs leading-relaxed mt-2 whitespace-pre-wrap break-words">
                {sampleAnswer}
              </p>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

//    Copy-to-clipboard button                                   
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={copy}
      className="text-t4 hover:text-em transition-colors flex items-center gap-1.5 text-xs font-medium"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <RiCheckLine size={13} className="text-em" />
          <span className="text-em">Copied!</span>
        </>
      ) : (
        <>
          <RiFileCopyLine size={13} />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

//    Generate Questions tab  ─
function GenerateTab({
  jobTitle, setJobTitle,
  jobDescription, setJobDesc,
  selectedTypes, setTypes,
  numQuestions, setNumQuestions,
  questions, setQuestions,
  incomingJobTitle,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [rawData, setRawData] = useState(null)  // ✅ debug viewer

  useEffect(() => {
    if (incomingJobTitle && !jobTitle) {
      setJobTitle(incomingJobTitle)
    }
  }, [incomingJobTitle])

  // ✅ FIX: Use current value directly instead of functional update
  const toggleType = (t) => setTypes(
    selectedTypes.includes(t)
      ? selectedTypes.filter(x => x !== t)
      : [...selectedTypes, t]
  )

  const generate = async () => {
    if (selectedTypes.length === 0) { setError('Select at least one question type.'); return }
    if (!jobTitle.trim()) { setError('Enter a job title.'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        job_title:       jobTitle.trim(),
        job_description: jobDescription.trim(),
        num_questions:   numQuestions,
        question_types:  selectedTypes,
      }
      const res = await interviewApi.generateQuestions(payload)

      // ✅ Save raw for debug
      const rawParsed = unwrapEnvelope(parseAIResponse(res))
      setRawData(rawParsed)
      console.log('[Generate] raw response keys:', Object.keys(rawParsed))
      if (Array.isArray(rawParsed?.questions) || Array.isArray(rawParsed?.items) || Array.isArray(rawParsed?.data)) {
        const arr = rawParsed.questions || rawParsed.items || rawParsed.data
        console.log('[Generate] first question keys:', Object.keys(arr[0] || {}))
      }

      const qs = extractQuestions(res)
      setQuestions(qs)
    } catch (e) {
      setError(errMessage(e, 'Could not generate questions. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card px-5 py-5">
        <h2 className="text-em font-bold text-base mb-5 flex items-center gap-2">
          <RiSparklingLine size={16} />
          Question Configuration
        </h2>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="label-xs">Job Title *</label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="input-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-xs">
              Job Description
              <span className="text-t4 ml-2 normal-case font-normal">(optional, improves accuracy)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDesc(e.target.value)}
              placeholder="Paste the job posting here for more accurate questions…"
              rows={4}
              className="input-base resize-y"
            />
          </div>

          <div>
            <span className="label-xs block mb-3">Question Types</span>
            <div className="flex flex-wrap gap-2">
              {Q_TYPES.map(({ key, Icon, color }) => (
                <TypeChip
                  key={key} label={key} Icon={Icon} color={color}
                  active={selectedTypes.includes(key)}
                  onClick={() => toggleType(key)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="label-xs">Number of Questions</span>
              <div className="flex items-center gap-3">
                {/* ✅ FIX: Use current value directly */}
                <button onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))} className="w-8 h-8 rounded-lg border border-border text-t2 hover:border-border2 hover:text-em transition-all">−</button>
                <span className="text-t1 font-bold w-6 text-center">{numQuestions}</span>
                <button onClick={() => setNumQuestions(Math.min(20, numQuestions + 1))} className="w-8 h-8 rounded-lg border border-border text-t2 hover:border-border2 hover:text-em transition-all">+</button>
              </div>
            </div>
            <button onClick={generate} disabled={loading} className="btn-primary !w-auto px-6 gap-2">
              {loading ? <RiLoader4Line size={15} className="animate-spin" /> : <RiSparklingLine size={15} />}
              Generate Questions
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <RiLoader4Line size={22} className="text-em animate-spin" />
          <span className="text-t3 text-sm">AI is generating questions…</span>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="label-xs flex items-center gap-2">
              <RiCheckLine size={14} className="text-em" />
              {questions.length} questions generated
              {jobTitle && <span className="text-t4">for {jobTitle}</span>}
            </span>
            <button onClick={() => setQuestions([])} className="text-t4 hover:text-red text-xs font-medium transition-colors">
              Clear
            </button>
          </div>
          {questions.map((q, i) => (
            <QuestionCard key={i} n={i + 1} question={q} />
          ))}

          {/* ✅ Debug viewer */}
          {rawData && (
            <details className="card px-5 py-4">
              <summary className="label-xs cursor-pointer text-t4 hover:text-t2">
                🔍 Debug: View all response fields
              </summary>
              <div className="mt-3">
                <p className="text-t4 text-xs mb-2">Fields in response:</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.keys(rawData).map(k => (
                    <span key={k} className="bg-surface2 border border-border text-t2 text-[10px] font-mono px-2 py-0.5 rounded">
                      {k}
                    </span>
                  ))}
                </div>
                <pre className="p-3 bg-bg rounded text-[10px] overflow-auto max-h-80 text-t2 whitespace-pre-wrap break-all">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}

      {!loading && questions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-surface3 border border-border flex items-center justify-center mb-2">
            <RiFileTextLine size={22} className="text-t4" />
          </div>
          <p className="text-t2 text-sm font-medium">Configure your questions above</p>
          <p className="text-t4 text-xs">Enter a job title, pick question types, and click Generate.</p>
        </div>
      )}
    </div>
  )
}

//    Evaluate Answer tab      
function EvaluateTab({
  question, setQuestion,
  answer, setAnswer,
  questionType, setType,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)
  const [rawData, setRawData] = useState(null)

  const evaluate = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Both question and answer are required.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const payload = {
        question:      question.trim(),
        answer:        answer.trim(),
        question_type: questionType,
      }
      const res = await interviewApi.evaluateAnswer(payload)

      const rawParsed = unwrapEnvelope(parseAIResponse(res))
      setRawData(rawParsed)
      console.log('[Interview] evaluate RAW parsed:', rawParsed)
      console.log('[Interview] evaluate field names:', Object.keys(rawParsed))

      const ev = extractEvaluation(res)
      console.log('[Interview] extracted improved answer length:', ev.improved?.length)
      console.log('[Interview] extracted improved answer preview:', ev.improved?.slice(0, 100))

      setResult(ev)
    } catch (e) {
      setError(errMessage(e, 'Evaluation failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const score        = result?.score ?? null
  const scoreColor   = score === null ? 'text-t4' : score >= 7 ? 'text-em' : score >= 5 ? 'text-amber' : 'text-red'
  const verdict      = result?.verdict ?? ''
  const feedback     = result?.feedback ?? ''
  const strengths    = result?.strengths ?? []
  const improvements = result?.improvements ?? []
  const improved     = result?.improved ?? ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left — Inputs */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <CustomDropdown
          label="Question Type"
          value={questionType}
          onChange={setType}
          options={['behavioral', 'technical', 'situational']}
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
          {loading ? <RiLoader4Line size={15} className="animate-spin" /> : <RiSparklingLine size={15} />}
          Evaluate Answer
        </button>
      </div>

      {/* Right — Results */}
      <div className="flex flex-col gap-4 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2">
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <div className="w-14 h-14 rounded-full bg-surface3 border border-border flex items-center justify-center mb-2">
              <RiChatQuoteLine size={22} className="text-t4" />
            </div>
            <p className="text-t2 text-sm font-medium">Paste a question and your answer</p>
            <p className="text-t4 text-xs">AI will score it 0-10 and give detailed feedback.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <RiLoader4Line size={22} className="text-em animate-spin" />
            <span className="text-t3 text-sm">Evaluating your answer…</span>
          </div>
        )}

        {result && !loading && (
          <>
            {/* Score card */}
            <div className="card px-5 py-5 flex items-center gap-5">
              <span className={`text-5xl font-extrabold ${scoreColor}`}>
                {score !== null ? score : '—'}
                <span className="text-2xl text-t4">/10</span>
              </span>
              <div>
                <div className="text-t1 font-bold">{verdict || 'AI Evaluation'}</div>
                <div className="text-t4 text-xs mt-1">
                  {score !== null && (score >= 7 ? 'Strong answer' : score >= 5 ? 'Decent answer' : 'Needs improvement')}
                </div>
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className="card px-5 py-4">
                <span className="label-xs block mb-3 flex items-center gap-2">
                  <RiChatQuoteLine size={12} className="text-em" />
                  Feedback
                </span>
                <p className="text-t2 text-sm leading-relaxed whitespace-pre-wrap break-words">{feedback}</p>
              </div>
            )}

            {/* Strengths + Improvements */}
            {(strengths.length > 0 || improvements.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {strengths.length > 0 && (
                  <div className="card px-5 py-4">
                    <span className="label-xs block mb-3 flex items-center gap-2 text-em">
                      <RiCheckLine size={12} />
                      Strengths
                    </span>
                    <ul className="flex flex-col gap-2">
                      {strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-t2 text-xs">
                          <RiCheckLine size={12} className="text-em flex-shrink-0 mt-0.5" />
                          {typeof s === 'string' ? s : JSON.stringify(s)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {improvements.length > 0 && (
                  <div className="card px-5 py-4">
                    <span className="label-xs block mb-3 flex items-center gap-2 text-amber">
                      <RiArrowRightLine size={12} />
                      Improvements
                    </span>
                    <ul className="flex flex-col gap-2">
                      {improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-t2 text-xs">
                          <RiArrowRightLine size={12} className="text-amber flex-shrink-0 mt-0.5" />
                          {typeof s === 'string' ? s : JSON.stringify(s)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ✅ Stronger Answer — show warning if missing */}
            {improved && improved.trim() ? (
              <div className="card px-5 py-4 border-em/30 bg-em/[0.03]">
                <div className="flex items-center justify-between mb-3">
                  <span className="label-xs flex items-center gap-2 text-em">
                    <RiSparklingLine size={12} />
                    Stronger Answer
                  </span>
                  <CopyButton text={improved} />
                </div>
                <p className="text-t2 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {improved}
                </p>
              </div>
            ) : (
              <div className="card px-5 py-4 border-amber/30 bg-amber/[0.03]">
                <span className="label-xs flex items-center gap-2 text-amber">
                  ⚠ Improved answer not found in response
                </span>
                <p className="text-t4 text-xs mt-2">
                  Check the debug panel below to see what fields the backend returned.
                </p>
              </div>
            )}

            {/* ✅ Debug viewer */}
            {rawData && (
              <details className="card px-5 py-4">
                <summary className="label-xs cursor-pointer text-t4 hover:text-t2">
                  🔍 Debug: View all response fields
                </summary>
                <div className="mt-3">
                  <p className="text-t4 text-xs mb-2">Fields in response:</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Object.keys(rawData).map(k => (
                      <span key={k} className="bg-surface2 border border-border text-t2 text-[10px] font-mono px-2 py-0.5 rounded">
                        {k}
                      </span>
                    ))}
                  </div>
                  <pre className="p-3 bg-bg rounded text-[10px] overflow-auto max-h-80 text-t2 whitespace-pre-wrap break-all">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  )
}

//    Study Plan tab          ─
function StudyPlanTab({
  studyJobTitle, setStudyJobTitle,
  studyJobDesc, setStudyJobDesc,
  days, setDays,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [plan, setPlan]       = useState(null)
  const [rawResponse, setRawResponse] = useState(null)

  const generate = async () => {
    if (!studyJobTitle.trim()) { setError('Enter a target job title.'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        job_title:           studyJobTitle.trim(),
        job_description:     studyJobDesc.trim(),
        days_until_interview: days,
      }
      const res = await interviewApi.studyPlan(payload)
      setRawResponse(res)

      const { plan: weekItems, resources } = extractPlan(res)
      setPlan({ items: weekItems, resources })
    } catch (e) {
      setError(errMessage(e, 'Could not generate study plan.'))
    } finally {
      setLoading(false)
    }
  }

  const weekItems = plan?.items || []
  const resources = plan?.resources || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-xs">Target Job Title *</label>
          <input
            value={studyJobTitle}
            onChange={e => setStudyJobTitle(e.target.value)}
            placeholder="e.g. Senior AI Engineer"
            className="input-base"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-xs">
            Job Description
            <span className="text-t4 ml-2 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={studyJobDesc}
            onChange={e => setStudyJobDesc(e.target.value)}
            placeholder="Paste the job posting for tailored topics…"
            rows={4}
            className="input-base resize-y"
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label-xs">Days Until Interview</label>
            <div className="flex items-center gap-3">
              {/* ✅ FIX: Use current value directly */}
              <button onClick={() => setDays(Math.max(1, days - 1))} className="w-8 h-8 rounded-lg border border-border text-t2 hover:border-border2 hover:text-em transition-all">−</button>
              <span className="text-t1 font-bold w-6 text-center">{days}</span>
              <button onClick={() => setDays(Math.min(90, days + 1))} className="w-8 h-8 rounded-lg border border-border text-t2 hover:border-border2 hover:text-em transition-all">+</button>
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary gap-2">
            {loading ? <RiLoader4Line size={15} className="animate-spin" /> : <RiBookOpenLine size={15} />}
            Generate Plan
          </button>
        </div>

        {error && (
          <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3">
            {error}
            {rawResponse && (
              <details className="mt-2 text-xs text-t4">
                <summary className="cursor-pointer">Show raw response</summary>
                <pre className="mt-2 p-2 bg-bg rounded text-[10px] overflow-auto max-h-40">
                  {typeof rawResponse === 'string' ? rawResponse.slice(0, 500) : JSON.stringify(rawResponse, null, 2).slice(0, 500)}
                </pre>
              </details>
            )}
          </div>
        )}
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
            <div className="w-14 h-14 rounded-full bg-surface3 border border-border flex items-center justify-center mb-2">
              <RiBookOpenLine size={22} className="text-t4" />
            </div>
            <p className="text-t2 text-sm font-medium">Fill in your details and generate a plan</p>
            <p className="text-t4 text-xs">AI creates a day-by-day roadmap tailored to your timeline.</p>
          </div>
        )}

        {!loading && plan && weekItems.length === 0 && (
          <div className="card px-5 py-5">
            <span className="label-xs block mb-3 text-amber">⚠ No plan items found in response</span>
            <p className="text-t3 text-sm mb-3">The backend returned data but we couldn't extract a plan structure.</p>
            <details className="text-xs">
              <summary className="cursor-pointer text-cyan">View raw response</summary>
              <pre className="mt-2 p-3 bg-bg rounded text-[10px] overflow-auto max-h-80 whitespace-pre-wrap break-all">
                {typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {!loading && weekItems.length > 0 && (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
            {weekItems.map((w, i) => {
              const dayNum   = w.day ?? w.week ?? w.day_number ?? (i + 1)
              const theme    = w.theme ?? w.title ?? w.topic ?? ''
              const topics   = w.topics ?? w.content ?? w.tasks ?? w.activities ?? w.subtopics ?? []
              const isWeek   = !w.day && (w.week !== undefined || w.day_number !== undefined)
              const topicsArr = Array.isArray(topics) ? topics : (typeof topics === 'string' ? [topics] : [])

              return (
                <div key={i} className="card px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`${isWeek ? 'bg-em text-bg' : 'bg-cyan text-bg'} text-[10px] font-bold px-2 py-0.5 rounded-md uppercase`}>
                      {isWeek ? `W${dayNum}` : `D${dayNum}`}
                    </span>
                    <span className="text-t1 font-semibold text-sm">{theme || `Day ${dayNum}`}</span>
                  </div>
                  {topicsArr.length > 0 ? (
                    <ul className="flex flex-col gap-1.5">
                      {topicsArr.map((t, j) => {
                        const topicText = typeof t === 'string' ? t : (t?.topic || t?.title || t?.name || JSON.stringify(t))
                        return (
                          <li key={j} className="flex items-start gap-2 text-t3 text-xs">
                            <RiCheckboxCircleLine size={13} className="text-em flex-shrink-0 mt-0.5" />
                            <span className="whitespace-pre-wrap break-words">{topicText}</span>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="text-t4 text-xs italic">No topics listed for this day.</p>
                  )}
                </div>
              )
            })}

            {resources.length > 0 && (
              <div className="card px-4 py-4">
                <span className="label-xs block mb-3 flex items-center gap-2">
                  <RiBookOpenLine size={12} className="text-cyan" />
                  Recommended Resources
                </span>
                <ul className="flex flex-col gap-1.5">
                  {resources.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-cyan text-xs">
                      <RiArrowRightLine size={12} className="flex-shrink-0 mt-0.5" />
                      {typeof r === 'string' ? r : r.title ?? r.url ?? r.name ?? JSON.stringify(r)}
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

//    Main page                
export default function Interview() {
  const location = useLocation()
  const state    = location.state || {}
  const [tab, setTab] = useState('Generate Questions')

  const genJobTitle = useStore((s) => s.interviewGenJobTitle)
  const setGenJobTitle = useStore((s) => s.setInterviewGenJobTitle)
  const genJobDesc = useStore((s) => s.interviewGenJobDesc)
  const setGenJobDesc = useStore((s) => s.setInterviewGenJobDesc)
  const genSelectedTypes = useStore((s) => s.interviewGenSelectedTypes)
  const setGenTypes = useStore((s) => s.setInterviewGenTypes)
  const genNumQuestions = useStore((s) => s.interviewGenNumQuestions)
  const setGenNumQuestions = useStore((s) => s.setInterviewGenNumQuestions)
  const genQuestions = useStore((s) => s.interviewGenQuestions)
  const setGenQuestions = useStore((s) => s.setInterviewGenQuestions)

  const evalQuestion = useStore((s) => s.interviewEvalQuestion)
  const setEvalQuestion = useStore((s) => s.setInterviewEvalQuestion)
  const evalAnswer = useStore((s) => s.interviewEvalAnswer)
  const setEvalAnswer = useStore((s) => s.setInterviewEvalAnswer)
  const evalQuestionType = useStore((s) => s.interviewEvalType)
  const setEvalType = useStore((s) => s.setInterviewEvalType)

  const studyJobTitle = useStore((s) => s.interviewStudyJobTitle)
  const setStudyJobTitle = useStore((s) => s.setInterviewStudyJobTitle)
  const studyJobDesc = useStore((s) => s.interviewStudyJobDesc)
  const setStudyJobDesc = useStore((s) => s.setInterviewStudyJobDesc)
  const studyDays = useStore((s) => s.interviewStudyDays)
  const setStudyDays = useStore((s) => s.setInterviewStudyDays)

  return (
    <div className="animate-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight flex items-center gap-3">
            <RiMicLine size={26} className="text-t3" />
            Interview Prep
          </h1>
          <p className="text-t3 text-sm mt-1.5">
            Master your next career move with AI-powered simulations and feedback.
          </p>
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'Generate Questions' && (
        <GenerateTab
          jobTitle={genJobTitle}
          setJobTitle={setGenJobTitle}
          jobDescription={genJobDesc}
          setJobDesc={setGenJobDesc}
          selectedTypes={genSelectedTypes}
          setTypes={setGenTypes}
          numQuestions={genNumQuestions}
          setNumQuestions={setGenNumQuestions}
          questions={genQuestions}
          setQuestions={setGenQuestions}
          incomingJobTitle={state.jobTitle}
        />
      )}
      {tab === 'Evaluate Answer' && (
        <EvaluateTab
          question={evalQuestion}
          setQuestion={setEvalQuestion}
          answer={evalAnswer}
          setAnswer={setEvalAnswer}
          questionType={evalQuestionType}
          setType={setEvalType}
        />
      )}
      {tab === 'Study Plan' && (
        <StudyPlanTab
          studyJobTitle={studyJobTitle}
          setStudyJobTitle={setStudyJobTitle}
          studyJobDesc={studyJobDesc}
          setStudyJobDesc={setStudyJobDesc}
          days={studyDays}
          setDays={setStudyDays}
        />
      )}
    </div>
  )
}