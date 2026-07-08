import client from './client'

export const adminApi = {
  // GET /api/admin/stats
  // Response: { total_users, total_admins, total_resumes, total_searches, total_applications, users_today }
  getStats: () => client.get('/admin/stats'),

  // GET /api/admin/users?skip=&limit=
  // Response: [{ id, username, email, full_name, is_admin, is_active, created_at }]
  listUsers: (skip = 0, limit = 100) =>
    client.get('/admin/users', { params: { skip, limit } }),

  // GET /api/admin/users/{user_id}
  // Response: { id, username, email, full_name, is_admin, is_active, created_at }
  getUser: (userId) => client.get(`/admin/users/${userId}`),

  // DELETE /api/admin/users/{user_id}
  // Response: string (success message)
  deleteUser: (userId) => client.delete(`/admin/users/${userId}`),

  // POST /api/admin/users/{user_id}/make-admin
  // Response: string (success message)
  makeAdmin: (userId) => client.post(`/admin/users/${userId}/make-admin`),

  // POST /api/admin/users/{user_id}/deactivate
  // Response: string (success message)
  deactivateUser: (userId) => client.post(`/admin/users/${userId}/deactivate`),

  // POST /api/admin/users/{user_id}/activate
  // Response: string (success message)
  activateUser: (userId) => client.post(`/admin/users/${userId}/activate`),

  // GET /api/admin/resumes?skip=&limit=
  listResumes: (skip = 0, limit = 100) =>
    client.get('/admin/resumes', { params: { skip, limit } }),

  // GET /api/admin/searches?skip=&limit=
  listSearches: (skip = 0, limit = 100) =>
    client.get('/admin/searches', { params: { skip, limit } }),

  // GET /api/admin/applications?skip=&limit=
  listApplications: (skip = 0, limit = 100) =>
    client.get('/admin/applications', { params: { skip, limit } }),
}