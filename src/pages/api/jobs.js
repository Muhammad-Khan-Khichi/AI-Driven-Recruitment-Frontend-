import client, { longRunningClient } from './client'

export const jobsApi = {
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    // Resume parsing can also take a while (extraction + profile generation)
    return longRunningClient.post('/jobs/upload-resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Generic search — location only, no resume tie-in. Runs the job search agent broadly.
  // Real pipeline: fetch from job boards (Adzuna/Jooble/LinkedIn) → semantic search → AI ranking.
  // This regularly takes 1-5+ minutes depending on how many keyword combinations run.
  search: (location, generateCoverLetters = false) =>
    longRunningClient.post('/jobs/search', { location, generate_cover_letters: generateCoverLetters }),

  // Resume-driven search — extracts skills from a specific resume, builds keyword
  // combinations, scores each job against resume skills, sorts by match score,
  // filters by min_match_score. Runs the full pipeline per keyword combination
  // sequentially, so this can take several minutes — confirmed from backend logs
  // showing 5 sequential ~50s pipeline runs for a single search call.
  searchByResume: ({
    resumeId,
    location,
    maxResultsPerKeyword = 20,
    minMatchScore = 20,
    generateCoverLetters = false,
  }) => longRunningClient.post('/jobs/search-by-resume', {
    resume_id: resumeId,
    location,
    max_results_per_keyword: maxResultsPerKeyword,
    min_match_score: minMatchScore,
    generate_cover_letters: generateCoverLetters,
  }),

  history: () => client.get('/jobs/history'),

  trackApplication: (payload) => client.post('/jobs/applications', payload),

  listApplications: (status) => client.get('/jobs/applications', { params: status ? { status } : {} }),

  updateApplication: (appId, { status, notes } = {}) =>
    client.patch(`/jobs/applications/${appId}`, null, { params: { status, notes } }),

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
  }) => client.post('/jobs/filter', {
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

  generateCoverLetter: (payload) => longRunningClient.post('/jobs/cover-letter', payload),
}
