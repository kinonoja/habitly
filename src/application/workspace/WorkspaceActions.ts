import type { HabitlyRepositories } from '../../domain/habits/repositories';
import type { DateKey, Habit, HabitCompletion, HabitDraft, HabitSchedule, UserId } from '../../domain/habits/types';
import { validateCompletion, validateHabit, validateSchedule } from '../../domain/habits/validation';

export interface WorkspaceData {
  habits: Habit[];
  completions: HabitCompletion[];
}

export class WorkspaceActions {
  constructor(private readonly ownerId: UserId, private readonly repositories: HabitlyRepositories) {}

  async load(): Promise<WorkspaceData> {
    const [habits, completions] = await Promise.all([
      this.repositories.habits.listHabits(this.ownerId),
      this.repositories.completions.listCompletions(this.ownerId),
    ]);
    return { habits, completions };
  }

  async saveHabit(draft: HabitDraft, existing?: Habit): Promise<Habit> {
    if (draft.id && existing && draft.id !== existing.id) throw new Error('A habit update cannot change its ID.');
    if (existing && existing.ownerId !== this.ownerId) throw new Error('Cannot update a habit owned by another workspace.');
    const now = new Date().toISOString();
    const habit: Habit = {
      ...draft,
      id: existing?.id ?? draft.id ?? crypto.randomUUID(),
      ownerId: this.ownerId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      revision: existing ? existing.revision + 1 : 0,
    };
    assertValid(validateHabit(habit));
    await this.repositories.habits.saveHabit(habit);
    const schedule: HabitSchedule = {
      id: `schedule:${habit.id}`,
      ownerId: this.ownerId,
      habitId: habit.id,
      definition: habit.schedule,
      updatedAt: now,
      revision: existing ? existing.revision + 1 : 0,
    };
    assertValid(validateSchedule(schedule));
    await this.repositories.schedules.saveSchedule(schedule);
    return habit;
  }

  async setHabitStatus(habitId: string, status: Habit['status']): Promise<void> {
    const habit = await this.repositories.habits.getHabit(this.ownerId, habitId);
    if (!habit) throw new Error('Habit is not available in this workspace.');
    await this.saveHabit({ ...habit, status }, habit);
  }

  async recordAtDate(habit: Habit, date: DateKey, value: number | boolean): Promise<void> {
    if (habit.ownerId !== this.ownerId) throw new Error('Cannot record progress for another workspace.');
    const ownedHabit = await this.repositories.habits.getHabit(this.ownerId, habit.id);
    if (!ownedHabit) throw new Error('Habit is not available in this workspace.');
    const current = (await this.repositories.completions.listCompletions(this.ownerId)).find(item => item.habitId === habit.id && item.date === date);
    const amount = habit.trackingType === 'binary' ? undefined : Number(value);
    const completion: HabitCompletion = {
      id: current?.id ?? crypto.randomUUID(),
      ownerId: this.ownerId,
      habitId: habit.id,
      date,
      completion: habit.trackingType === 'binary'
        ? value ? 'complete' : 'incomplete'
        : (amount ?? 0) >= (habit.targetValue ?? Infinity) ? 'complete' : (amount ?? 0) > 0 ? 'partial' : 'incomplete',
      value: amount,
      createdAt: current?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revision: current ? current.revision + 1 : 0,
    };
    assertValid(validateCompletion(completion));
    await this.repositories.completions.saveCompletion(completion);
  }

  async toggleToday(habit: Habit, date: DateKey, value?: number): Promise<void> {
    const existing = (await this.repositories.completions.listCompletions(this.ownerId)).find(item => item.habitId === habit.id && item.date === date);
    if (habit.trackingType === 'binary') {
      await this.recordAtDate(habit, date, existing?.completion !== 'complete');
    } else {
      await this.recordAtDate(habit, date, value ?? habit.targetValue ?? 0);
    }
  }
}

function assertValid(result: ReturnType<typeof validateHabit> | ReturnType<typeof validateSchedule> | ReturnType<typeof validateCompletion>): void {
  if (!result.valid) throw new Error(result.errors.join(' '));
}
