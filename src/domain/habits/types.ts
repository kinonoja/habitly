/** A local calendar date (YYYY-MM-DD), not a UTC timestamp. */
export type DateKey = `${number}-${number}-${number}`;
/** An ISO-8601 UTC instant with a trailing Z. */
export type UtcTimestamp = string;
export type UserId = string;
export type EntityId = string;
export type TrackingType = 'binary' | 'measurable';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type ThemePreference = 'light' | 'dark' | 'system';
export type HabitCategory = 'Wellbeing' | 'Learning' | 'Movement' | 'Mindfulness' | 'Personal';

export interface UserProfile {
  id: UserId;
  displayName: string;
  email: string;
  timezone: string;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
  revision: number;
}

export type HabitScheduleDefinition =
  | { type: 'daily' }
  /** ISO weekday numbers: Monday=1 through Sunday=7. */
  | { type: 'weekdays'; days: number[] }
  /** Qualifying completions per Monday-start calendar week. */
  | { type: 'weekly'; timesPerWeek: number };

export interface HabitSchedule {
  id: EntityId;
  ownerId: UserId;
  habitId: EntityId;
  definition: HabitScheduleDefinition;
  updatedAt: UtcTimestamp;
  revision: number;
}

export interface Habit {
  id: EntityId;
  ownerId: UserId;
  name: string;
  description: string;
  category: HabitCategory;
  trackingType: TrackingType;
  targetValue?: number;
  unit?: string;
  schedule: HabitScheduleDefinition;
  startDate: DateKey;
  endDate?: DateKey;
  status: HabitStatus;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
  revision: number;
}

export type EntryCompletion = 'complete' | 'partial' | 'incomplete';
export interface HabitCompletion {
  id: EntityId;
  ownerId: UserId;
  habitId: EntityId;
  date: DateKey;
  completion: EntryCompletion;
  value?: number;
  note?: string;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
  revision: number;
}

/** Compatibility name for page code; new contracts use HabitCompletion. */
export type HabitEntry = HabitCompletion;

export interface UserPreferences {
  userId: UserId;
  theme: ThemePreference;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
  revision: number;
}

export type HabitDraft = Omit<Habit, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'revision'> & { id?: EntityId };
