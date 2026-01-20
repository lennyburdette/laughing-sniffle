import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { getAllActivities } from '../data'
import type { Activity } from '../data/workoutTypes'

const STORAGE_KEY = 'snowboard-prep-workout-state'

interface WorkoutState {
  currentActivityIndex: number
  completedActivities: Set<number>
  isWorkoutStarted: boolean
  isWorkoutComplete: boolean
}

interface PersistedState {
  currentActivityIndex: number
  completedActivities: number[]
  isWorkoutStarted: boolean
  isWorkoutComplete: boolean
  savedAt: string
}

interface WorkoutContextType {
  activities: Activity[]
  currentActivityIndex: number
  currentActivity: Activity | null
  completedActivities: Set<number>
  isWorkoutStarted: boolean
  isWorkoutComplete: boolean
  totalActivities: number
  completedCount: number
  progressPercentage: number

  // Navigation
  startWorkout: () => void
  goToActivity: (index: number) => void
  nextActivity: () => void
  previousActivity: () => void
  skipActivity: () => void

  // Progress tracking
  markActivityCompleted: (index: number) => void
  isActivityCompleted: (index: number) => boolean

  // Workout control
  completeWorkout: () => void
  restartWorkout: () => void
  resetWorkout: () => void

  // Persistence
  hasSavedProgress: boolean
  resumeWorkout: () => void
  clearSavedProgress: () => void
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

function loadPersistedState(): PersistedState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as PersistedState
      // Check if saved state is less than 24 hours old
      const savedTime = new Date(parsed.savedAt).getTime()
      const now = Date.now()
      const hoursOld = (now - savedTime) / (1000 * 60 * 60)
      if (hoursOld < 24) {
        return parsed
      }
    }
  } catch {
    // Invalid stored data, ignore
  }
  return null
}

function saveState(state: WorkoutState): void {
  try {
    const toSave: PersistedState = {
      currentActivityIndex: state.currentActivityIndex,
      completedActivities: Array.from(state.completedActivities),
      isWorkoutStarted: state.isWorkoutStarted,
      isWorkoutComplete: state.isWorkoutComplete,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // localStorage not available, ignore
  }
}

function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage not available, ignore
  }
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const activities = getAllActivities()
  const totalActivities = activities.length

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [completedActivities, setCompletedActivities] = useState<Set<number>>(new Set())
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false)
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false)
  const [hasSavedProgress, setHasSavedProgress] = useState(false)

  // Check for saved progress on mount
  useEffect(() => {
    const saved = loadPersistedState()
    if (saved && saved.isWorkoutStarted && !saved.isWorkoutComplete) {
      setHasSavedProgress(true)
    }
  }, [])

  // Persist state when it changes
  useEffect(() => {
    if (isWorkoutStarted) {
      saveState({
        currentActivityIndex,
        completedActivities,
        isWorkoutStarted,
        isWorkoutComplete
      })
    }
  }, [currentActivityIndex, completedActivities, isWorkoutStarted, isWorkoutComplete])

  const currentActivity = activities[currentActivityIndex] || null
  const completedCount = completedActivities.size
  const progressPercentage = totalActivities > 0
    ? Math.round((completedCount / totalActivities) * 100)
    : 0

  // Navigation functions
  const startWorkout = useCallback(() => {
    setCurrentActivityIndex(0)
    setCompletedActivities(new Set())
    setIsWorkoutStarted(true)
    setIsWorkoutComplete(false)
    setHasSavedProgress(false)
  }, [])

  const resumeWorkout = useCallback(() => {
    const saved = loadPersistedState()
    if (saved) {
      setCurrentActivityIndex(saved.currentActivityIndex)
      setCompletedActivities(new Set(saved.completedActivities))
      setIsWorkoutStarted(saved.isWorkoutStarted)
      setIsWorkoutComplete(saved.isWorkoutComplete)
      setHasSavedProgress(false)
    }
  }, [])

  const goToActivity = useCallback((index: number) => {
    if (index >= 0 && index < totalActivities) {
      setCurrentActivityIndex(index)
    }
  }, [totalActivities])

  const nextActivity = useCallback(() => {
    if (currentActivityIndex < totalActivities - 1) {
      setCurrentActivityIndex(prev => prev + 1)
    } else {
      setIsWorkoutComplete(true)
    }
  }, [currentActivityIndex, totalActivities])

  const previousActivity = useCallback(() => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex(prev => prev - 1)
    }
  }, [currentActivityIndex])

  const skipActivity = useCallback(() => {
    nextActivity()
  }, [nextActivity])

  // Progress tracking
  const markActivityCompleted = useCallback((index: number) => {
    setCompletedActivities(prev => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
  }, [])

  const isActivityCompleted = useCallback((index: number) => {
    return completedActivities.has(index)
  }, [completedActivities])

  // Workout control
  const completeWorkout = useCallback(() => {
    setIsWorkoutComplete(true)
  }, [])

  const restartWorkout = useCallback(() => {
    setCurrentActivityIndex(0)
    setCompletedActivities(new Set())
    setIsWorkoutComplete(false)
    // Keep isWorkoutStarted true
  }, [])

  const resetWorkout = useCallback(() => {
    setCurrentActivityIndex(0)
    setCompletedActivities(new Set())
    setIsWorkoutStarted(false)
    setIsWorkoutComplete(false)
    clearState()
    setHasSavedProgress(false)
  }, [])

  const clearSavedProgress = useCallback(() => {
    clearState()
    setHasSavedProgress(false)
  }, [])

  const value: WorkoutContextType = {
    activities,
    currentActivityIndex,
    currentActivity,
    completedActivities,
    isWorkoutStarted,
    isWorkoutComplete,
    totalActivities,
    completedCount,
    progressPercentage,

    startWorkout,
    goToActivity,
    nextActivity,
    previousActivity,
    skipActivity,

    markActivityCompleted,
    isActivityCompleted,

    completeWorkout,
    restartWorkout,
    resetWorkout,

    hasSavedProgress,
    resumeWorkout,
    clearSavedProgress
  }

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider')
  }
  return context
}
