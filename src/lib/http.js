import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

http.interceptors.response.use(
  r => r,
  err => {
    console.error('[API ERROR]', err?.response?.status, err?.message)
    // Laisser remonter l'erreur au composant/store
    throw err
  }
)

export default http
