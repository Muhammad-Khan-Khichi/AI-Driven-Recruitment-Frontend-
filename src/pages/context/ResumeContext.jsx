import { createContext, useContext, useState } from 'react'

const ResumeContext = createContext(null)

export function ResumeProvider({ children }) {
  // null = unknown/not checked this session, object = real parsed result from the API
  const [resumeData, setResumeData] = useState(null)

  const hasResume = Boolean(resumeData)

  return (
    <ResumeContext.Provider value={{ resumeData, setResumeData, hasResume }}>
      {children}
    </ResumeContext.Provider>
  )
}

export const useResume = () => {
  const ctx = useContext(ResumeContext)
  if (!ctx) throw new Error('useResume must be inside ResumeProvider')
  return ctx
}
