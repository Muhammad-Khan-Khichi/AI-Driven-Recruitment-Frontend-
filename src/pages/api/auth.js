import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL

// ✅ Send the httpOnly cookie on every request automatically
axios.defaults.withCredentials = true

export const authApi = {
  // OAuth2PasswordRequestForm — MUST be form-encoded
  login: async (username, password) => {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    const { data } = await axios.post(`${BASE}/api/auth/login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },

  // JSON body
  signup: async ({ email, username, password, full_name, location }) => {
    const { data } = await axios.post(`${BASE}/api/auth/signup`, {
      email, username, password, full_name, location,
    })
    return data
  },

  // ✅ No headers needed — cookie is sent automatically
  me: async () => {
    const { data } = await axios.get(`${BASE}/api/auth/me`)
    return data
  },

  // ✅ No headers needed — cookie is sent automatically; backend clears the cookie
  logout: async () => {
    await axios.post(`${BASE}/api/auth/logout`)
  },
}