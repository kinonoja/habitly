import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Habit, HabitEntry, ThemePreference } from '../../domain/habits/types';
import { demoEntries, demoHabits } from '../../domain/habits/demo';
import { toDateKey } from '../../domain/dates/calendar';
import { HabitlyContext, type HabitlyContextValue } from './HabitlyContext';

function initialTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem('habitly-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch { /* Local storage can be disabled. */ }
  return 'system';
}

export function AppProviders({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemePreference>(initialTheme);
  const [habits, setHabits] = useState<Habit[]>(demoHabits);
  const [entries, setEntries] = useState<HabitEntry[]>(demoEntries);

  useEffect(() => {
    const applyTheme = () => {
      const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#202722' : '#f3f0e8');
    };
    applyTheme();
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const value = useMemo<HabitlyContextValue>(() => ({
    theme,
    setTheme: next => {
      setThemeState(next);
      try { localStorage.setItem('habitly-theme', next); } catch { /* Theme still works for this session. */ }
    },
    habits, entries,
    addHabit: habit => setHabits(current => [...current, habit]),
    updateHabit: updated => setHabits(current => current.map(item => item.id === updated.id ? updated : item)),
    setHabitStatus: (id, status) => setHabits(current => current.map(item => item.id === id ? { ...item, status } : item)),
    recordProgress: (habit, value) => {
      const date = toDateKey(new Date());
      setEntries(current => {
        const updated = habit.trackingType === 'binary'
          ? { habitId: habit.id, date, completion: current.find(e => e.habitId === habit.id && e.date === date)?.completion === 'complete' ? 'incomplete' as const : 'complete' as const }
          : { habitId: habit.id, date, value: value ?? habit.targetValue ?? 0, completion: (value ?? habit.targetValue ?? 0) >= (habit.targetValue ?? Infinity) ? 'complete' as const : 'partial' as const };
        const rest = current.filter(entry => !(entry.habitId === habit.id && entry.date === date));
        return [...rest, updated];
      });
    },
    recordAtDate: (habit, date, value) => {
      setEntries(current => {
        const updated: HabitEntry = habit.trackingType === 'binary'
          ? { habitId: habit.id, date, completion: value ? 'complete' : 'incomplete' }
          : { habitId: habit.id, date, value: Number(value), completion: Number(value) >= (habit.targetValue ?? Infinity) ? 'complete' : Number(value) > 0 ? 'partial' : 'incomplete' };
        return [...current.filter(entry => !(entry.habitId === habit.id && entry.date === date)), updated];
      });
    },
  }), [theme, habits, entries]);

  return <HabitlyContext.Provider value={value}>{children}</HabitlyContext.Provider>;
}
