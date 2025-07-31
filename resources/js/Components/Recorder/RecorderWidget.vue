<template>
  <teleport to="body">
    <div v-if="recording" class="fixed bottom-4 right-4 z-[9999] bg-white shadow-xl rounded-md p-3 w-[300px] border">
      <p class="font-mono text-sm mb-2">⏱ {{ formatTimer(timer) }}</p>
      <button @click="pauseRecording" class="btn-pause mb-1 w-full">Pausar</button>
      <button @click="stopAndSend" class="btn-stop w-full">Parar e Enviar</button>
    </div>
  </teleport>
</template>

<script setup>
import { onMounted } from 'vue'
import useRecorder from './useComponents/useRecorder'
import useLogger from './useComponents/useLogger'

const desc = ref(window.__recorderInstance?.desc || '')
const { recording, timer, pauseRecording, stopRecording, videoPreviewUrl, resetRecorder } = useRecorder(desc)
const { initLogger, exportLog } = useLogger()

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function stopAndSend() {
  stopRecording()

  setTimeout(() => {
    const payload = {
      descricao: window.__recorderInstance?.desc || '',
      videoUrl: videoPreviewUrl.value,
      logs: JSON.parse(exportLog())
    }

    fetch('/save-logger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(() => console.log('[recorder] enviado'))
      .catch(console.error)

    resetRecorder()
  }, 500)
}

onMounted(() => {
  initLogger()
})
</script>
