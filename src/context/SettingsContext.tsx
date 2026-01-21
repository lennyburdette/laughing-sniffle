import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

interface Settings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  restTimeBetweenActivities: number // in seconds, 0 = disabled
  timerBufferTime: number // seconds to add before timer starts (countdown)
  // Voice settings
  voiceCountingEnabled: boolean // Enable voice counting during exercises
  voiceCommandsEnabled: boolean // Enable voice commands (Chrome/Edge only)
  voiceCountingPace: number // Seconds between voice counts (1-5, default: 2)
  voiceVolume: number // Voice volume (0-1, default: 1.0)
  voiceRate: number // Voice speed (0.5-2, default: 1.0)
  voicePitch: number // Voice pitch (0.5-2, default: 1.0)
  autoStartVoiceCounting: boolean // Auto-start voice counting when activity begins
  activityPaces: Record<string, number> // Per-activity paces in seconds (activity.id -> pace)
}

interface SettingsContextType {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  resetSettings: () => void
  getActivityPace: (activityId: string) => number
  setActivityPace: (activityId: string, pace: number) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const SETTINGS_STORAGE_KEY = 'snowboard-prep-settings'

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  restTimeBetweenActivities: 0,
  timerBufferTime: 3,
  // Voice settings defaults
  voiceCountingEnabled: false,
  voiceCommandsEnabled: false,
  voiceCountingPace: 2, // 2 seconds between counts
  voiceVolume: 1.0,
  voiceRate: 1.0,
  voicePitch: 1.0,
  autoStartVoiceCounting: false,
  activityPaces: {}, // Empty by default
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle new settings added in future versions
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
      return DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore storage errors
    }
  }, [settings])

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const getActivityPace = useCallback((activityId: string): number => {
    return settings.activityPaces[activityId] ?? settings.voiceCountingPace
  }, [settings.activityPaces, settings.voiceCountingPace])

  const setActivityPace = useCallback((activityId: string, pace: number) => {
    setSettings(prev => ({
      ...prev,
      activityPaces: {
        ...prev.activityPaces,
        [activityId]: pace,
      },
    }))
  }, [])

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      getActivityPace,
      setActivityPace,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// Export defaults for reference
export { DEFAULT_SETTINGS }
export type { Settings }
