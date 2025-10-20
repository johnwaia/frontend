<script setup>
import { computed } from 'vue'

/**
 * sections: Array<{
 *  mode?: string,
 *  lineCode?: string,
 *  lineColor?: string,   // ✅ couleur fournie par l'API (obligatoire pour couleurs de ligne)
 *  textColor?: string,   // ✅ couleur texte fournie par l'API (optionnelle)
 *  fromName?: string,
 *  toName?: string,
 *  type?: string         // "walk","wait", etc. (pour le style pointillé)
 * }>
 */
const props = defineProps({
  sections:    { type: Array,  default: () => [] },
  height:      { type: Number, default: 120 },
  nodeRadius:  { type: Number, default: 7 },
  strokeWidth: { type: Number, default: 6 },
})

/* ===== Géométrie ===== */
const VBW = 1000, VBH = 120
const trackY = 64
const segLabelTopY = 40
const segLabelBottomY = 84
const stopLabelTopY = 16
const stopLabelBottomY = 104

function xAt(i, totalStops) {
  if (totalStops <= 1) return 0
  return (i * VBW) / (totalStops - 1)
}

/* ===== Helpers ===== */
const stopsCount = computed(() => (props.sections?.length || 0) + 1)

function stopNameAt(i) {
  if (i === 0) return props.sections?.[0]?.fromName || 'Départ'
  if (i === stopsCount.value - 1) return props.sections?.[stopsCount.value - 2]?.toName || 'Arrivée'
  return props.sections?.[i - 1]?.toName || ''
}
const truncate = (s, n=14) => !s ? '' : (s.length > n ? s.slice(0, n-1)+'…' : s)

const norm = (s='') => (s||'').toLowerCase()
function isDashed(s={}) {
  const m = norm(s.mode), t = norm(s.type)
  return m.includes('marche') || t.includes('walk') || t.includes('foot') || m.includes('attente') || t.includes('wait')
}
function labelFor(s={}) {
  const m = (s.mode||'').trim()
  const c = (s.lineCode||'').trim()
  if (m) return c ? `${m} ${c}` : m
  // sinon, fallback lisible
  const t = norm(s.type)
  if (t.includes('walk') || t.includes('foot')) return 'Marche'
  if (t.includes('wait')) return 'Attente'
  return c || 'Marche'
}

/* ===== Couleurs =====
   -> On utilise UNIQUEMENT ce qui vient de l'API:
      - trait & libellé: section.lineColor
      - texte: section.textColor si dispo, sinon on choisit noir/blanc selon contraste
   -> Si l'API ne fournit rien: trait gris neutre / texte gris foncé (fallback visuel générique).
*/
const NEUTRAL_STROKE = '#CBD5E1'  // gris clair (pas une "couleur de ligne")
const NEUTRAL_TEXT   = '#111827'  // texte sombre lisible

function colorFromApi(s={}) {
  return s.lineColor || NEUTRAL_STROKE
}
function textColorFromApiOrContrast(s={}) {
  if (s.textColor) return s.textColor
  const bg = s.lineColor
  if (!bg) return NEUTRAL_TEXT
  const hex = bg.replace('#','')
  if (hex.length !== 6) return NEUTRAL_TEXT
  const r = parseInt(hex.slice(0,2),16)/255
  const g = parseInt(hex.slice(2,4),16)/255
  const b = parseInt(hex.slice(4,6),16)/255
  const a = [r,g,b].map(v => v<=0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4)
  const L = 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]
  return L > 0.53 ? '#111827' : '#ffffff'
}

/* ===== Anti-chevauchement horizontal des labels de modes ===== */
const labelCenters = computed(() => {
  const centers = []
  const nSeg = props.sections.length
  const minGap = 90 // écart mini entre centres de labels
  for (let i = 0; i < nSeg; i++) {
    const cx = (xAt(i, stopsCount.value) + xAt(i+1, stopsCount.value)) / 2
    centers.push({ x: cx })
  }
  for (let i = 1; i < centers.length; i++) {
    const dx = centers[i].x - centers[i-1].x
    if (dx < minGap) centers[i].x += (minGap - dx)
  }
  return centers
})


function parseDateSafe(val){
  if(!val) return null
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val
  if (typeof val === 'number') { const d = parseDateSafe(val) || new Date(NaN); return Number.isNaN(d.getTime()) ? null : d }
  if (typeof val !== 'string') return null
  let s = val.trim()
  // Strip TZ region like [Europe/Paris]
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

function fmtTime(val){

  if(!val) return '—'
  const d = parseDateSafe(val) || new Date(NaN)
  if(Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'})
}
function fmtDurSec(sec){
  if(sec == null) return '—'
  let s = Number(sec); if(!Number.isFinite(s)) return '—'
  const h = Math.floor(s/3600), m = Math.round((s%3600)/60)
  return h>0 ? `${h}h${m.toString().padStart(2,'0')}` : `${m} min`
}
</script>

<template>
  <div class="route-diagram">
    <svg :viewBox="`0 0 ${VBW} ${VBH}`" :height="height" width="100%">
      <!-- Axe discret -->
      <line :x1="0" :y1="trackY" :x2="VBW" :y2="trackY"
            stroke="#E5E7EB" stroke-width="2" stroke-linecap="round" />

      <template v-if="(props.sections?.length || 0) > 0">
        <!-- Segments (couleur depuis l'API) -->
        <template v-for="(s, idx) in props.sections" :key="'seg-'+idx">
          <line
            :x1="xAt(idx, stopsCount)" :y1="trackY"
            :x2="xAt(idx+1, stopsCount)" :y2="trackY"
            :stroke="colorFromApi(s)" :stroke-width="strokeWidth"
            stroke-linecap="round"
            :stroke-dasharray="isDashed(s) ? '8 8' : null"
          />
        </template>

        <!-- Labels des modes (même couleur que la ligne) -->
        <template v-for="(s, idx) in props.sections" :key="'lbl-'+idx">
            <text
                :x="labelCenters[idx].x"
                :y="idx % 2 === 0 ? segLabelTopY : segLabelBottomY"
                text-anchor="middle" dominant-baseline="middle"
                :fill="colorFromApi(s)"
                font-size="11" font-weight="800"
                style="paint-order: stroke; stroke: #fff; stroke-width: 3px;"
            >
                {{ labelFor(s) }}
                <tspan v-if="s.toName" font-weight="500"> → {{ s.toName }}</tspan>
            </text>
        </template>


        <!-- Points + labels d'arrêts (alternance haut/bas) -->
        <template v-for="i in stopsCount" :key="'node-'+i">
          <g>
            <circle
              :cx="xAt(i-1, stopsCount)" :cy="trackY"
              :r="nodeRadius" fill="#ffffff"
              stroke="#111111" stroke-width="2.5"
            />
            <text
              :x="xAt(i-1, stopsCount)"
              :y="(i-1)%2===0 ? stopLabelTopY : stopLabelBottomY"
              text-anchor="middle" dominant-baseline="middle"
              fill="#111827" font-size="11" font-weight="600"
            >
              <title>{{ stopNameAt(i-1) }}</title>
              {{ truncate(stopNameAt(i-1), 16) }}
            </text>
          </g>
        </template>
      </template>

      <template v-else>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#6b7280" font-size="12">
          Pas de sections à afficher
        </text>
      </template>
    
    </svg>

    <!-- Liste des passages -->
    <div class="section-timeline">
      <div v-for="(r, i) in rows" :key="'row-'+i" class="row">
        <div class="time">{{ fmtTime(r.dep) }}</div>
        <div class="dot" :style="{ borderColor: r.color, background: r.color }"></div>
        <div class="desc">
          <div class="main">
            <span class="mode" :style="{ background: r.color, color: r.textColor }">{{ r.mode || '—' }}</span>
            <span class="line" v-if="r.line">{{ r.line }}</span>
            <span class="arrow">→</span>
            <span class="stop">{{ r.from || '—' }}</span>
            <span class="sep">→</span>
            <span class="stop">{{ r.to || '—' }}</span>
          </div>
          <div class="sub">{{ fmtDurSec(r.dur) }} · arrivée {{ fmtTime(r.arr) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-diagram { width: 100%; overflow-x: hidden; }
.section-timeline { margin-top: .75rem; display:flex; flex-direction:column; gap:.5rem; }
.section-timeline .row{ display:grid; grid-template-columns: 60px 14px 1fr; gap:.6rem; align-items:center; }
.section-timeline .time{ font-variant-numeric: tabular-nums; font-size:.95rem; opacity:.9; }
.section-timeline .dot{
  width:10px; height:10px; border-radius:999px; border:2px solid #6b7280;
}
.section-timeline .desc .main{ display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; }
.section-timeline .desc .main .mode{
  font-size:.75rem; font-weight:700; padding:.15rem .45rem; border-radius:999px; display:inline-block;
}
.section-timeline .desc .main .line{ font-size:.85rem; opacity:.8; }
.section-timeline .desc .main .arrow, .section-timeline .sep{ opacity:.6; }
.section-timeline .desc .sub{ color:#6b7280; font-size:.85rem; margin-top:.1rem; }
</style>


<style scoped>
.route-diagram { width: 100%; overflow-x: hidden; }
</style>

const rows = computed(() => {
  const list = Array.isArray(props.sections) ? props.sections : []
  return list.map((s) => {
    const dep = s.departureIso || s.departure_date_time || s.fromTime || s.startAt || s.departure
    const arr = s.arrivalIso   || s.arrival_date_time   || s.toTime   || s.endAt   || s.arrival
    let dur = s.duration
    if (dur == null && dep && arr) {
      const sd = parseDateSafe(dep)?.getTime() ?? NaN, ed = parseDateSafe(arr)?.getTime() ?? NaN
      if (Number.isFinite(sd) && Number.isFinite(ed)) dur = Math.max(0, Math.floor((ed-sd)/1000))
    }
    return {
      dep, arr, dur,
      mode: s.mode || s.type,
      line: s.lineCode || s.code || s.line || '',
      color: s.lineColor || s.color || '#6b7280',
      textColor: s.textColor || '#ffffff',
      from: s.fromName || s.from || s.origin || '',
      to: s.toName || s.to || s.destination || ''
    }
  })
})
