import client from './client'

export const semanticApi = {
  search: (query, topK = 10) =>
    client.get('/semantic/search', { params: { query, top_k: topK } }),

  index: (payload = {}) => client.post('/semantic/index', payload),

  stats: () => client.get('/semantic/stats'),
}
