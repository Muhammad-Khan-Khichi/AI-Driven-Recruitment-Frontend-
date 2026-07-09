import client, { longRunningClient } from './client'

export const jobsApi = {
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    // Resume parsing can also take a while (extraction + profile generation)
    return longRunningClient.post('/api/jobs/upload-resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Generic search — location only, no resume tie-in. Runs the job search agent broadly.
  // Real pipeline: fetch from job boards (Adzuna/Jooble/LinkedIn) → semantic search → AI ranking.
  // This regularly takes 1-5+ minutes depending on how many keyword combinations run.
  //  accepts timeFilter ("24h" | "7d" | "30d" | "any")
  search: (location, generateCoverLetters = false, timeFilter = 'any') =>
    longRunningClient.post('/api/jobs/search', {
      location,
      generate_cover_letters: generateCoverLetters,
      time_filter: timeFilter, 
    }),

  // Resume-driven search — extracts skills from a specific resume, builds keyword
  // combinations, scores each job against resume skills, sorts by match score,
  // filters by min_match_score. Runs the full pipeline per keyword combination
  // sequentially, so this can take several minutes.
  // accepts timeFilter
  searchByResume: ({
    resumeId,
    location,
    maxResultsPerKeyword = 20,
    minMatchScore = 20,
    generateCoverLetters = false,
    timeFilter = 'any',  
  }) => longRunningClient.post('/api/jobs/search-by-resume', {
    resume_id: resumeId,
    location,
    max_results_per_keyword: maxResultsPerKeyword,
    min_match_score: minMatchScore,
    generate_cover_letters: generateCoverLetters,
    time_filter: timeFilter, 
  }),

  history: () => client.get('/api/jobs/history'),

  trackApplication: (payload) => client.post('/api/jobs/applications', payload),

  listApplications: (status) => client.get('/api/jobs/applications', { params: status ? { status } : {} }),

  updateApplication: (appId, { status, notes } = {}) =>
    client.patch(`/api/jobs/applications/${appId}`, null, { params: { status, notes } }),

  // Real server-side filter contract — richer than location-only matching
  filterJobs: ({
    jobs,
    remoteOnly,
    minSalary,
    maxSalary,
    daysAgo,
    experienceLevel,
    companyBlacklist,
    keywordsRequired,
    keywordsExcluded,
  }) => client.post('/api/jobs/filter', {
    jobs,
    remote_only: remoteOnly,
    min_salary: minSalary,
    max_salary: maxSalary,
    days_ago: daysAgo,
    experience_level: experienceLevel,
    company_blacklist: companyBlacklist,
    keywords_required: keywordsRequired,
    keywords_excluded: keywordsExcluded,
  }),

  generateCoverLetter: (payload) => longRunningClient.post('/api/jobs/cover-letter', payload),
}