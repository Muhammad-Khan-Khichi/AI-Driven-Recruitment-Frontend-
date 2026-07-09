import client, { longRunningClient } from './client'

export const coverLetterApi = {
  // POST /api/cover-letter/generate
  generate: (payload) =>
    longRunningClient.post('/api/cover-letter/generate', payload),

  // GET /api/cover-letter/list
  list: () => client.get('/api/cover-letter/list'),

  // GET /api/cover-letter/{id}
  getOne: (id) => client.get(`/api/cover-letter/${id}`),


  update: async (id, finalText) => {
    // First try: query param (your original format)
    try {
      return await client.put(`/api/cover-letter/${id}`, null, { 
        params: { final_text: finalText } 
      })
    } catch (err) {
      console.warn('Update via query param failed, trying JSON body...', err)
      
      // Fallback: JSON body
      return await client.put(`/api/cover-letter/${id}`, { 
        final_text: finalText 
      })
    }
  },

  // DELETE /api/cover-letter/{id}
  remove: (id) => client.delete(`/api/cover-letter/${id}`),
}