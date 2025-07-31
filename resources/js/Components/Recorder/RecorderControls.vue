<template>
  <div class="recorder-overlay">
    <div class="recorder-modal">
      <p class="text-sm font-mono mb-2">{{ formatTimer(timer) }}</p>
      <button @click="$emit('toggle')" class="btn-secondary">Ocultar Controles</button>
      <button @click="$emit('pause')" class="btn-pause">Pausar</button>
      <button @click="$emit('stop')" class="btn-stop">Parar</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  timer: Number
})

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
</script>

<style scoped>
.recorder-overlay {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  background: white;
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 0.5rem;
}
</style>
