import client, { longRunningClient } from './client'

export const coverLetterApi = {
  // POST /cover-letter/generate
  // Returns { id, variants: [{tone, body}], job_title, company, saved_path, created_at }
  generate: (payload) =>
    longRunningClient.post('/cover-letter/generate', payload),

  // GET /cover-letter/list
  list: () => client.get('/cover-letter/list'),

  // GET /cover-letter/{id}
  getOne: (id) => client.get(`/cover-letter/${id}`),

  // PUT /cover-letter/{id}?final_text=...
  update: (id, finalText) =>
    client.put(`/cover-letter/${id}`, null, { params: { final_text: finalText } }),

  // DELETE /cover-letter/{id}
  remove: (id) => client.delete(`/cover-letter/${id}`),
}
