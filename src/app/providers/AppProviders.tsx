import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { WorkspaceSnapshot } from '../../domain/habits/repositories';
import type { Habit, HabitCompletion, ThemePreference, UserId } from '../../domain/habits/types';
import { toDateKey } from '../../domain/dates/calendar';
import { WorkspaceActions } from '../../application/workspace/WorkspaceActions';
import { InMemoryHabitlyRepositories } from '../../infrastructure/persistence/memory/InMemoryHabitlyRepositories';
import { BrowserThemePreferenceStore } from '../../infrastructure/preferences/ThemePreferenceStore';
import { HabitlyContext, type HabitlyContextValue } from './HabitlyContext';

interface AppProvidersProps extends PropsWithChildren {
  initialWorkspace?: WorkspaceSnapshot;
  isDemoPreview?: boolean;
}

const themeStore = new BrowserThemePreferenceStore();

function createLocalOwnerId(): UserId {
  return `local-workspace:${crypto.randomUUID()}`;
}

export function AppProviders({ children, initialWorkspace, isDemoPreview = false }: AppProvidersProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() => themeStore.read());
  const [workspaceServices] = useState(() => {
    const ownerId = initialWorkspace?.profile?.id ?? initialWorkspace?.habits[0]?.ownerId ?? createLocalOwnerId();
    const memory = new InMemoryHabitlyRepositories(initialWorkspace);
    const repositories = memory.getRepositories();
    return { ownerId, repositories, actions: new WorkspaceActions(ownerId, repositories) };
  });
  const { ownerId, actions } = workspaceServices;
  const [habits, setHabits] = useState<Habit[]>(() => initialWorkspace?.habits ?? []);
  const [entries, setEntries] = useState<HabitCompletion[]>(() => initialWorkspace?.completions ?? []);

  const refreshWorkspace = useCallback(async () => {
    const workspace = await actions.load();
    setHabits(workspace.habits);
    setEntries(workspace.completions);
  }, [actions]);

  const runAction = useCallback((operation: () => Promise<unknown>) => {
    void operation().then(refreshWorkspace).catch(error => {
      console.error('The in-memory workspace could not be updated.', error);
    });
  }, [refreshWorkspace]);

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
    setTheme: next => { setThemeState(next); themeStore.write(next); },
    ownerId,
    profile: initialWorkspace?.profile,
    isDemoPreview,
    habits,
    entries,
    addHabit: draft => runAction(() => actions.saveHabit(draft)),
    updateHabit: draft => {
      const current = habits.find(habit => habit.id === draft.id);
      if (current) runAction(() => actions.saveHabit(draft, current));
    },
    setHabitStatus: (id, status) => runAction(() => actions.setHabitStatus(id, status)),
    recordProgress: (habit, amount) => runAction(() => actions.toggleToday(habit, toDateKey(new Date()), amount)),
    recordAtDate: (habit, date, amount) => runAction(() => actions.recordAtDate(habit, date, amount)),
  }), [theme, ownerId, initialWorkspace?.profile, isDemoPreview, habits, entries, actions, runAction]);

  return <HabitlyContext.Provider value={value}>{children}</HabitlyContext.Provider>;
}
