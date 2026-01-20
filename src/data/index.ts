import workoutData from './workoutData.json';
import type { WorkoutData, Activity, Section, DaySchedule } from './workoutTypes';

export const workout = workoutData as WorkoutData;

export function getAllActivities(): Activity[] {
  return workout.sections.flatMap(section => section.activities);
}

export function getActivityById(id: string): Activity | undefined {
  return getAllActivities().find(activity => activity.id === id);
}

export function getSectionById(id: string): Section | undefined {
  return workout.sections.find(section => section.id === id);
}

export function getActivitiesForDay(dayOfWeek: number): Activity[] {
  const daySchedule = workout.weeklyStructure.days.find(d => d.day === dayOfWeek);
  if (!daySchedule) return getAllActivities();

  const activities: Activity[] = [];

  for (const sectionId of daySchedule.sections) {
    const section = getSectionById(sectionId);
    if (!section) continue;

    if (sectionId === 'strength' && daySchedule.strengthFilter) {
      activities.push(...section.activities.filter(a => a.reducedDay === true));
    } else {
      activities.push(...section.activities);
    }
  }

  return activities;
}

export function getTodaysActivities(): Activity[] {
  const today = new Date().getDay();
  const dayOfWeek = today === 0 ? 7 : today;
  return getActivitiesForDay(dayOfWeek);
}

export type { WorkoutData, Activity, Section, DaySchedule };
export * from './workoutTypes';
