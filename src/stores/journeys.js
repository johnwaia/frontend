import { defineStore } from 'pinia'
import { resolveJourneys, lastJourneysOfDay } from '../services/transport'

export const useJourneyStore = defineStore('journeys', {
  state: () => ({
    fromQ: '',
    toQ: '',
    results: [],
    loading: false,
    error: null,
  }),
  actions: {
    async search({ lastOfDay = false } = {}) {
        this.loading = true
        this.error = null
        try {
            const params = { fromQ: this.fromQ?.trim(), toQ: this.toQ?.trim(), count: 5, realtime: true }
            if (!params.fromQ || !params.toQ) throw new Error('Renseigne départ et arrivée.')
            this.results = lastOfDay
            ? await lastJourneysOfDay(params)
            : await resolveJourneys(params)
        } catch (e) {
            this.error = e?.response?.data || e.message || 'Erreur inconnue'
            this.results = []
        } finally {
            this.loading = false
        }
    },
  },
})
