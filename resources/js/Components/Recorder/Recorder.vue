<template>
  <teleport to="body">
    <RecorderControls
      v-if="recording && showRecordingUI"
      :timer="timer"
      @pause="pauseRecording"
      @stop="stopRecording"
      @toggle="toggleControls"
    />

    <button
      v-else-if="recording"
      @click="toggleControls"
      class="btn-secondary text-xs fixed bottom-4 right-4 z-[9999]"
    >
      Mostrar Controles
    </button>

    <div
      v-if="previewReady"
      class="recorder-controls movable rec-controls"
      :style="{ top: position.y + 'px', left: position.x + 'px' }"
    >
      <p class="text-sm font-mono mb-2">Visualização da gravação:</p>
      <video :src="videoPreviewUrl" controls />
      <button @click="sendRecording" class="btn-start">Enviar</button>
      <button @click="cancelRecording" class="btn-stop mt-2">Cancelar</button>
    </div>
  </teleport>

  <!-- FORMULÁRIO INICIAL -->
  <div v-if="!recording && !previewReady && showForm" class="recorder-wrapper">
    <h2 class="text-lg font-semibold mb-2">
      Descreva o erro e clique em “Iniciar gravação”
    </h2>
    <textarea
      v-model="desc"
      placeholder="Explique o problema..."
      class="resize-none w-full p-3 border border-gray-300 rounded-md text-sm mb-4"
    />
    <button @click="startRecording" class="btn-start">Iniciar Gravação</button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePage } from '@inertiajs/vue3'
import RecorderControls from './RecorderControls.vue'

import useRecorder from './useComponents/useRecorder.js'
import useLogger from './useComponents/useLogger.js'
import useDraggable from './useComponents/useDraggable.js'

const desc = ref('')
const page = usePage()
const showForm = computed(() => page.url === '/')

const {
  recording,
  paused,
  timer,
  previewReady,
  videoPreviewUrl,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  resetRecorder,
  toggleControls,
  showRecordingUI
} = useRecorder(desc)

const { initLogger, exportLog } = useLogger()
const { position } = useDraggable()

function sendRecording() {
  const output = {
    descricao: desc.value,
    videoUrl: videoPreviewUrl.value,
    logs: JSON.parse(exportLog())
  }
  fetch('/save-logger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(output)
  })
    .then(() => console.log('[logger] Enviado com sucesso'))
    .catch(err => console.error('[logger] Erro ao enviar', err))
  resetRecorder()
}

function cancelRecording() {
  console.log('[logger] Envio cancelado')
  resetRecorder()
}

onMounted(() => {
  if (window._recorderInstance?.active) {
    resumeRecording()
  }
})

onBeforeUnmount(() => {
  if (typeof clearInterval === 'function') clearInterval()
})
</script>

<style lang="scss">
.recorder-wrapper {
  padding: 2rem;
  max-width: 32rem;
  margin: 4rem auto;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  background-color: #1e293b;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: 'Inter', sans-serif;
}

h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #f1f5f9;
}

textarea {
  width: 100%;
  height: 120px;
  padding: 0.75rem 1rem;
  border: 1px solid #334155;
  border-radius: 8px;
  font-size: 1rem;
  font-family: monospace;
  background-color: #0f172a;
  color: #e2e8f0;
  resize: none;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
  }
}

.recorder-controls.movable {
  position: fixed;
  z-index: 9999;
  padding: 1rem;
  background-color: #1e293b;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  max-width: 20rem;
  color: #fff;
  cursor: move;
  user-select: none;
}

.recorder-controls.movable video {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  margin-bottom: 0.5rem;
}

.rec-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  p {
    font-family: monospace;
    font-size: 1rem;
    color: #cbd5e1;
  }
}

/* Nova tela flutuante de controle */
.recorder-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: flex;
  justify-content: center;
  align-items: center;
}

.recorder-modal {
  background-color: #1e293b;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: #fff;
  text-align: center;
}

/* Botões */
button.btn-start,
button.btn-pause,
button.btn-resume,
button.btn-stop,
button.btn-secondary {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: center;
}

button.btn-start {
  background-color: #3b82f6;
  color: #fff;

  &:hover {
    background-color: #2563eb;
  }
}

button.btn-pause {
  background-color: #facc15;
  color: #000;

  &:hover {
    background-color: #eab308;
  }
}

button.btn-resume {
  background-color: #22c55e;
  color: #fff;

  &:hover {
    background-color: #16a34a;
  }
}


button.btn-stop {
  background-color: #ef4444;
  color: #fff;

  &:hover {
    background-color: #dc2626;
  }
}

button.btn-secondary {
  background-color: #334155;
  color: #f1f5f9;

  &:hover {
    background-color: #475569;
  }
}
</style>

<!-- // -->
