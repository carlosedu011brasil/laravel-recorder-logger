<template>
  <teleport to="body">
    <!-- CONTROLES EM TELA FLUTUANTE -->
    <div v-if="recording && showRecordingUI" class="recorder-overlay">
      <div class="recorder-modal">
        <p class="text-sm font-mono mb-2">{{ formatTimer(timer) }}</p>
        <button @click="toggleControls" class="btn-secondary">Ocultar Controles</button>
        <button @click="pauseRecording" class="btn-pause">Pausar</button>
        <button @click="stopRecording" class="btn-stop">Parar</button>
      </div>
    </div>

    <!-- BOTÃO PARA REABRIR CONTROLES -->
    <div v-else-if="recording">
      <button @click="toggleControls" class="btn-secondary text-xs fixed bottom-4 right-4 z-[9999]">
        Mostrar Controles
      </button>
    </div>

    <!-- PREVIEW FLUTUANTE -->
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
    <h2 class="text-lg font-semibold mb-2">Descreva o erro e clique em “Iniciar gravação”</h2>
    <textarea
      v-model="desc"
      placeholder="Explique o problema..."
      class="resize-none w-full p-3 border border-gray-300 rounded-md text-sm mb-4"
    />
    <button @click="startRecording" class="btn-start">Iniciar Gravação</button>
  </div>
</template>

<script setup>
  import { ref, reactive, onBeforeUnmount, defineProps, computed } from 'vue'
  import { usePage } from '@inertiajs/vue3'

  // === Props & Page ===
  const props = defineProps({
    theme: { type: String, default: 'primary' }
  })
  const page = usePage()
  const showForm = computed(() => page.url === '/')

  // === Recorder State ===
  const desc = ref('')
  const recording = ref(false)
  const paused = ref(false)
  const timer = ref(0)
  const previewReady = ref(false)
  const finalizing = ref(false)
  const sendConfirmed = ref(false)
  const videoPreviewUrl = ref(null)
  const showRecordingUI = ref(true)

  // === Position State (Preview Movable) ===
  const position = reactive({ x: 40, y: 40 })

  // === Logger ===
  const logger = {
    StartpageUrl: '',
    visitedRoutes: [],
    logs: { console: [], errors: [], requests: [] }
  }

  function exportLog() {
    logger.StartpageUrl = logger.visitedRoutes.at(-1)?.route || location.href
    return JSON.stringify(logger, null, 2)
  }

  // === Init Logger ===
  function initLogger() {
    monitorRouteChanges()

    // Intercept fetch
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      const method = options?.method || 'GET'
      const requestBody = options?.body || null

      const startTime = new Date().toISOString()
      const response = await originalFetch(...args)
      const cloned = response.clone()

      let responseBody = ''
      try { responseBody = await cloned.text() } catch { responseBody = '[[logger] Erro ao ler o response]' }

      logger.logs.requests.push({ type: 'fetch', method, url: url.toString(), requestBody, responseBody, status: response.status, time: startTime })
      return response
    }

    // Intercept XHR
    const originalXHR = window.XMLHttpRequest
    window.XMLHttpRequest = class extends originalXHR {
      constructor() {
        super()
        this._method = ''; this._url = ''; this._body = ''

        const originalOpen = this.open
        this.open = function (method, url, ...rest) {
          this._method = method; this._url = url
          return originalOpen.call(this, method, url, ...rest)
        }

        const originalSend = this.send
        this.send = function (body) {
          this._body = body
          this.addEventListener('loadend', function () {
            logger.logs.requests.push({
              type: 'xhr', method: this._method, url: this.responseURL || this._url,
              requestBody: this._body, responseBody: this.responseText || '[[logger] Sem conteúdo]',
              status: this.status, time: new Date().toISOString()
            })
          })
          return originalSend.call(this, body)
        }
      }
    }

    // Errors
    window.addEventListener('error', e => logger.logs.errors.push({ message: e.message, file: e.filename, line: e.lineno, col: e.colno, time: new Date().toISOString() }))
    window.addEventListener('unhandledrejection', e => logger.logs.errors.push({ message: e.reason?.message || 'Unhandled rejection', time: new Date().toISOString() }))

    // Console logs
    ['log', 'warn', 'error', 'info'].forEach(type => {
      const original = console[type]
      console[type] = (...args) => {
        logger.logs.console.push({ type, args, time: new Date().toISOString() })
        original(...args)
      }
    })
  }

  function monitorRouteChanges() {
    let currentUrl = location.href
    logger.visitedRoutes.push({ timestamp: new Date().toISOString(), route: currentUrl })

    const logRouteChange = () => {
      const newUrl = location.href
      if (newUrl !== currentUrl) {
        currentUrl = newUrl
        logger.visitedRoutes.push({ timestamp: new Date().toISOString(), route: newUrl })
      }
    }

    ['pushState', 'replaceState'].forEach(method => {
      const original = history[method]
      history[method] = function (...args) {
        const result = original.apply(this, args)
        logRouteChange()
        return result
      }
    })
    window.addEventListener('popstate', logRouteChange)
  }

  // === Recorder ===
  let interval = null
  let mediaRecorder = null
  let recordedChunks = []

  function toggleControls() {
    showRecordingUI.value = !showRecordingUI.value
  }

  async function startRecording() {
    initLogger()

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    mediaRecorder = new MediaRecorder(stream)
    recordedChunks = []

    mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data)
    mediaRecorder.onstop = saveRecording

    mediaRecorder.start()
    recording.value = true
    paused.value = false
    timer.value = 0
    interval = setInterval(() => timer.value++, 1000)
  }

  function pauseRecording() {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.pause()
      paused.value = true
      clearInterval(interval)
    }
  }

  function resumeRecording() {
    if (mediaRecorder?.state === 'paused') {
      mediaRecorder.resume()
      paused.value = false
      interval = setInterval(() => timer.value++, 1000)
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      clearInterval(interval)
      finalizing.value = true
    }
  }

  function saveRecording() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' })
    videoPreviewUrl.value = URL.createObjectURL(blob)
    previewReady.value = true
    recording.value = false
    paused.value = false
  }

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

  function resetRecorder() {
    previewReady.value = false
    videoPreviewUrl.value = null
    finalizing.value = false
    recording.value = false
    paused.value = false
    timer.value = 0
    desc.value = ''
    recordedChunks = []
    mediaRecorder = null
  }

  function formatTimer(seconds) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0')
    const sec = (seconds % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  }

  onBeforeUnmount(() => {
    if (interval) clearInterval(interval)
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
<!-- v1.2.8.6 -->
