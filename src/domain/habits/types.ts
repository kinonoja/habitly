export type DateKey = `${number}-${number}-${number}`;
export type TrackingType = 'binary' | 'measurable';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type ThemePreference = 'light' | 'dark' | 'system';
export type HabitCategory = 'Wellbeing' | 'Learning' | 'Movement' | 'Mindfulness' | 'Personal';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  avatarInitials: string;
}

export type HabitSchedule =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] }
  | { type: 'weekly'; timesPerWeek: number };

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  trackingType: TrackingType;
  targetValue?: number;
  unit?: string;
  schedule: HabitSchedule;
  startDate: DateKey;
  endDate?: DateKey;
  status: HabitStatus;
  createdAt: string;
}

export type EntryCompletion = 'complete' | 'partial' | 'incomplete';
export interface HabitEntry {
  habitId: string;
  date: DateKey;
  completion: EntryCompletion;
  value?: number;
  note?: string;
}
