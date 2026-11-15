import { createContext, useContext } from 'react';
import type { DateKey, Habit, HabitCompletion, HabitDraft, ThemePreference, UserId, UserProfile } from '../../domain/habits/types';

export interface HabitlyContextValue {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  ownerId: UserId;
  profile?: UserProfile;
  isDemoPreview: boolean;
  habits: Habit[];
  entries: HabitCompletion[];
  addHabit: (habit: HabitDraft) => void;
  updateHabit: (habit: HabitDraft) => void;
  setHabitStatus: (id: string, status: Habit['status']) => void;
  recordProgress: (habit: Habit, value?: number) => void;
  recordAtDate: (habit: Habit, date: DateKey, value: number | boolean) => void;
}

export const HabitlyContext = createContext<HabitlyContextValue | null>(null);

export function useHabitly() {
  const value = useContext(HabitlyContext);
  if (!value) throw new Error('useHabitly must be used within AppProviders');
  return value;
}
