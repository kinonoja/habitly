import type { Habit, HabitCompletion, UserPreferences, UserProfile } from '../domain/habits/types';
import { toDateKey } from '../domain/dates/calendar';

export const demoProfile: UserProfile = {
  id: 'demo-user', displayName: 'Alex Morgan', email: 'alex@example.com', timezone: 'Africa/Lagos',
  createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z', revision: 0,
};

export const demoPreferences: UserPreferences = {
  userId: demoProfile.id, theme: 'system', createdAt: demoProfile.createdAt, updatedAt: demoProfile.updatedAt, revision: 0,
};

const today = toDateKey(new Date());
const ago = (amount: number) => { const date = new Date(); date.setDate(date.getDate() - amount); return toDateKey(date); };

export const demoHabits: Habit[] = [
  { id: 'reading', ownerId: demoProfile.id, name: 'Read a little', description: 'Make space for a few pages.', category: 'Learning', trackingType: 'measurable', targetValue: 20, unit: 'pages', schedule: { type: 'daily' }, startDate: ago(75), status: 'active', createdAt: `${ago(75)}T09:00:00.000Z`, updatedAt: `${ago(75)}T09:00:00.000Z`, revision: 0 },
  { id: 'movement', ownerId: demoProfile.id, name: 'Move with intention', description: 'A walk, stretch, or something that feels good.', category: 'Movement', trackingType: 'binary', schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] }, startDate: ago(44), status: 'active', createdAt: `${ago(44)}T09:00:00.000Z`, updatedAt: `${ago(44)}T09:00:00.000Z`, revision: 0 },
  { id: 'water', ownerId: demoProfile.id, name: 'Drink water', description: 'A steady start to the day.', category: 'Wellbeing', trackingType: 'measurable', targetValue: 8, unit: 'glasses', schedule: { type: 'daily' }, startDate: ago(62), status: 'active', createdAt: `${ago(62)}T09:00:00.000Z`, updatedAt: `${ago(62)}T09:00:00.000Z`, revision: 0 },
  { id: 'journal', ownerId: demoProfile.id, name: 'Write a few lines', description: 'Notice what is working.', category: 'Mindfulness', trackingType: 'binary', schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5, 6, 7] }, startDate: ago(28), status: 'active', createdAt: `${ago(28)}T09:00:00.000Z`, updatedAt: `${ago(28)}T09:00:00.000Z`, revision: 0 },
  { id: 'practice', ownerId: demoProfile.id, name: 'Practice Spanish', description: 'Small steps add up.', category: 'Learning', trackingType: 'measurable', targetValue: 15, unit: 'minutes', schedule: { type: 'weekly', timesPerWeek: 4 }, startDate: ago(21), status: 'active', createdAt: `${ago(21)}T09:00:00.000Z`, updatedAt: `${ago(21)}T09:00:00.000Z`, revision: 0 },
];

export const demoEntries: HabitCompletion[] = (() => {
  const entries: HabitCompletion[] = [];
  for (let offset = 0; offset < 31; offset += 1) {
    const date = ago(offset);
    demoHabits.forEach((habit, index) => {
      const day = new Date(`${date}T12:00:00`).getDay() || 7;
      if (habit.schedule.type === 'weekdays' && !habit.schedule.days.includes(day)) return;
      const completed = (offset + index * 2) % (index === 2 ? 5 : 4) !== 0;
      if (habit.trackingType === 'measurable') {
        const value = completed ? (habit.targetValue ?? 1) * (offset % 6 === 0 ? 0.65 : 1) : 0;
        entries.push({ id: `demo-${habit.id}-${date}`, ownerId: demoProfile.id, habitId: habit.id, date, value, completion: value >= (habit.targetValue ?? Infinity) ? 'complete' : value > 0 ? 'partial' : 'incomplete', createdAt: `${date}T18:00:00.000Z`, updatedAt: `${date}T18:00:00.000Z`, revision: 0 });
      } else entries.push({ id: `demo-${habit.id}-${date}`, ownerId: demoProfile.id, habitId: habit.id, date, completion: completed ? 'complete' : 'incomplete', createdAt: `${date}T18:00:00.000Z`, updatedAt: `${date}T18:00:00.000Z`, revision: 0 });
    });
  }
  return entries;
})();

export const demoToday = today;
