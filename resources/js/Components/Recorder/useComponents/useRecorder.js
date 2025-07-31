import { ref } from 'vue'

export default function useRecorder(descRef) {
  const recording = ref(false)
  const paused = ref(false)
  const timer = ref(0)
  const videoPreviewUrl = ref(null)
  const previewReady = ref(false)
  const showRecordingUI = ref(true)

  let mediaRecorder = null
  let chunks = []
  let interval = null

  function startRecording() {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(stream => {
      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = e => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        videoPreviewUrl.value = URL.createObjectURL(blob)
        previewReady.value = true
      }

      mediaRecorder.start()
      recording.value = true
      paused.value = false
      timer.value = 0
      chunks = []

      interval = setInterval(() => timer.value++, 1000)
    })
  }

  function pauseRecording() {
    if (!paused.value) {
      mediaRecorder.pause()
      clearInterval(interval)
      paused.value = true
    } else {
      mediaRecorder.resume()
      interval = setInterval(() => timer.value++, 1000)
      paused.value = false
    }
  }

  function stopRecording() {
    mediaRecorder.stop()
    recording.value = false
    clearInterval(interval)
  }

  function resetRecorder() {
    videoPreviewUrl.value = null
    previewReady.value = false
    recording.value = false
    paused.value = false
    showRecordingUI.value = true
    descRef.value = ''
  }

  function toggleControls() {
    showRecordingUI.value = !showRecordingUI.value
  }

  return {
    recording, paused, timer, previewReady, videoPreviewUrl,
    startRecording, stopRecording, pauseRecording, resetRecorder, toggleControls,
    showRecordingUI
  }
}
