// Illustration mapping for workout activities
// Maps activity IDs to their corresponding SVG illustrations

import warmup1JumpingJacks from '../assets/images/warmup-1-jumping-jacks.svg'
import warmup2HipCircles from '../assets/images/warmup-2-hip-circles.svg'
import warmup3AnkleCircles from '../assets/images/warmup-3-ankle-circles.svg'
import warmup4TorsoRotations from '../assets/images/warmup-4-torso-rotations.svg'
import mobility1WorldsGreatestStretch from '../assets/images/mobility-1-worlds-greatest-stretch.svg'
import mobility2Figure4Stretch from '../assets/images/mobility-2-figure-4-stretch.svg'
import mobility3HamstringHipHinge from '../assets/images/mobility-3-hamstring-hip-hinge.svg'
import mobility4CalfStretch from '../assets/images/mobility-4-calf-stretch.svg'
import mobility5AnkleDorsiflexion from '../assets/images/mobility-5-ankle-dorsiflexion.svg'
import mobility6CatCow from '../assets/images/mobility-6-cat-cow.svg'

// Map of activity IDs to their illustration paths
const illustrationMap: Record<string, string> = {
  // Warm-up activities
  'warmup-1': warmup1JumpingJacks,
  'warmup-2': warmup2HipCircles,
  'warmup-3': warmup3AnkleCircles,
  'warmup-4': warmup4TorsoRotations,
  // Mobility & Stretching activities
  'mobility-1': mobility1WorldsGreatestStretch,
  'mobility-2': mobility2Figure4Stretch,
  'mobility-3': mobility3HamstringHipHinge,
  'mobility-4a': mobility4CalfStretch,
  'mobility-4b': mobility4CalfStretch,
  'mobility-5': mobility5AnkleDorsiflexion,
  'mobility-6': mobility6CatCow,
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
