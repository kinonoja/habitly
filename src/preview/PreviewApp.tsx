import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '../app/providers/AppProviders';
import { createAppRouter } from '../app/router';
import { demoEntries, demoHabits, demoPreferences, demoProfile } from './demoData';

const previewWorkspace = {
  profile: demoProfile,
  preferences: demoPreferences,
  habits: demoHabits,
  completions: demoEntries,
  schedules: demoHabits.map(habit => ({
    id: `schedule:${habit.id}`,
    ownerId: habit.ownerId,
    habitId: habit.id,
    definition: habit.schedule,
    updatedAt: habit.updatedAt,
    revision: 0,
  })),
};

export function PreviewApp() {
  const [router] = useState(createAppRouter);
  return <AppProviders initialWorkspace={previewWorkspace} isDemoPreview><RouterProvider router={router} /></AppProviders>;
}
