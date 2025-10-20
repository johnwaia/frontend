<script setup>

import { useJourneyStore } from '../stores/journeys'
import PlaceAutocomplete from '../components/PlaceAutocomplete.vue'
import RouteDiagram from '../components/RouteDiagram.vue'
import '../assets/style.css'
const store = useJourneyStore()

function submit(e) {
  e?.preventDefault()
  store.search({ lastOfDay: false })
}


function parseDateSafe(val){
  if(!val) return null
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val
  if (typeof val === 'number') { const d = new Date(val); return Number.isNaN(d.getTime()) ? null : d }
  if (typeof val !== 'string') return null
  let s = val.trim()
  // Strip TZ region like [Europe/Paris]
  s = s.replace(/\[[^\]]+\]$/, '')

  // Navitia style: 20250120T081530
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/)
  if (m){
    const [_, Y, M, D, h, mi, se] = m
    const d = new Date(Number(Y), Number(M)-1, Number(D), Number(h), Number(mi), Number(se))
    return Number.isNaN(d.getTime()) ? null : d
  }
  // Try ISO or anything Date can parse
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatTime(val) {

  if (!val) return '—'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function formatDuration(val) {
  if (val == null) return '—'
  let secs = typeof val === 'number' ? val : Number(val)
  if (!Number.isFinite(secs)) return '—'
  const sign = secs < 0 ? '-' : ''
  secs = Math.abs(secs)
  const h = Math.floor(secs / 3600)
  const m = Math.round((secs % 3600) / 60)
  if (h > 0) return `${sign}${h}h${m.toString().padStart(2,'0')}`
  return `${sign}${m} min`
}
function journeyDurationSeconds(j) {
  // API may provide duration; else compute from dep/arr
  if (typeof j?.duration === 'number') return j.duration
  const { dep, arr } = journeyTimes(j)
  const sd = dep ? parseDateSafe(dep)?.getTime() ?? NaN : NaN
  const ed = arr ? parseDateSafe(arr)?.getTime() ?? NaN : NaN
  if (Number.isFinite(sd) && Number.isFinite(ed)) return Math.max(0, Math.floor((ed - sd)/1000))
  return null
}

function journeyTimes(j) {
  // essaie des champs directs puis retombe sur la première/dernière section
    const dep = j?.departureIso || j?.departureDateTime || j?.departure || j?.startAt || j?.sections?.[0]?.departure_date_time || j?.sections?.[0]?.departureIso
    const arr = j?.arrivalIso || j?.arrivalDateTime || j?.arrival || j?.endAt || j?.sections?.[j?.sections?.length-1]?.arrival_date_time || j?.sections?.[j?.sections?.length-1]?.arrivalIso
  return { dep, arr }
}
</script>

<template>
  <section class="container">
    <h2 class="text-xl font-semibold">Itinéraires</h2>

    <!-- Formulaire -->
    <form @submit="submit" class="grid gap-2 md:grid-cols-2 mt-2">
      <div>
        <label class="block mb-1">Départ</label>
        <PlaceAutocomplete v-model="store.fromQ" />
      </div>
      <div>
        <label class="block mb-1">Arrivée</label>
        <PlaceAutocomplete v-model="store.toQ" />
      </div>

      <div class="md:col-span-2 flex gap-2 mt-2">
        <button
          class="button"
          type="submit"
          :disabled="!store.fromQ?.trim() || !store.toQ?.trim()"
        >
          Chercher
        </button>

        <button
          class="button"
          type="button"
          :disabled="!store.fromQ?.trim() || !store.toQ?.trim()"
          @click="store.search({ lastOfDay: true })"
        >
          Dernier départ du jour
        </button>
      </div>
    </form>

    <!-- États -->
    <div v-if="store.loading" class="mt-4">Chargement…</div>
    <div v-else-if="store.error" class="mt-4 text-red-600">{{ store.error }}</div>

    <!-- Résultats : uniquement le schéma -->
    <div v-else class="mt-6 space-y-6">
      <div v-for="(j, i) in store.results" :key="i" class="card p-4">
        <div class="flex items-center justify-between mb-1">
  <h3 class="card-title">
    Départ : {{ j?.from?.name || '—' }} → Arrivée : {{ j?.to?.name || '—' }}
  </h3>
  <div class="text-muted nowrap">
    <span>{{ formatTime(journeyTimes(j).dep) }}</span>
    <span class="sep">→</span>
    <span>{{ formatTime(journeyTimes(j).arr) }}</span>
      <span class="badge" style="margin-left:.5rem">{{ formatDuration(journeyDurationSeconds(j)) }}</span>
  </div>
</div>
<RouteDiagram :sections="j.sections" />
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="inner">© 2025 — Transport Finder</div>
  </footer>

</template>


