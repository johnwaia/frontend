<script setup>
import { useJourneyStore } from '../stores/journeys'
import PlaceAutocomplete from '../components/PlaceAutocomplete.vue'
import RouteDiagram from '../components/RouteDiagram.vue'
import JourneyMapGoogle from '../components/JourneyMapGoogle.vue'
import '../assets/style.css'

const store = useJourneyStore()

function submit(e) {
  e?.preventDefault()
  store.search({ lastOfDay: false })
}

// Helpers horaires/durée (inchangés)
function parseDateSafe(val){
  if(!val) return null
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val
  if (typeof val === 'number') { const d = new Date(val); return Number.isNaN(d.getTime()) ? null : d }
  if (typeof val !== 'string') return null
  let s = val.trim()
  s = s.replace(/\[[^\]]+\]$/, '')
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/)
  if (m){
    const [_, Y, M, D, h, mi, se] = m
    const d = new Date(Number(Y), Number(M)-1, Number(D), Number(h), Number(mi), Number(se))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}
function formatTime(val){
  const d = parseDateSafe(val)
  if(!d) return '—'
  return d.toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'})
}
function formatDuration(sec){
  if (sec == null) return '—'
  let s = Number(sec); if(!Number.isFinite(s)) return '—'
  const h = Math.floor(s/3600), m = Math.round((s%3600)/60)
  return h>0 ? `${h}h${m.toString().padStart(2,'0')}` : `${m} min`
}
function journeyTimes(j){
  const dep = j?.departureIso || j?.departureDateTime || j?.departure || j?.startAt
           || j?.sections?.[0]?.departureIso || j?.sections?.[0]?.departure_date_time
  const arr = j?.arrivalIso   || j?.arrivalDateTime   || j?.arrival   || j?.endAt
           || j?.sections?.[j?.sections?.length-1]?.arrivalIso || j?.sections?.[j?.sections?.length-1]?.arrival_date_time
  return { dep, arr }
}
function journeyDurationSeconds(j){
  if (typeof j?.durationSec === 'number') return j.durationSec
  if (typeof j?.duration === 'number') return j.duration
  const { dep, arr } = journeyTimes(j)
  const sd = parseDateSafe(dep)?.getTime() ?? NaN
  const ed = parseDateSafe(arr)?.getTime() ?? NaN
  if (Number.isFinite(sd) && Number.isFinite(ed)) return Math.max(0, Math.floor((ed-sd)/1000))
  return null
}
</script>

<template>
  <section class="container hv-root">
    <h2 class="text-xl font-semibold">Itinéraires</h2>

    <!-- Formulaire -->
    <form @submit="submit" class="grid gap-2 md:grid-cols-2 mt-2 hv-form">
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
          Dernier Métro
        </button>
      </div>
    </form>

    <!-- États -->
    <div v-if="store.loading" class="mt-4">Chargement…</div>
    <div v-else-if="store.error" class="mt-4 text-red-600">{{ store.error }}</div>

    <!-- Résultats -->
    <div v-else class="mt-6 space-y-6 hv-results">
      <div v-for="(j, i) in store.results" :key="'journey_'+i" class="card p-4 hv-card">
        <h3 class="font-medium mb-2">
          Départ : {{ j?.from?.name || '—' }} → Arrivée : {{ j?.to?.name || '—' }}
        </h3>
        <div class="mb-2 nowrap">
          <strong>{{ formatTime(journeyTimes(j).dep) }}</strong>
          <span class="sep">→</span>
          <strong>{{ formatTime(journeyTimes(j).arr) }}</strong>
          <span class="badge badge--solid" style="margin-left:.5rem">
            {{ formatDuration(journeyDurationSeconds(j)) }}
          </span>
        </div>

        <!-- Schéma de parcours -->
        <RouteDiagram :sections="j.sections" class="mb-4" />

        <!-- Carte Google : 1 itinéraire par carte -->
        <JourneyMapGoogle
          :journeys="[j]"
          :height="420"
          :key="'map_'+i"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Anti “carte tronquée” en layout flex/grid */
.hv-root, .hv-results, .hv-card {
  min-width: 0;
  min-height: 0;
}
.hv-form {
  min-width: 0;
}
.nowrap { white-space: nowrap; }
.sep { margin: 0 .35rem; }
</style>
