import { createContext, useContext } from 'react';
import type { DateKey, Habit, HabitEntry, ThemePreference } from '../../domain/habits/types';

export interface HabitlyContextValue {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  habits: Habit[];
  entries: HabitEntry[];
  addHabit: (habit: Habit) => void;
  updateHabit: (habit: Habit) => void;
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
