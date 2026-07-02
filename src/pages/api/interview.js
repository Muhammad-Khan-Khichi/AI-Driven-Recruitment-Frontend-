import client, { longRunningClient } from './client'

export const interviewApi = {
  // Generate role-specific interview questions
  // Returns: { questions: [{ question, type, tip, tags[] }] }
  generateQuestions: (payload) =>
    longRunningClient.post('/interview/questions', payload),

  // Evaluate a typed answer against a question
  // Returns: { score: 0-10, verdict, feedback, improved_answer }
  evaluateAnswer: (payload) =>
    longRunningClient.post('/interview/evaluate', payload),

  // Generate a personalized study plan
  // Returns: { plan: [{ week, theme, topics[] }], resources[] }
  studyPlan: (payload) =>
    longRunningClient.post('/interview/study-plan', payload),
}
