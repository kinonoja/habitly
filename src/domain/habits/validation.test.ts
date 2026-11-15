import { describe, expect, it } from 'vitest';
import type { Habit, UserProfile } from './types';
import { validateHabit, validateProfile } from './validation';

const validHabit: Habit = {
  id: 'habit-1', ownerId: 'user-1', name: 'Read', description: '', category: 'Learning', trackingType: 'binary',
  schedule: { type: 'weekdays', days: [1, 3, 5] }, startDate: '2024-02-05', status: 'active',
  createdAt: '2024-02-01T10:00:00.000Z', updatedAt: '2024-02-01T10:00:00.000Z', revision: 0,
};

describe('domain validation', () => {
  it('accepts a valid habit and rejects invalid dates, weekly targets, and ownership omissions', () => {
    expect(validateHabit(validHabit)).toEqual({ valid: true });
    expect(validateHabit({ ...validHabit, ownerId: '', endDate: '2024-02-04' })).toMatchObject({ valid: false });
    expect(validateHabit({ ...validHabit, schedule: { type: 'weekly', timesPerWeek: 8 } })).toMatchObject({ valid: false });
    expect(validateHabit({ ...validHabit, schedule: { type: 'weekdays', days: [0] } })).toMatchObject({ valid: false });
  });

  it('requires a display name and a valid profile timezone', () => {
    const profile: UserProfile = {
      id: 'user-1', displayName: 'Sam', email: 'sam@example.com', timezone: 'Africa/Lagos',
      createdAt: '2024-02-01T10:00:00.000Z', updatedAt: '2024-02-01T10:00:00.000Z', revision: 0,
    };
    expect(validateProfile(profile)).toEqual({ valid: true });
    expect(validateProfile({ ...profile, displayName: ' ', timezone: 'Not/A_Timezone' })).toMatchObject({ valid: false });
  });
});
