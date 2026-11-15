import type { ThemePreference } from '../../domain/habits/types';

export interface ThemePreferenceStore {
  read(): ThemePreference;
  write(theme: ThemePreference): void;
}

export class BrowserThemePreferenceStore implements ThemePreferenceStore {
  read(): ThemePreference {
    try {
      const stored = localStorage.getItem('habitly-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch { /* Use the system default when browser storage is unavailable. */ }
    return 'system';
  }

  write(theme: ThemePreference): void {
    try { localStorage.setItem('habitly-theme', theme); }
    catch { /* The selected theme still applies for this session. */ }
  }
}
