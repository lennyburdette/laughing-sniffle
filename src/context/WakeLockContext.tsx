import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

interface WakeLockContextType {
  isSupported: boolean
  isActive: boolean
  request: () => Promise<void>
  release: () => Promise<void>
}

const WakeLockContext = createContext<WakeLockContextType | undefined>(undefined)

export function WakeLockProvider({ children }: { children: ReactNode }) {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)
  const [isSupported] = useState(() => 'wakeLock' in navigator)
  const [isActive, setIsActive] = useState(false)

  const request = useCallback(async () => {
    if (!isSupported) return

    try {
      const sentinel = await navigator.wakeLock.request('screen')
      setWakeLock(sentinel)
      setIsActive(true)

      sentinel.addEventListener('release', () => {
        setIsActive(false)
        setWakeLock(null)
      })
    } catch (err) {
      // Wake lock request failed, likely due to low battery or other system constraints
      console.warn('Wake lock request failed:', err)
    }
  }, [isSupported])

  const release = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release()
        setWakeLock(null)
        setIsActive(false)
      } catch (err) {
        console.warn('Wake lock release failed:', err)
      }
    }
  }, [wakeLock])

  // Re-request wake lock when document becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLock) {
        await request()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, wakeLock, request])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {})
      }
    }
  }, [wakeLock])

  return (
    <WakeLockContext.Provider value={{ isSupported, isActive, request, release }}>
      {children}
    </WakeLockContext.Provider>
  )
}

export function useWakeLock() {
  const context = useContext(WakeLockContext)
  if (context === undefined) {
    throw new Error('useWakeLock must be used within a WakeLockProvider')
  }
  return context
}
