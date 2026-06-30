import client from './client'

export const adminApi = {
  stats: () => client.get('/admin/stats'),
  listUsers: (skip = 0, limit = 100) => client.get('/admin/users', { params: { skip, limit } }),
  getUser: (id) => client.get(`/admin/users/${id}`),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  makeAdmin: (id) => client.post(`/admin/users/${id}/make-admin`),
  deactivate: (id) => client.post(`/admin/users/${id}/deactivate`),
  activate: (id) => client.post(`/admin/users/${id}/activate`),
  listResumes: (skip = 0, limit = 100) => client.get('/admin/resumes', { params: { skip, limit } }),
  listSearches: (skip = 0, limit = 100) => client.get('/admin/searches', { params: { skip, limit } }),
  listApplications: (skip = 0, limit = 100) => client.get('/admin/applications', { params: { skip, limit } }),
}
