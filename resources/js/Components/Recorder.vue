<template>
  <teleport to="body">
    <div class="recorder-wrapper fixed bottom-4 right-4 z-[9999]" v-bind="$attrs">
      <div v-if="!recording" class="pre-record">
        <video 
          v-if="videoPreviewUrl"
          :src="videoPreviewUrl"
          controls
          class="mt-4 rounded shadow w-full"
        ></video>

        <h2 class="text-lg font-semibold mb-2">Descreva o erro e clique em “Iniciar gravação”</h2>
        <textarea
          v-model="desc"
          placeholder="Explique o problema..."
          class="resize-none w-full p-3 border border-gray-300 rounded-md text-sm mb-4"
        />
        <button @click="startRecording" :class="['btn-start', themeClass]">Iniciar Gravação</button>
      </div>
      
      <div v-if="recording" class="rec-controls">
        <!-- Mostrar timer apenas se não estiver oculto -->
        <p v-if="!hideTimer" class="text-sm font-mono mb-2">{{ formatTimer(timer) }}</p>

        <button @click="toggleTimer" class="btn-secondary">
          {{ hideTimer ? 'Mostrar Timer' : 'Ocultar Timer' }}
        </button>

        <button @click="goBack" class="btn-secondary">Voltar</button>

        <button @click="pauseRecording" v-if="!paused" class="btn-pause">Pausar</button>
        <button @click="resumeRecording" v-if="paused" class="btn-resume">Continuar</button>
        <button @click="stopRecording" class="btn-stop">Parar</button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps } from 'vue'

const videoPreviewUrl = ref(null)

const hideTimer = ref(false);

function toggleTimer() {
  hideTimer.value = !hideTimer.value;
}

function goBack() {
  recording.value = false; // não reseta nada, só muda o estado visual
}

const logger = {
  StartpageUrl: '',
  visitedRoutes: [],
  logs: {
    console: [],
    errors: [],
    requests: [],
  }
}

function monitorRouteChanges() {
  let currentUrl = location.href
  console.log(`[logger] START: ${currentUrl}`)

  logger.visitedRoutes.push({
    timestamp: new Date().toISOString(),
    route: currentUrl
  })

  const logRouteChange = () => {
    const newUrl = location.href
    if (newUrl !== currentUrl) {
      console.log(`[logger] Foi de [${currentUrl}] para: [${newUrl}]`)
      currentUrl = newUrl
      logger.visitedRoutes.push({
        timestamp: new Date().toISOString(),
        route: newUrl
      })
    }
  }

  const hookHistoryMethod = (methodName) => {
    const original = history[methodName]
    history[methodName] = function (...args) {
      const result = original.apply(this, args)
      logRouteChange()
      return result
    }
  }

  hookHistoryMethod('pushState')
  hookHistoryMethod('replaceState')
  window.addEventListener('popstate', logRouteChange)
}

function initLogger() {
  console.log('[logger] Inicializando interceptações')
  monitorRouteChanges()

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;
    const method = options?.method || 'GET';
    const requestBody = options?.body || null;

    const startTime = new Date().toISOString();
    const response = await originalFetch(...args);
    const clonedResponse = response.clone(); // clone para poder ler o body

    let responseBody = '';
    try {
      responseBody = await clonedResponse.text();
    } catch(e) {
      responseBody = '[[logger] Erro ao ler o response]';
    }

    logger.logs.requests.push({
      type: 'fetch',
      method,
      url: url.toString(),
      requestBody,
      responseBody,
      status: response.status,
      time: startTime,
    });
    return response;
  };


  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = class extends originalXHR {
    constructor(){
      super();
      this._method = '';
      this._url    = '';
      this._body   = '';

      const originalOpen = this.open;
      this.open = function (method, url, ...rest) {
        this._method = method;
        this._url = url;
        return originalOpen.call(this, method, url, ...rest);
      };

      const originalSend = this.send;
      this.send = function (body) {
        this._body = body;

        this.addEventListener('loadend', function () {
          logger.logs.requests.push({
            type: 'xhr',
            method: this._method,
            url: this.responseURL || this._url,
            requestBody: this._body,
            responseBody:  this.responseText || '[[lgger] Sem conteúdo]',
            status: this.status,
            time: new Date.toISOString(), 
          });
        });
        return originalSend.call(this, body);
      };
    }
  };


  window.addEventListener('error', (e) => {
    logger.logs.errors.push({
      message: e.message,
      file: e.filename,
      line: e.lineno,
      col: e.colno,
      time: new Date().toISOString(),
    })
  })

  window.addEventListener('unhandledrejection', (e) => {
    logger.logs.errors.push({
      message: e.reason?.message || 'Unhandled rejection',
      time: new Date().toISOString(),
    })
  })

  const interceptConsole = (type) => {
    const original = console[type]
    console[type] = (...args) => {
      logger.logs.console.push({
        type,
        args,
        time: new Date().toISOString(),
      })
      original(...args)
    }
  }

  ['log', 'warn', 'error', 'info'].forEach(interceptConsole)
}

function exportLog() {
  logger.StartpageUrl = logger.visitedRoutes.at(-1)?.route || location.href
  return JSON.stringify(logger, null, 2)
}

// === COMPONENTE GRAVADOR ===

const props = defineProps({
  theme: {
    type: String,
    default: 'primary',
  }
})

const desc = ref('')
const recording = ref(false)
const paused = ref(false)
const timer = ref(0)
const finalizing = ref(false)
let interval = null
let mediaRecorder = null
let recordedChunks = []

const startRecording = async () => {
  initLogger();
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

const pauseRecording = () => {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.pause()
    paused.value = true
    clearInterval(interval)
  }
}

const resumeRecording = () => {
  if (mediaRecorder?.state === 'paused') {
    mediaRecorder.resume()
    paused.value = false
    interval = setInterval(() => timer.value++, 1000)
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    clearInterval(interval)
    mediaRecorder.stream.getTracks().forEach((track) => track.stop())
    finalizing.value = true
    videoPreviewUrl.value = null 
  }
}

const saveRecording = () => {
  const blob = new Blob(recordedChunks, { type: 'video/webm' })
  videoPreviewUrl.value = URL.createObjectURL(blob)
  const log = exportLog()
  
  const output = {
    descricao: desc.value,
    videoUrl: videoPreviewUrl.value,
    logs: JSON.parse(log)
  }

  console.log('Conteúdo gerado:', output)
  alert('Gravação finalizada. JSON gerado no console.')

  fetch('/save-logger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(output)
  })
  .then(res => console.log('[logger] Enviado com sucesso'))
  .catch(err => console.error('[logger] falha ao enviar', err))

  finalizing.value = false
  recording.value = false
  paused.value = false
  timer.value = 0
  desc.value = ''
  recordedChunks = []
  mediaRecorder = null
}

const formatTimer = (seconds) => {
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
  display: block;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
  }
}

.btn-secondary {
  background-color: #334155;
  color: #f1f5f9;

  &:hover {
    background-color: #475569;
  }
}

.rec-controls,
.pre-record {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  p {
    font-family: monospace;
    font-size: 1rem;
    color: #cbd5e1; 
  }

  button {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
    text-align: center;
  }

  .btn-start {
    background-color: #3b82f6; 
    color: #fff;

    &:hover {
      background-color: #2563eb; 
    }
  }

  .btn-pause {
    background-color: #facc15;
    color: #000;

    &:hover {
      background-color: #eab308;
    }
  }

  .btn-resume {
    background-color: #22c55e;
    color: #fff;

    &:hover {
      background-color: #16a34a;
    }
  }

  .btn-stop {
    background-color: #ef4444;
    color: #fff;

    &:hover {
      background-color: #dc2626;
    }
  }
}
</style>
<!-- // -->
<!-- v1.2.7 -->
