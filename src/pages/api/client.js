import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL 

// Default client — fine for fast CRUD-style endpoints
export const client = axios.create({ baseURL: BASE, timeout: 90000 })

// Long-running client — for the job search agent endpoints, which run a real
// multi-step pipeline (resume parsing, multiple job-board calls per keyword,
// semantic search, then AI ranking via Mistral) and can legitimately take
// several minutes when searching multiple keyword combinations sequentially.
export const longRunningClient = axios.create({ baseURL: BASE, timeout: 600000 }) // 10 minutes

function attachAuth(cfg) {
  const token = localStorage.getItem('hire_ai_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
}

function handleResponse(res) {
  return res.data
}

function handleError(err) {
  if (err.response?.status === 401) {
    localStorage.removeItem('hire_ai_token')
    window.location.href = '/auth'
  }
  if (err.code === 'ECONNABORTED') {
    const timeoutErr = new Error('The AI search is taking longer than expected. It may still be running on the server — try checking History in a moment.')
    timeoutErr.status = null
    return Promise.reject(timeoutErr)
  }
  const message = err.response?.data?.detail || err.message || 'Request failed'
  // Reject with a real Error carrying .status, but keep it stringifiable so
  // existing `typeof err === 'string'` checks elsewhere still degrade gracefully.
  const apiErr = new Error(typeof message === 'string' ? message : JSON.stringify(message))
  apiErr.status = err.response?.status ?? null
  return Promise.reject(apiErr)
}

client.interceptors.request.use(attachAuth)
client.interceptors.response.use(handleResponse, handleError)

longRunningClient.interceptors.request.use(attachAuth)
longRunningClient.interceptors.response.use(handleResponse, handleError)

export default client
