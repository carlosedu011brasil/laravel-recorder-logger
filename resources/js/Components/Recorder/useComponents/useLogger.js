export default function useLogger() {
  const logData = {
    console: [],
    errors: [],
    fetches: [],
    navigation: []
  }

  const originalLog = console.log
  const originalError = console.error

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
    const originalFetch = window.fetch
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
    monitorNavigation()
  }

  function exportLog() {
    return JSON.stringify(logData)
  }

  return {
    initLogger,
    exportLog
  }
}
