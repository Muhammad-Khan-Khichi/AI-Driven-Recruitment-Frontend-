import client, { longRunningClient } from './client'

export const interviewApi = {
  // ── Generate role-specific interview questions ─────────────
  // Request schema (per your FastAPI endpoint):
  // {
  //   "job_title": string,
  //   "job_description": string,
  //   "num_questions": int,
  //   "question_types": [string]
  // }
  //
  // Response: { questions: [{ question, type, tip, tags[] }] }
  //           (may be returned as JSON string or object)
  generateQuestions: (payload) =>
    longRunningClient.post('/interview/questions', payload),

  // ── Evaluate a typed answer against a question ─────────────
  // Request schema:
  // {
  //   "question": string,
  //   "answer": string,
  //   "question_type": "behavioral" | "technical" | "situational"
  // }
  //
  // Response: { score: 0-10, verdict, feedback, strengths[], improvements[], improved_answer }
  evaluateAnswer: (payload) =>
    longRunningClient.post('/interview/evaluate', payload),

  // ── Generate a personalized study plan ─────────────────────
  // Request schema:
  // {
  //   "job_title": string,
  //   "job_description": string,
  //   "days_until_interview": int
  // }
  //
  // Response: { plan: [{ week/day, theme, topics[] }], resources[] }
  //           (may be returned as JSON string or object)
  studyPlan: (payload) =>
    longRunningClient.post('/interview/study-plan', payload),
}