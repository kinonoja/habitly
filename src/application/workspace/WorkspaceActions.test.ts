import { describe, expect, it } from 'vitest';
import { InMemoryHabitlyRepositories } from '../../infrastructure/persistence/memory/InMemoryHabitlyRepositories';
import type { Habit } from '../../domain/habits/types';
import { WorkspaceActions } from './WorkspaceActions';

const habit: Habit = {
  id: 'habit-b', ownerId: 'user-b', name: 'Walk', description: '', category: 'Movement', trackingType: 'binary',
  schedule: { type: 'daily' }, startDate: '2024-02-01', status: 'active', createdAt: '2024-02-01T10:00:00.000Z',
  updatedAt: '2024-02-01T10:00:00.000Z', revision: 0,
};

describe('workspace application actions', () => {
  it('rejects updates and completions that do not belong to the active workspace owner', async () => {
    const repositories = new InMemoryHabitlyRepositories({ habits: [habit], schedules: [], completions: [] }).getRepositories();
    const actions = new WorkspaceActions('user-a', repositories);
    await expect(actions.saveHabit({ ...habit, name: 'Changed' }, habit)).rejects.toThrow(/another workspace/);
    await expect(actions.recordAtDate(habit, '2024-02-01', true)).rejects.toThrow(/another workspace/);
    expect(await repositories.completions.listCompletions('user-a')).toEqual([]);
    expect((await repositories.habits.getHabit('user-b', 'habit-b'))?.name).toBe('Walk');
  });

  it('validates before saving a habit', async () => {
    const repositories = new InMemoryHabitlyRepositories().getRepositories();
    const actions = new WorkspaceActions('user-a', repositories);
    await expect(actions.saveHabit({ name: '', description: '', category: 'Learning', trackingType: 'binary', schedule: { type: 'weekly', timesPerWeek: 0 }, startDate: '2024-02-01', status: 'active' })).rejects.toThrow(/Habit name is required/);
    expect(await repositories.habits.listHabits('user-a')).toEqual([]);
  });
});
