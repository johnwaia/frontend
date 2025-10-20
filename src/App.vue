<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen p-6">
        <header class="site-header">
          <div class="inner">
            <div class="brand">Transport Finder</div>
            <nav class="nav">
              <a href="/">Itinéraires</a>
              <a href="/about">À propos</a>
            </nav>
          </div>
        </header>

    <!-- ICI s’affichent les vues -->
    <main class="max-w-4xl mx-auto">
      <RouterView />
    </main>
  </div>
</template>
