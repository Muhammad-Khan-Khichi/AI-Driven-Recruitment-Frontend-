import client, { longRunningClient } from './client'

export const resumeApi = {
  // Full optimization — AI rewrites the resume against a job description
  // Returns: { score, suggestions[], optimized_text, keyword_match, relevancy, ... }
  optimize: (payload) => longRunningClient.post('/api/resume/optimize', payload),

  // Quick score only — no rewrite, just scoring metrics
  quickScore: (payload) => client.post('/api/resume/quick-score', payload),
}