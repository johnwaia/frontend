<script setup>
/**
 * JourneyMapGoogle.vue — Google Maps avec functional API (setOptions/importLibrary)
 * - Affiche 1..N itinéraires ; recommandé : une carte par itinéraire (:journeys="[j]")
 * - Utilise DirectionsService pour tracer du point A (première section) à B (dernière section)
 * - Supporte coords si disponibles (fromLat/fromLon/toLat/toLon), sinon géocodage par nom
 * - Style sombre par défaut (sans mapId)
 */

import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const props = defineProps({
  journeys: { type: Array, default: () => [] },
  height:   { type: [Number, String], default: 420 },
  mapOptions: {
    type: Object,
    default: () => ({
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true
    })
  },
  // TRANSIT recommandé ; WALKING fallback possible si TRANSIT échoue
  travelMode: { type: String, default: 'TRANSIT' }
})

/* ---------- Refs & state ---------- */
const mapEl = ref(null)
let map = null
let directionsService = null
let DirectionsRendererCtor = null
let GeocoderCtor = null
let geocoder = null
let renderers = []
let resizeObs = null
let visibleObs = null
let resizePumpTimer = null

/* ---------- Constantes & helpers ---------- */
const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// palette pour distinguer plusieurs journeys (si tu affiches >1 carte)
const PALETTE = ['#ff4c4c','#4c9aff','#33cc33','#ffcc00','#b366ff','#ff9933','#00e6e6','#ff66b2','#66ffcc','#dddddd']
const colorForJourney = i => PALETTE[i % PALETTE.length]

// style sombre simple si tu n’as pas de mapId
const darkStyle = [
  { elementType: 'geometry', stylers: [{color:'#1f1f1f'}] },
  { elementType: 'labels.icon', stylers: [{visibility:'off'}] },
  { elementType: 'labels.text.fill', stylers: [{color:'#a3a3a3'}] },
  { elementType: 'labels.text.stroke', stylers: [{color:'#1a1a1a'}] },
  { featureType: 'poi', stylers: [{visibility:'off'}] },
  { featureType: 'road', stylers: [{color:'#2a2a2a'}] },
  { featureType: 'transit.station', stylers: [{visibility:'simplified'}] },
  { featureType: 'water', stylers: [{color:'#0c0f14'}] }
]

// Pump resize pour éviter les cartes tronquées (grid/flex/cards)
function pumpResize() {
  if (!map) return
  if (resizePumpTimer) clearTimeout(resizePumpTimer)
  resizePumpTimer = setTimeout(() => {
    google.maps.event.trigger(map, 'resize')
  }, 80)
}

function toLatLng(obj) {
  if (!obj) return null
  if (typeof obj.lat === 'number' && typeof obj.lng === 'number') return obj
  if (typeof obj.lat === 'string' && typeof obj.lng === 'string') {
    const lat = Number(obj.lat), lng = Number(obj.lng)
    return (Number.isFinite(lat) && Number.isFinite(lng)) ? { lat, lng } : null
  }
  return null
}

function sectionEndpoints(sec) {
  // essaie coords, sinon noms
  const from =
    (sec && toLatLng({ lat: sec.fromLat, lng: sec.fromLon })) ||
    (sec && sec.from) || (sec && sec.fromName)
  const to =
    (sec && toLatLng({ lat: sec.toLat, lng: sec.toLon })) ||
    (sec && sec.to) || (sec && sec.toName)
  return { from, to }
}

function endpointsForJourney(journey) {
  if (!journey || !Array.isArray(journey.sections) || journey.sections.length === 0) return null
  const first = journey.sections[0]
  const last  = journey.sections[journey.sections.length - 1]

  const A = sectionEndpoints(first)?.from || first?.fromName || first?.from
  const B = sectionEndpoints(last)?.to   || last?.toName   || last?.to
  if (!A || !B) return null
  return { origin: A, destination: B }
}

async function geocodeOne(q) {
  if (!q) return null
  // Si déjà coords, retourne tel quel
  const ll = toLatLng(q)
  if (ll) return ll

  // Si string → geocoding
  if (typeof q === 'string') {
    try {
      const res = await geocoder.geocode({ address: q })
      const r = res?.results?.[0]
      return r?.geometry?.location ? {
        lat: r.geometry.location.lat(),
        lng: r.geometry.location.lng()
      } : null
    } catch (e) {
      // ZERO_RESULTS / REQUEST_DENIED / OVER_QUERY_LIMIT ...
      console.warn('[Geocoder] échec', q, e)
      return null
    }
  }

  // Si objet avec fromLat/fromLon etc.
  if (typeof q === 'object' && q !== null) {
    const ll2 =
      toLatLng({ lat: q.lat, lng: q.lon }) ||
      toLatLng({ lat: q.latitude, lng: q.longitude })
    if (ll2) return ll2
  }

  return null
}

// Trace un seul journey (origin/destination calculés depuis ses sections)
async function drawJourney(journey, idx = 0) {
  if (!map || !directionsService || !DirectionsRendererCtor) return

  const ep = endpointsForJourney(journey)
  if (!ep) {
    console.warn('[JourneyMap] endpoints introuvables pour journey', journey)
    return
  }

  // Prépare origin/destination en coords si possible
  const [originLL, destinationLL] = await Promise.all([ geocodeOne(ep.origin), geocodeOne(ep.destination) ])
  const origin = originLL || ep.origin
  const destination = destinationLL || ep.destination

  // 1ère tentative : TRANSIT (par défaut)
  const mainMode = (props.travelMode || 'TRANSIT').toUpperCase()
  let result = null

  try {
    result = await directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode[mainMode] || google.maps.TravelMode.TRANSIT,
      provideRouteAlternatives: false
    })
  } catch (e) {
    console.warn('[Directions] échec', mainMode, e)
  }

  // Fallback WALKING si nécessaire
  if (!result || result.status !== 'OK') {
    try {
      result = await directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: false
      })
    } catch (e) {
      console.warn('[Directions] fallback walking échec', e)
    }
  }

  if (!result || result.status !== 'OK') {
    console.warn('[Directions] aucun tracé', { origin, destination, status: result?.status })
    return
  }

  const color = colorForJourney(idx)
  const renderer = new DirectionsRendererCtor({
    map,
    preserveViewport: false,
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: color,
      strokeWeight: 5,
      strokeOpacity: 0.95
    }
  })
  renderer.setDirections(result)
  renderers.push(renderer)

  // Fit bounds sur ce trajet (sinon certaines cartes paraissent “coupées”)
  const route = result?.routes?.[0]
  if (route?.bounds) {
    map.fitBounds(route.bounds, { top: 60, bottom: 40, left: 40, right: 40 })
  }
}

async function drawAll() {
  // nettoie anciens tracés
  renderers.forEach(r => r.setMap(null))
  renderers = []

  const list = Array.isArray(props.journeys) ? props.journeys : []
  if (!list.length) {
    pumpResize()
    return
  }

  // Trace 1..N journeys (attention au quota Directions)
  // Idéal : une carte par journey -> :journeys="[journey]"
  for (let i = 0; i < list.length; i++) {
    await drawJourney(list[i], i)
  }
  pumpResize()
}

/* ---------- Lifecycle ---------- */
onMounted(async () => {
  await nextTick()
  if (!key) {
    console.error('❌ VITE_GOOGLE_MAPS_API_KEY manquante (fichier .env)')
    return
  }

  // Configure la clé & options globales
  setOptions({
    apiKey: key,
    version: 'weekly',
    language: 'fr',
    region: 'FR'
  })

  try {
    const { Map } = await importLibrary('maps')
    const { DirectionsService, DirectionsRenderer } = await importLibrary('routes')
    const { Geocoder } = await importLibrary('geocoding')

    DirectionsRendererCtor = DirectionsRenderer
    directionsService = new DirectionsService()
    GeocoderCtor = Geocoder
    geocoder = new GeocoderCtor()

    map = new Map(mapEl.value, {
      ...props.mapOptions,
      styles: props.mapOptions?.mapId ? undefined : darkStyle
    })

    map.addListener('tilesloaded', () => pumpResize())

    // Observers → évitent les vues tronquées dans des cards flex/grid
    if ('ResizeObserver' in window) {
      resizeObs = new ResizeObserver(() => pumpResize())
      resizeObs.observe(mapEl.value)
    }
    if ('IntersectionObserver' in window) {
      visibleObs = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) pumpResize()
      }, { threshold: 0.1 })
      visibleObs.observe(mapEl.value)
    }
    window.addEventListener('resize', pumpResize, { passive: true })
    if (document?.fonts?.ready) {
      document.fonts.ready.finally(() => pumpResize())
    }

    await drawAll()
    pumpResize()
  } catch (e) {
    console.error('❌ Échec chargement Google Maps (functional API)', e)
  }
})

onBeforeUnmount(() => {
  if (resizePumpTimer) clearTimeout(resizePumpTimer)
  renderers.forEach(r => r.setMap(null))
  renderers = []
  if (resizeObs) try { resizeObs.disconnect() } catch {}
  if (visibleObs) try { visibleObs.disconnect() } catch {}
  window.removeEventListener('resize', pumpResize)
  map = null
})

watch(() => props.journeys, () => { drawAll() }, { deep: true })
watch(() => props.height, () => pumpResize())
</script>

<template>
  <div
    class="gmap"
    :style="{ height: (typeof height === 'number' ? height + 'px' : height) }"
    ref="mapEl"
  />
</template>

<style scoped>
.gmap{
  width: 100%;
  min-width: 0;
  min-height: 0;
  /* Hauteur contrôlée par prop height */
  overflow: hidden;
  border-radius: 14px;
  box-shadow: 0 8px 26px rgba(0,0,0,.45);
  border: 1px solid rgba(255,255,255,.12);
}
</style>
