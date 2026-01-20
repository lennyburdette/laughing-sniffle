import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

interface OfflineContextType {
  isOnline: boolean
  isOfflineReady: boolean
  needsRefresh: boolean
  updateServiceWorker: () => void
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isOfflineReady, setIsOfflineReady] = useState(false)
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if service worker is ready (app is cached for offline use)
      navigator.serviceWorker.ready.then((reg) => {
        setIsOfflineReady(true)
        setRegistration(reg)
      })

      // Listen for new service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control, reload to get new content
        window.location.reload()
      })
    }
  }, [])

  // Listen for the custom event from vite-plugin-pwa when update is available
  useEffect(() => {
    const handleSwUpdate = () => {
      setNeedsRefresh(true)
    }

    window.addEventListener('sw-update-available', handleSwUpdate)
    return () => {
      window.removeEventListener('sw-update-available', handleSwUpdate)
    }
  }, [])

  // Function to update service worker when user chooses to refresh
  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      // Tell the waiting service worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [registration])

  return (
    <OfflineContext.Provider value={{ isOnline, isOfflineReady, needsRefresh, updateServiceWorker }}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}
