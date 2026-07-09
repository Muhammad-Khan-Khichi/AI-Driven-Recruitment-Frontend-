import client from './client'

export const semanticApi = {
  search: (query, topK = 10) =>
    client.get('/api/semantic/search', { params: { query, top_k: topK } }),

  index: (payload = {}) => client.post('/api/semantic/index', payload),

  stats: () => client.get('/api/semantic/stats'),
}