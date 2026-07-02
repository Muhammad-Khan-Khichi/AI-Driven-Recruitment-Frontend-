import { useEffect, useState } from 'react'
import {
  RiCheckLine, RiFlashlightLine,
  RiMagicLine, RiLineChartLine, RiMicLine, RiQuestionLine,
  RiNodeTree, RiContactsBookLine, RiSpeedUpLine, RiNotification3Line,
} from 'react-icons/ri'
import { useAuth } from './context/AuthContext'
import { useResume } from './context/ResumeContext'
import { jobsApi } from './api/jobs'
import FeatureCard from '../components/ui/FeatureCard'

const FEATURES = [
  {
    icon: RiMagicLine, iconBg: '#052E1C', iconColor: '#10B981',
    title: 'Resume Refinement',
    description: 'AI-driven optimization tailored for high-frequency ATS algorithms.',
    to: '/optimizer',
  },
  {
    icon: RiLineChartLine, iconBg: '#0C2233', iconColor: '#06B6D4',
    title: 'Market Insights',
    description: 'Real-time salary benchmarking and competitive landscape analysis.',
    to: '/job-search',
  },
  {
    icon: RiMicLine, iconBg: '#162019', iconColor: '#E2F5EC',
    title: 'Interview Simulator',
    description: 'Voice-enabled mock interviews with instant behavioral feedback.',
    to: '/interview',
  },
  {
    icon: RiQuestionLine, iconBg: '#2D0A0A', iconColor: '#EF4444',
    title: 'Skill Discovery',
    description: 'Identify and bridge qualifications gaps for target senior roles.',
    to: '/optimizer',
  },
  {
    icon: RiNodeTree, iconBg: '#052E1C', iconColor: '#10B981',
    title: 'Semantic Search',
    description: 'Find roles based on conceptual fit rather than just keywords.',
    to: '/semantic',
  },
  {
    icon: RiContactsBookLine, iconBg: '#0C2233', iconColor: '#06B6D4',
    title: 'Profile Sync',
    description: 'Automatically update LinkedIn experience and headline metrics.',
    to: '/linkedin',
  },
  {
    icon: RiSpeedUpLine, iconBg: '#162019', iconColor: '#E2F5EC',
    title: 'Success Matrix',
    description: 'Visualize conversion rates from application to first interview.',
    to: '/applications',
  },
  {
    icon: RiNotification3Line, iconBg: '#052E1C', iconColor: '#10B981',
    title: 'Response Tracker',
    description: 'Automatic follow-up reminders for stagnant applications.',
    to: '/applications',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { resumeData, hasResume } = useResume()
  const [appsCount, setAppsCount]     = useState(null)
  const [searchCount, setSearchCount] = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      jobsApi.listApplications().catch(() => []),
      jobsApi.history().catch(() => []),
    ]).then(([apps, history]) => {
      if (!mounted) return
      setAppsCount(Array.isArray(apps) ? apps.length : 0)
      setSearchCount(Array.isArray(history) ? history.length : 0)
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const firstName = (user?.full_name || user?.username || 'there').split(' ')[0]

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-[2rem] font-extrabold text-t1 tracking-tight flex items-center gap-2">
            Good to see you, {firstName} <span>👋</span>
          </h1>
          <p className="text-t3 text-sm mt-1.5">Your AI recruitment pipeline is optimized and ready.</p>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-em animate-pulse-slow" />
          <span className="text-t2 text-xs font-semibold tracking-wide">Neural Engine: Active</span>
        </div>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Active Applications */}
        <div className="card px-5 py-5 flex flex-col gap-2">
          <span className="label-xs">Active Applications</span>
          <span className="text-4xl font-extrabold text-em tracking-tight">
            {loading ? '—' : appsCount}
          </span>
          <span className="text-xs text-t3 flex items-center gap-1">
            <RiLineChartLine size={12} className="text-em" /> Tracked applications
          </span>
        </div>

        {/* Semantic Searches */}
        <div className="card px-5 py-5 flex flex-col gap-2">
          <span className="label-xs">Semantic Searches</span>
          <span className="text-4xl font-extrabold text-cyan tracking-tight">
            {loading ? '—' : searchCount}
          </span>
          <span className="text-xs text-t3 flex items-center gap-1">
            <RiFlashlightLine size={12} className="text-cyan" /> Total searches run
          </span>
        </div>

        {/* Resume Status — real, derived from ResumeContext */}
        <div className="card px-5 py-5 flex flex-col gap-2">
          <span className="label-xs">Resume Status</span>
          {hasResume ? (
            <>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="w-8 h-8 rounded-md bg-em flex items-center justify-center flex-shrink-0">
                  <RiCheckLine size={18} className="text-bg" />
                </span>
                <div>
                  <div className="text-em font-bold text-sm leading-tight">Uploaded</div>
                  {resumeData?.skills && (
                    <div className="text-t4 text-[11px] leading-tight">{resumeData.skills.length} skills found</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="w-8 h-8 rounded-md bg-surface2 border border-border flex items-center justify-center flex-shrink-0">
                <RiCheckLine size={18} className="text-t4" />
              </span>
              <div className="text-t4 font-medium text-sm">Not uploaded</div>
            </div>
          )}
        </div>

        {/* Account status */}
        <div className="card px-5 py-5 flex flex-col gap-2">
          <span className="label-xs">Account</span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <span className="text-2xl">👤</span>
            <span className="text-t1 font-semibold text-sm">
              {user?.is_active === false ? 'Inactive' : 'Active'}
            </span>
          </div>
          {user?.is_admin && (
            <span className="text-em text-[11px] font-bold uppercase tracking-wide">Admin access</span>
          )}
        </div>
      </div>

      {/* Pipeline Intelligence */}
      <div className="mb-4">
        <span className="label-xs tracking-[0.15em]">Pipeline Intelligence</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map(f => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </div>
  )
}
