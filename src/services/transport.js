import http from '../lib/http'

// /api/places?q=...
export async function searchPlaces(q, { types = 'stop_area,stop_point,address,poi', count = 5 } = {}) {
  if (!q || q.trim().length < 2) return [] // garde côté front
  const { data } = await http.get('/places', { params: { q, types, count } })
  return data
}

// /api/journeys?from=...&to=...
export async function getJourneys({ from, to, count = 5, datetime, realtime = true }) {
  const { data } = await http.get('/journeys', { params: { from, to, count, datetime, realtime } })
  return data
}

// /api/resolve-journeys?fromQ=...&toQ=...
export async function resolveJourneys({ fromQ, toQ, count = 5, datetime, realtime = true }) {
  if (!fromQ?.trim() || !toQ?.trim()) {
    throw new Error('fromQ et toQ sont requis')
  }
  const { data } = await http.get('/resolve-journeys', { params: { fromQ, toQ, count, datetime, realtime } })
  return data
}

// /api/journeys/last-of-day?fromQ=...&toQ=...
export async function lastJourneysOfDay({ fromQ, toQ, count = 8, datetime, realtime = true }) {
  if (!fromQ?.trim() || !toQ?.trim()) {
    throw new Error('fromQ et toQ sont requis')
  }
  const { data } = await http.get('/journeys/last-of-day', { params: { fromQ, toQ, count, datetime, realtime } })
  return data
}
