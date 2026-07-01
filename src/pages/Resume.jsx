import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiFileTextLine, RiCheckboxCircleFill, RiMapPin2Line,
  RiArrowRightLine, RiAddLine,
} from 'react-icons/ri'
import { jobsApi } from './api/jobs'
import { errMessage } from './utils/errors'
import { useResume } from '../pages/context/ResumeContext'
import UploadZone from '../components/resume/UploadZone'
import SkillChip from '../components/resume/SkillChip'

export default function Resume() {
  const navigate = useNavigate()
  const { resumeData, setResumeData } = useResume()

  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [extraSkills, setExtraSkills] = useState([])
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkill, setNewSkill]       = useState('')

  const result = resumeData   // alias for readability below

  const handleUpload = async (file) => {
    setUploading(true)
    setError('')
    try {
      const data = await jobsApi.uploadResume(file)
      setResumeData({ ...data, filename: file.name })
      setExtraSkills([])
    } catch (err) {
      setError(errMessage(err, 'Could not parse resume. Please try again.'))
    } finally {
      setUploading(false)
    }
  }

  const addSkill = () => {
    const s = newSkill.trim()
    if (s) setExtraSkills(prev => [...prev, s])
    setNewSkill('')
    setAddingSkill(false)
  }

  const skills = [...(result?.skills || []), ...extraSkills]
  const roles  = result?.roles || []

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-7">
        <span className="w-10 h-10 rounded-lg bg-surface2 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
          <RiFileTextLine size={19} className="text-t1" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-t1 tracking-tight">Upload Resume</h1>
          <p className="text-t3 text-sm mt-1.5 max-w-2xl leading-relaxed">
            Our neural engine will parse your history, extract core competencies, and calibrate your
            match score against live industry demand.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-[#2D0A0A] border border-[#3D1212] text-red text-sm rounded-xl px-5 py-3.5 mb-6">
          {error}
        </div>
      )}

      {/* Success banner */}
      {result && (
        <div className="
          flex items-center justify-between gap-4 flex-wrap
          bg-[#052E1C] border border-em rounded-xl px-5 py-4 mb-6
        ">
          <div className="flex items-center gap-3">
            <RiCheckboxCircleFill size={22} className="text-em flex-shrink-0" />
            <div>
              <div className="text-em font-bold text-[15px]">Engine Synced Successfully</div>
              <div className="text-t2 text-xs mt-0.5">
                Resume "{result.filename}" parsed
                {result.parsed_chars ? ` — ${result.parsed_chars.toLocaleString()} characters extracted.` : '.'}
              </div>
            </div>
          </div>
          <button className="text-t2 text-xs font-bold tracking-widest uppercase hover:text-em transition-colors flex-shrink-0">
            View Analysis
          </button>
        </div>
      )}

      {/* Metric row — only renders fields the API actually returned */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {result.match_score !== undefined && (
            <div className="card px-5 py-5">
              <span className="label-xs">Match Score</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-em">
                  {Math.round(result.match_score)}<span className="text-base text-t4 font-semibold">/100</span>
                </span>
                <span className="w-10 h-10 rounded-full border-2 border-em flex items-center justify-center">
                  <span className="text-em text-sm">⚡</span>
                </span>
              </div>
            </div>
          )}

          <div className="card px-5 py-5">
            <span className="label-xs">Parsing Status</span>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="bg-em/15 text-em text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md border border-em/30">
                Complete
              </span>
              {result.parse_duration_seconds !== undefined && (
                <span className="text-t2 text-sm">{result.parse_duration_seconds}s Duration</span>
              )}
            </div>
            <div className="h-1 bg-border rounded-full mt-3 overflow-hidden">
              <div className="h-full w-full bg-em rounded-full" />
            </div>
          </div>

          <div className="card px-5 py-5">
            <span className="label-xs">Keywords Identified</span>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-t1">{skills.length}</span>
              <span className="text-t4 text-xs ml-1.5">Skills Found</span>
            </div>
            {result.roles?.length > 0 && (
              <span className="text-xs text-t3 flex items-center gap-1 mt-1.5">
                <RiArrowRightLine size={11} className="-rotate-45 text-em" /> {result.roles.length} role matches found
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main grid: upload + competencies | suggested roles */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="flex flex-col gap-6">
          {/* Upload zone */}
          <UploadZone onFileSelected={handleUpload} uploading={uploading} />

          {/* Extracted competencies */}
          {result && (
            <div className="card px-5 py-5">
              <span className="label-xs block mb-4">Extracted Technical Competencies</span>
              <div className="flex flex-wrap gap-2.5">
                {skills.map((s, i) => (
                  <SkillChip key={`${s}-${i}`}>{s}</SkillChip>
                ))}

                {addingSkill ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSkill()}
                      onBlur={addSkill}
                      placeholder="New skill"
                      className="bg-surface2 border border-border2 rounded-lg px-3 py-2 text-t1 text-xs w-28 outline-none focus:border-em"
                    />
                  </div>
                ) : (
                  <SkillChip variant="add" onClick={() => setAddingSkill(true)}>
                    <span className="flex items-center gap-1"><RiAddLine size={13} /> Add Skill</span>
                  </SkillChip>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column — suggested roles (only rendered if API returned roles) */}
        {result && roles.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="card px-5 py-5">
              <span className="label-xs flex items-center gap-1.5 mb-4">
                <RiMapPin2Line size={12} /> Suggested Roles
              </span>
              <div className="flex flex-col gap-4">
                {roles.map((role, i) => {
                  // `role` may be a plain string or a richer object depending on backend response
                  const title     = typeof role === 'string' ? role : role.title
                  const alignment = typeof role === 'object' ? role.alignment : undefined
                  const salary    = typeof role === 'object' ? role.salary_range : undefined
                  return (
                    <div key={`${title}-${i}`} className="flex gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-em mt-2 flex-shrink-0" />
                      <div>
                        <div className="text-t1 font-semibold text-sm">{title}</div>
                        {(alignment || salary) && (
                          <div className="text-t4 text-xs mt-0.5">
                            {alignment && `${alignment}% Alignment`} {salary && `• ${salary}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => navigate('/optimizer')}
              className="btn-primary"
            >
              Proceed to Optimizer <RiArrowRightLine size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
