import { longRunningClient } from './client'

export const linkedinApi = {
  // POST /api/linkedin/optimize-profile
  // Exact request schema from docs:
  // { current_headline, current_about, current_skills[], target_role, years_experience, industry }
  // Response schema is "string" — could be plain text, markdown, or JSON-in-string.
  // We parse defensively in the page component.
  optimizeProfile: ({ currentHeadline, currentAbout, currentSkills, targetRole, yearsExperience, industry }) =>
    longRunningClient.post('/api/linkedin/optimize-profile', {
      current_headline:  currentHeadline || undefined,
      current_about:     currentAbout    || undefined,
      current_skills:    Array.isArray(currentSkills) ? currentSkills : [],
      target_role:       targetRole      || undefined,
      years_experience:  yearsExperience  ? Number(yearsExperience) : undefined,
      industry:          industry         || undefined,
    }),

  // POST /api/linkedin/optimize-headline
  // Exact request schema from docs: { current_headline, target_role }
  // Response schema is "string"
  optimizeHeadline: ({ currentHeadline, targetRole }) =>
    longRunningClient.post('/api/linkedin/optimize-headline', {
      current_headline: currentHeadline || undefined,
      target_role:      targetRole      || undefined,
    }),
}