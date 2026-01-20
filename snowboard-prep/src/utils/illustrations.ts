// Illustration mapping for workout activities
// Maps activity IDs to their corresponding SVG illustrations

import warmup1JumpingJacks from '../assets/images/warmup-1-jumping-jacks.svg'
import warmup2HipCircles from '../assets/images/warmup-2-hip-circles.svg'
import warmup3AnkleCircles from '../assets/images/warmup-3-ankle-circles.svg'
import warmup4TorsoRotations from '../assets/images/warmup-4-torso-rotations.svg'

// Map of activity IDs to their illustration paths
const illustrationMap: Record<string, string> = {
  // Warm-up activities
  'warmup-1': warmup1JumpingJacks,
  'warmup-2': warmup2HipCircles,
  'warmup-3': warmup3AnkleCircles,
  'warmup-4': warmup4TorsoRotations,
}

// Fallback emoji icons for activities without illustrations
const fallbackIcons: Record<string, string> = {
  // Warm-up
  'warmup-1': '🏃',
  'warmup-2': '🔄',
  'warmup-3': '🦶',
  'warmup-4': '🔁',
  // Mobility & Stretching
  'mobility-1': '🧘',
  'mobility-2': '4️⃣',
  'mobility-3': '🦵',
  'mobility-4a': '🦵',
  'mobility-4b': '🦵',
  'mobility-5': '🦶',
  'mobility-6': '🐱',
  // Strength & Stability
  'strength-1': '⚖️',
  'strength-2': '🏋️',
  'strength-3': '🦵',
  'strength-4': '🍑',
  'strength-5': '🐛',
  'strength-6': '💪',
  // Recovery
  'recovery-1': '🧎',
  'recovery-2': '🔄',
}

/**
 * Get the illustration path for an activity
 * @param activityId - The ID of the activity
 * @returns The SVG illustration path or null if not available
 */
export function getIllustration(activityId: string): string | null {
  return illustrationMap[activityId] || null
}

/**
 * Get the fallback emoji icon for an activity
 * @param activityId - The ID of the activity
 * @returns The fallback emoji or a default exercise icon
 */
export function getFallbackIcon(activityId: string): string {
  return fallbackIcons[activityId] || '🏋️'
}

/**
 * Check if an illustration is available for an activity
 * @param activityId - The ID of the activity
 * @returns True if an illustration exists
 */
export function hasIllustration(activityId: string): boolean {
  return activityId in illustrationMap
}
