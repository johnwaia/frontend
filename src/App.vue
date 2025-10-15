<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen p-6">
    <header class="max-w-4xl mx-auto mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Transport App</h1>
      <nav class="flex gap-4">
        <RouterLink to="/">Accueil</RouterLink>
        <RouterLink to="/about">À propos</RouterLink>
      </nav>
    </header>

    <!-- ICI s’affichent les vues -->
    <main class="max-w-4xl mx-auto">
      <RouterView />
    </main>
  </div>
</template>
