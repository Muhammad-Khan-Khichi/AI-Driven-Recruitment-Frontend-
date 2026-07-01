import axios from 'axios'

const BASE = 'http://localhost:8000/api'

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
  
    console.log('✅ Login response:', data)
  
  // Save token
    localStorage.setItem('hire_ai_token', data.access_token)
  
  // Check if saved
    const savedToken = localStorage.getItem('hire_ai_token')
    console.log('💾 Saved token:', savedToken)
    console.log('💾 Matches:', savedToken === data.access_token)
  
    return data
  },

me: async () => {
  const token = getToken()
  console.log('🔵 /me called with token:', token)
  console.log('🔵 Headers:', authHeaders())
  
  const { data } = await axios.get(`${BASE}/auth/me`, { 
    headers: authHeaders() 
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
