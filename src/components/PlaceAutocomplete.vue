<!-- src/components/PlaceAutocomplete.vue -->
<script setup>
import { ref, watch } from 'vue'
import { searchPlaces } from '../services/transport'

// v-model : props + emit
const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const inputValue = ref(props.modelValue)
const suggestions = ref([])
const loading = ref(false)

// Sync parent -> input
watch(() => props.modelValue, (val) => {
  if (val !== inputValue.value) inputValue.value = val ?? ''
})

// Input change -> parent + suggestions
watch(inputValue, async (val) => {
  emit('update:modelValue', val)

  if (!val || val.trim().length < 2) {
    suggestions.value = []
    return
  }
  loading.value = true
  try {
    suggestions.value = await searchPlaces(val, { count: 6 })
  } catch {
    suggestions.value = []
  } finally {
    loading.value = false
  }
})

function pick(p) {
  inputValue.value = p.name       // propage aussi au parent via le watch ci-dessus
  suggestions.value = []
}
</script>

<template>
  <div class="relative">
    <input
      v-model="inputValue"
      class="button w-full"
      placeholder="Rechercher un lieu"
    />
    <div v-if="loading" class="text-sm opacity-70 mt-1">Recherche…</div>

    <ul
      v-if="suggestions.length"
      class="absolute z-10 bg-white border rounded-xl w-full mt-1 max-h-64 overflow-auto"
    >
      <li
        v-for="p in suggestions"
        :key="p.id"
        class="px-3 py-2 hover:bg-gray-50 cursor-pointer"
        @click="pick(p)"
      >
        {{ p.name }} <span class="opacity-60 text-xs">({{ p.type }})</span>
      </li>
    </ul>
  </div>
</template>
