import client, { longRunningClient } from './client'

export const coverLetterApi = {
  // POST /cover-letter/generate
  generate: (payload) =>
    longRunningClient.post('/cover-letter/generate', payload),

  // GET /cover-letter/list
  list: () => client.get('/cover-letter/list'),

  // GET /cover-letter/{id}
  getOne: (id) => client.get(`/cover-letter/${id}`),


  update: async (id, finalText) => {
    // First try: query param (your original format)
    try {
      return await client.put(`/cover-letter/${id}`, null, { 
        params: { final_text: finalText } 
      })
    } catch (err) {
      console.warn('Update via query param failed, trying JSON body...', err)
      
      // Fallback: JSON body
      return await client.put(`/cover-letter/${id}`, { 
        final_text: finalText 
      })
    }
  },

  // DELETE /cover-letter/{id}
  remove: (id) => client.delete(`/cover-letter/${id}`),
}