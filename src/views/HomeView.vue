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
        <h3 class="font-medium mb-2">
          Départ : {{ j?.from?.name || '—' }} → Arrivée : {{ j?.to?.name || '—' }}
        </h3>
          <RouteDiagram :sections="j.sections" />
      </div>
    </div>
  </section>
</template>


