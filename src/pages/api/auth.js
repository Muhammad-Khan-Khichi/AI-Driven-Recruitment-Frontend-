import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL 

const getToken = () => localStorage.getItem('hire_ai_token')
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` })

export const authApi = {
  // OAuth2PasswordRequestForm — MUST be form-encoded
  login: async (username, password) => {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    const { data } = await axios.post(`${BASE}/auth/login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },

  // JSON body
  signup: async ({ email, username, password, full_name, location }) => {
    const { data } = await axios.post(`${BASE}/auth/signup`, {
      email, username, password, full_name, location,
    })
    return data
  },

  me: async () => {
    const { data } = await axios.get(`${BASE}/auth/me`, { headers: authHeaders() })
    return data
  },

  logout: async () => {
    await axios.post(`${BASE}/auth/logout`, {}, { headers: authHeaders() })
  },
}
