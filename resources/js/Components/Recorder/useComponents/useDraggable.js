import { reactive, onMounted, onBeforeUnmount } from 'vue'

export default function useDraggable() {
  const position = reactive({ x: 40, y: 40 })
  let dragging = false, offsetX = 0, offsetY = 0

  function startDrag(e) {
    dragging = true
    offsetX = e.clientX - position.x
    offsetY = e.clientY - position.y
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  function onDrag(e) {
    if (dragging) {
      position.x = e.clientX - offsetX
      position.y = e.clientY - offsetY
    }
  }

  function stopDrag() {
    dragging = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  onMounted(() => {
    document.addEventListener('mousedown', startDrag)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', startDrag)
  })

  return {
    position
  }
}
