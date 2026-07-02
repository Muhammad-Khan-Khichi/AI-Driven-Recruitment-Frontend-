import { longRunningClient } from './client'

export const linkedinApi = {
  // Full profile optimization
  // Returns: { optimized_summary, score, tips[], insight }
  optimizeProfile: (payload) =>
    longRunningClient.post('/linkedin/optimize-profile', payload),

  // Headline-only optimization
  // Returns: { headlines[], score }
  optimizeHeadline: (payload) =>
    longRunningClient.post('/linkedin/optimize-headline', payload),
}
