<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { searchPlaces } from '../services/transport' // ajuste ce chemin si besoin

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Saisir un arrêt, adresse...' },
  minChars:   { type: Number, default: 2 },
  debounceMs: { type: Number, default: 180 },
})

const emit = defineEmits(['update:modelValue','choose'])

const q = ref(props.modelValue || '')
watch(() => props.modelValue, v => { if(v !== q.value) q.value = v })

const open = ref(false)
const loading = ref(false)
const results = ref([])
let timer = null

function setValue(v){ emit('update:modelValue', v) }
function choose(item){
  setValue(item?.name || '')
  emit('choose', item)
  open.value = false
}

function onInput(){
  setValue(q.value)
  debouncedFetch()
}

function debouncedFetch(){
  clearTimeout(timer)
  if((q.value||'').trim().length < props.minChars){
    results.value = []; open.value = false; return
  }
  timer = setTimeout(fetchResults, props.debounceMs)
}

async function fetchResults(){
  loading.value = true
  try{
    const arr = await searchPlaces(q.value, { count: 12 })
    results.value = Array.isArray(arr) ? arr : []
    open.value = results.value.length > 0
  } finally { loading.value = false }
}

function onFocus(){ if(results.value.length>0) open.value = true }
function onBlur(){ setTimeout(()=> open.value=false, 120) } // laisse passer le clic

/* -------- helpers: grouping + disambiguation -------- */
function normalizeName(name){
  if(!name) return ''
  return String(name)
    .normalize('NFD').replace(/\p{Diacritic}+/gu,'')    // retire les accents
    .replace(/\s*\([^)]*\)\s*$/g,'')                // enlève (Paris) final
    .toLowerCase().trim()
}
const groups = computed(() => {
  const m = new Map()
  for(const it of results.value){
    const key = normalizeName(it?.name)
    if(!m.has(key)) m.set(key, { name: it?.name || '', items: [] })
    m.get(key).items.push(it)
  }
  // ordre : groupe avec type stop_area/stop_point devant, puis POI/adresse
  const scoreType = (t) => t==='stop_area'?3 : t==='stop_point'?2 : t==='address'?1 : 0
  return Array.from(m.values()).map(g => {
    g.items.sort((a,b) => scoreType(b?.type)-scoreType(a?.type))
    return g
  })
})

const PARIS = { lat: 48.8566, lon: 2.3522 }
function quadrant(lat, lon){
  if(!(Number.isFinite(lat) && Number.isFinite(lon))) return ''
  const vertical   = lat >= PARIS.lat ? 'Nord' : 'Sud'
  const horizontal = lon >= PARIS.lon ? 'Est'  : 'Ouest'
  return `${vertical}-${horizontal}`
}
function coordShort(lat, lon){
  if(!(Number.isFinite(lat) && Number.isFinite(lon))) return ''
  const r = (n)=> (Math.round(n*1000)/1000).toFixed(3)
  return `${r(lat)}, ${r(lon)}`
}
function typeLabel(t){
  if(t==='stop_area') return 'Pôle d’arrêt'
  if(t==='stop_point') return 'Arrêt'
  if(t==='address') return 'Adresse'
  if(t==='poi') return 'Point d’intérêt'
  return t || 'Lieu'
}
function idTail(id){
  if(!id) return ''
  const parts = String(id).split(':')
  return parts[parts.length-1]
}
</script>

<template>
  <div class="ac">
    <input
      class="input"
      :placeholder="placeholder"
      v-model="q"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      autocomplete="off"
    />
    <div class="ac-panel card fade-in" v-if="open">
      <div v-if="loading" class="ac-empty">Recherche…</div>
      <template v-else>
        <div v-for="(g, gi) in groups" :key="'g-'+gi" class="ac-group">
          <div class="ac-group-title">{{ g.name }}</div>
          <div
            v-for="(r, i) in g.items"
            :key="'g-'+gi+'-'+i"
            class="ac-item"
            tabindex="0"
            role="button"
            @mousedown.prevent="choose(r)"
            @keydown.enter.prevent="choose(r)"
          >
            <div class="ac-item-main">
              <span class="pill">{{ typeLabel(r.type) }}</span>
              <span class="id">#{{ idTail(r.id) }}</span>
            </div>
            <div class="ac-item-sub">
              <span>{{ quadrant(Number(r.lat), Number(r.lon)) }}</span>
              <span class="sep">•</span>
              <span>{{ coordShort(Number(r.lat), Number(r.lon)) }}</span>
            </div>
          </div>
        </div>
        <div v-if="groups.length===0" class="ac-empty">Aucun résultat</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ac{ position:relative; }
.ac-panel{
  position:absolute; inset-inline:0; top: calc(100% + 6px);
  z-index:30; padding:.5rem; border-radius: var(--radius);
  max-height: 60vh; overflow:auto;
}
.ac-group + .ac-group{ margin-top:.25rem; padding-top:.25rem; border-top:1px dashed var(--border); }
.ac-group-title{ font-weight:700; padding:.25rem .4rem; opacity:.9; }

.ac-item{
  display:flex; flex-direction:column;
  gap:.25rem; padding:.55rem .65rem; border-radius:10px; cursor:pointer;
  border:1px solid transparent;
}
.ac-item:hover, .ac-item:focus{
  background: rgba(99,102,241,.08);
  border-color: rgba(99,102,241,.25);
  outline:none;
}
.ac-item-main{ display:flex; align-items:center; gap:.5rem; font-weight:600; }
.pill{
  font-size:.75rem; font-weight:700; padding:.15rem .45rem; border-radius:999px;
  background: rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.25);
}
.id{ font-size:.85rem; opacity:.7; }
.ac-item-sub{ font-size:.85rem; opacity:.8; display:flex; align-items:center; gap:.35rem; }
.sep{ opacity:.6; }
.ac-empty{ padding:.7rem; text-align:center; color: var(--muted); }
</style>
