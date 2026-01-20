export type ActivityType = 'timer' | 'reps';

export type SideType = 'each' | null;

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  duration?: number;
  durationRange?: [number, number];
  count?: number;
  countRange?: [number, number];
  side: SideType;
  sideLabels?: string[];
  description: string;
  reducedDay?: boolean;
}

export interface Section {
  id: string;
  name: string;
  order: number;
  estimatedDuration: string;
  optional?: boolean;
  activities: Activity[];
}

export interface DaySchedule {
  day: number;
  name: string;
  type: 'full' | 'reduced' | 'mobility';
  sections: string[];
  strengthFilter?: string;
  description: string;
}

export interface WeeklyStructure {
  description: string;
  days: DaySchedule[];
}

export interface WorkoutInfo {
  name: string;
  description: string;
  estimatedDuration: string;
  totalActivities: number;
}

export interface WorkoutData {
  version: string;
  workout: WorkoutInfo;
  sections: Section[];
  weeklyStructure: WeeklyStructure;
  tips: string[];
}
