import { createApp } from 'vue'
import Recorder from '../Components/RecorderLogger/Recorder.vue'

export function mountRecorder() {
  const mountEl = document.createElement('div')
  mountEl.id = 'global-recorder'
  document.body.appendChild(mountEl)

  const app = createApp(Recorder)
  app.mount('#global-recorder')
}