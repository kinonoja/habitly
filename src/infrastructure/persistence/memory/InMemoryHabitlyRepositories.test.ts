import { describe, expect, it } from 'vitest';
import { InMemoryHabitlyRepositories } from './InMemoryHabitlyRepositories';
import type { Habit } from '../../../domain/habits/types';

const habitFor = (ownerId: string, id: string): Habit => ({
  id, ownerId, name: id, description: '', category: 'Learning', trackingType: 'binary', schedule: { type: 'daily' },
  startDate: '2024-02-01', status: 'active', createdAt: '2024-02-01T10:00:00.000Z',
  updatedAt: '2024-02-01T10:00:00.000Z', revision: 0,
});

describe('in-memory repository adapter', () => {
  it('starts empty and returns only records matching the requested owner', async () => {
    const repositories = new InMemoryHabitlyRepositories().getRepositories();
    expect(await repositories.habits.listHabits('user-a')).toEqual([]);
    await repositories.habits.saveHabit(habitFor('user-a', 'a-habit'));
    await repositories.habits.saveHabit(habitFor('user-b', 'b-habit'));
    expect((await repositories.habits.listHabits('user-a')).map(habit => habit.id)).toEqual(['a-habit']);
    expect(await repositories.habits.getHabit('user-a', 'b-habit')).toBeUndefined();
  });

  it('upserts a completion by owner, habit, and calendar date', async () => {
    const repositories = new InMemoryHabitlyRepositories().getRepositories();
    const base = { id: 'completion-1', ownerId: 'user-a', habitId: 'habit-1', date: '2024-02-01' as const, completion: 'complete' as const, createdAt: '2024-02-01T10:00:00.000Z', updatedAt: '2024-02-01T10:00:00.000Z', revision: 0 };
    await repositories.completions.saveCompletion(base);
    await repositories.completions.saveCompletion({ ...base, completion: 'incomplete', revision: 1 });
    expect(await repositories.completions.listCompletions('user-a')).toHaveLength(1);
    expect((await repositories.completions.listCompletions('user-a'))[0]?.completion).toBe('incomplete');
    expect(await repositories.completions.listCompletions('user-b')).toEqual([]);
  });
});
