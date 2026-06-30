import axios from 'axios'

const BASE = 'http://localhost:8000/api'

export const client = axios.create({ baseURL: BASE, timeout: 90000 })

// Attach JWT on every request
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('hire_ai_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// On 401 — clear token and redirect
client.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hire_ai_token')
      window.location.href = '/auth'
    }
    return Promise.reject(err.response?.data?.detail || err.message || 'Request failed')
  }
)

export default client
