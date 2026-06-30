import client from './client'

export const jobsApi = {
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/jobs/upload-resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  search: (location, generateCoverLetters = false) =>
    client.post('/jobs/search', { location, generate_cover_letters: generateCoverLetters }),

  history: () => client.get('/jobs/history'),

  trackApplication: (payload) => client.post('/jobs/applications', payload),

  listApplications: () => client.get('/jobs/applications'),

  updateApplication: (appId, status) =>
    client.patch(`/jobs/applications/${appId}`, null, { params: { status } }),

  filterJobs: (payload) => client.post('/jobs/filter', payload),

  generateCoverLetter: (payload) => client.post('/jobs/cover-letter', payload),
}
