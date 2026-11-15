import type { Habit, HabitCompletion, HabitSchedule, UserId, UserPreferences, UserProfile } from './types';

export interface ProfileRepository {
  getProfile(userId: UserId): Promise<UserProfile | undefined>;
  saveProfile(profile: UserProfile): Promise<void>;
}

export interface HabitRepository {
  listHabits(ownerId: UserId): Promise<Habit[]>;
  getHabit(ownerId: UserId, habitId: string): Promise<Habit | undefined>;
  saveHabit(habit: Habit): Promise<void>;
}

export interface ScheduleRepository {
  listSchedules(ownerId: UserId): Promise<HabitSchedule[]>;
  saveSchedule(schedule: HabitSchedule): Promise<void>;
}

export interface CompletionRepository {
  listCompletions(ownerId: UserId): Promise<HabitCompletion[]>;
  saveCompletion(completion: HabitCompletion): Promise<void>;
}

export interface PreferencesRepository {
  getPreferences(userId: UserId): Promise<UserPreferences | undefined>;
  savePreferences(preferences: UserPreferences): Promise<void>;
}

export interface HabitlyRepositories {
  profiles: ProfileRepository;
  habits: HabitRepository;
  schedules: ScheduleRepository;
  completions: CompletionRepository;
  preferences: PreferencesRepository;
}

export interface WorkspaceSnapshot {
  profile?: UserProfile;
  habits: Habit[];
  schedules: HabitSchedule[];
  completions: HabitCompletion[];
  preferences?: UserPreferences;
}
