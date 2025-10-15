<script setup>
import { useJourneyStore } from '../stores/journeys'
import PlaceAutocomplete from '../components/PlaceAutocomplete.vue'

const store = useJourneyStore()

function submit(e) {
  e?.preventDefault()
  store.search({ lastOfDay: false })
}

/* ---------- Helpers d’affichage ---------- */
function parseDate(input) {
  if (input == null) return null
  if (typeof input === 'number') {
    const ms = input < 2_000_000_000 ? input * 1000 : input // epoch sec -> ms
    const d = new Date(ms)
    return isNaN(d) ? null : d
  }
  const n = Number(input)
  if (!Number.isNaN(n)) return parseDate(n)
  const d = new Date(input)
  return isNaN(d) ? null : d
}

const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })

const fmtTime = (x) => { const d = parseDate(x); return d ? timeFmt.format(d) : '—' }
const fmtDateLabel = (x) => { const d = parseDate(x); return d ? dateFmt.format(d) : '' }

function fmtDuration(totalSec) {
  if (!Number.isFinite(totalSec)) return '—'
  const m = Math.round(totalSec / 60)
  const h = Math.floor(m / 60)
  const mm = m % 60
  return h ? `${h} h ${mm} min` : `${mm} min`
}

const pluralize = (n, s, p=null) => `${n} ${n>1 ? (p ?? s+'s') : s}`

function modeIcon(mode='') {
  const m = (mode || '').toLowerCase()
  if (m.includes('walk') || m.includes('foot') || m === 'marche') return '🚶'
  if (m.includes('bus')) return '🚌'
  if (m.includes('metro') || m.includes('métro')) return '🚇'
  if (m.includes('rer') || m.includes('train')) return '🚆'
  if (m.includes('tram')) return '🚈'
  if (m.includes('bike') || m.includes('vélo')) return '🚲'
  if (m.includes('scooter')) return '🛴'
  if (m.includes('wait') || m.includes('attente')) return '⏳'
  return '➡️'
}

function normalizedLabel(s) {
  if (!s) return ''
  const mode = (s.mode || '').trim()
  const code = (s.lineCode || '').trim()
  let label = ''
  if (!mode) {
    const t = (s.type || '').toLowerCase()
    if (t.includes('walk') || t.includes('foot')) label = 'Marche'
    else if (t.includes('wait')) label = 'Attente'
  } else {
    label = code ? `${mode} ${code}` : mode
  }
  if (!label) label = 'Marche'
  return label
}

/** Fusionne les segments “vides” successifs (ex. Marche/Attente) et prépare les badges */
function prettySections(sections = []) {
  const items = []
  for (const s of sections) {
    const label = normalizedLabel(s)
    const icon = modeIcon(label)
    const color = s?.lineColor || null
    const textColor = s?.textColor || null
    const title =
      (s?.fromName && s?.toName) ? `${s.fromName} → ${s.toName}` :
      (s?.fromName || s?.toName || label)

    const last = items[items.length - 1]
    const isWalkOrWait = (l) => /marche|attente/i.test(l)

    // Fusionne si même libellé “neutre” et sans couleur de ligne
    if (last && last.label === label && isWalkOrWait(label) && !color && !last.color) {
      last.count = (last.count || 1) + 1
      continue
    }
    items.push({ label, icon, color, textColor, title })
  }
  return items
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

  <!-- Tableau des résultats -->
  <div v-else class="mt-6 overflow-x-auto">
    <table class="tbl min-w-full">
      <thead>
        <tr>
          <th>Départ</th>
          <th>Arrivée</th>
          <th>Date</th>
          <th>Durée</th>
          <th>Correspondances</th>
          <th>Parcours</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(j, i) in store.results" :key="i">
          <td class="nowrap">
            {{ fmtTime(j?.departureIso ?? j?.departureTs ?? j?.departure) }}
          </td>
          <td class="nowrap">
            {{ fmtTime(j?.arrivalIso ?? j?.arrivalTs ?? j?.arrival) }}
          </td>
          <td class="nowrap opacity-70">
            {{ fmtDateLabel(j?.departureIso ?? j?.departureTs ?? j?.departure) }}
          </td>
          <td class="nowrap">
            {{ fmtDuration(j?.durationSec) }}
          </td>
          <td class="nowrap">
            {{ pluralize(j?.nbTransfers ?? 0, 'correspondance') }}
          </td>
          <td>
            <div class="route">
              <template v-for="(b, idx) in prettySections(j?.sections || [])" :key="idx">
                <span
                  class="badge"
                  :style="b.color ? ('background:'+b.color+';color:'+(b.textColor||'#000')) : ''"
                  :title="b.title"
                >
                  <span aria-hidden="true" class="mr-1">{{ b.icon }}</span>{{ b.label }}
                </span>
                <span v-if="idx < prettySections(j?.sections || []).length - 1" class="sep" aria-hidden="true">→</span>
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  </section>
</template>

<style>
.tbl {
  margin-top: 5%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.tbl thead th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  text-align: left;
  font-weight: 600;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}
.tbl tbody td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
  font-size: 14px;
}
.tbl tbody tr:last-child td {
  border-bottom: 0;
}
.nowrap { white-space: nowrap; }

.route { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  line-height: 1;
  font-size: 12px;
}
.sep { opacity: .6; margin: 0 2px; }

/* Responsive: sur petits écrans, réduis un peu les paddings */
@media (max-width: 480px) {
  .tbl thead th, .tbl tbody td { padding: 10px 12px; }
  .badge { font-size: 11px; padding: 3px 8px; }
}

.container { padding: 1rem; }
.button { margin-right: 0.5%; padding: 0.6rem 1rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; }

</style>
