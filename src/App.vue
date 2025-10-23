<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen p-6">
        <header class="site-header">
          <div class="inner">
             <img src="/src/assets/logo.png" alt="Logo Dernier Métro" class="logo" />
            <div class="brand">Dernier Métro</div>
            <nav class="nav">
            </nav>
          </div>
        </header>

    <!-- ICI s’affichent les vues -->
    <main class="max-w-4xl mx-auto">
      <RouterView />
    </main>
  </div>
</template>
<style scoped>

.logo {
  height: 50px; /* ajuste la taille */
  width: auto;
  border-radius: 30%;
}
</style>