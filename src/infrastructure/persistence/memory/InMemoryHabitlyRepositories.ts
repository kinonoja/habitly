import type { HabitlyRepositories, WorkspaceSnapshot } from '../../../domain/habits/repositories';
import type { Habit, HabitCompletion, HabitSchedule, UserId, UserPreferences, UserProfile } from '../../../domain/habits/types';

export class InMemoryHabitlyRepositories {
  private profile?: UserProfile;
  private preferenceRecord?: UserPreferences;
  private habitRecords: Habit[];
  private scheduleRecords: HabitSchedule[];
  private completionRecords: HabitCompletion[];

  constructor(snapshot: WorkspaceSnapshot = { habits: [], schedules: [], completions: [] }) {
    this.profile = snapshot.profile ? { ...snapshot.profile } : undefined;
    this.preferenceRecord = snapshot.preferences ? { ...snapshot.preferences } : undefined;
    this.habitRecords = snapshot.habits.map(habit => ({ ...habit, schedule: { ...habit.schedule } }));
    this.scheduleRecords = snapshot.schedules.map(schedule => ({ ...schedule, definition: { ...schedule.definition } }));
    this.completionRecords = snapshot.completions.map(completion => ({ ...completion }));
  }

  readonly profiles = {
    getProfile: async (userId: UserId) => this.profile?.id === userId ? { ...this.profile } : undefined,
    saveProfile: async (profile: UserProfile) => { this.profile = { ...profile }; },
  };

  readonly habitsRepository = {
    listHabits: async (ownerId: UserId) => this.habitRecords.filter(habit => habit.ownerId === ownerId).map(habit => ({ ...habit, schedule: { ...habit.schedule } })),
    getHabit: async (ownerId: UserId, habitId: string) => {
      const habit = this.habitRecords.find(item => item.ownerId === ownerId && item.id === habitId);
      return habit ? { ...habit, schedule: { ...habit.schedule } } : undefined;
    },
    saveHabit: async (habit: Habit) => {
      this.habitRecords = [...this.habitRecords.filter(item => !(item.ownerId === habit.ownerId && item.id === habit.id)), { ...habit, schedule: { ...habit.schedule } }];
    },
  };

  readonly scheduleRepository = {
    listSchedules: async (ownerId: UserId) => this.scheduleRecords.filter(item => item.ownerId === ownerId).map(item => ({ ...item, definition: { ...item.definition } })),
    saveSchedule: async (schedule: HabitSchedule) => {
      this.scheduleRecords = [...this.scheduleRecords.filter(item => !(item.ownerId === schedule.ownerId && item.id === schedule.id)), { ...schedule, definition: { ...schedule.definition } }];
    },
  };

  readonly completionsRepository = {
    listCompletions: async (ownerId: UserId) => this.completionRecords.filter(item => item.ownerId === ownerId).map(item => ({ ...item })),
    saveCompletion: async (completion: HabitCompletion) => {
      this.completionRecords = [...this.completionRecords.filter(item => !(item.ownerId === completion.ownerId && item.habitId === completion.habitId && item.date === completion.date)), { ...completion }];
    },
  };

  readonly preferencesRepository = {
    getPreferences: async (userId: UserId) => this.preferenceRecord?.userId === userId ? { ...this.preferenceRecord } : undefined,
    savePreferences: async (preferences: UserPreferences) => { this.preferenceRecord = { ...preferences }; },
  };

  getRepositories(): HabitlyRepositories {
    return {
      profiles: this.profiles,
      habits: this.habitsRepository,
      schedules: this.scheduleRepository,
      completions: this.completionsRepository,
      preferences: this.preferencesRepository,
    };
  }
}
