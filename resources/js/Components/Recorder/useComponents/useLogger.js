export default function useLogger() {
  const logData = window.__recorderLogs || {
    console: [],
    errors: [],
    fetches: [],
    xhr: [],
    navigation: [],
  }

  const originalLog = console.log
  const originalError = console.error
  const originalFetch = window.fetch

  function hijackConsole() {
    console.log = (...args) => {
      logData.console.push({ type: 'log', message: args, timestamp: new Date().toISOString() })
      originalLog(...args)
    }
    console.error = (...args) => {
      logData.errors.push({ type: 'error', message: args, timestamp: new Date().toISOString() })
      originalError(...args)
    }
  }

  function hijackFetch() {
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      logData.fetches.push({
        url: args[0],
        method: args[1]?.method || 'GET',
        timestamp: new Date().toISOString()
      })
      return response
    }
  }

  function hijackXHR() {
    const originalOpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (method, url) {
      this.addEventListener('loadend', function () {
        logData.xhr.push({
          url,
          method,
          status: this.status,
          timestamp: new Date().toISOString()
        })
      })
      return originalOpen.apply(this, arguments)
    }
  }

  function monitorNavigation() {
    const push = history.pushState
    history.pushState = function (...args) {
      logData.navigation.push({ type: 'push', args, timestamp: new Date().toISOString() })
      return push.apply(history, args)
    }
  }

  function initLogger() {
    hijackConsole()
    hijackFetch()
    hijackXHR()
    monitorNavigation()
    window.__recorderLogs = logData
  }

  function exportLog() {
    return JSON.stringify(window.__recorderLogs || logData)
  }

  return {
    initLogger,
    exportLog
  }
}
