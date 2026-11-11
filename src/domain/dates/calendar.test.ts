import { describe, expect, it } from 'vitest';
import { daysInMonth, getEntryProgress, isExpectedCompletion, isHabitScheduled, parseDateInput, shiftMonth, toDateKey, weeklyScheduleDays } from './calendar';
import type { Habit, HabitEntry } from '../habits/types';

const habit: Habit = {
  id: 'reading', name: 'Read', description: '', category: 'Learning', trackingType: 'measurable',
  targetValue: 20, unit: 'pages', schedule: { type: 'weekdays', days: [1, 3, 5] },
  startDate: '2024-02-05', endDate: '2024-02-23', status: 'active', createdAt: '2024-02-01T10:00:00.000Z',
};

describe('calendar date utilities', () => {
  it('generates the correct number of days in each month', () => {
    expect(daysInMonth(2025, 1)).toHaveLength(28);
    expect(daysInMonth(2024, 1)).toHaveLength(29);
    expect(daysInMonth(2025, 3)).toHaveLength(30);
    expect(daysInMonth(2025, 0)).toHaveLength(31);
  });

  it('moves between months and years without losing the month index', () => {
    expect(shiftMonth(2025, 11, 1)).toEqual({ year: 2026, monthIndex: 0 });
    expect(shiftMonth(2025, 0, -1)).toEqual({ year: 2024, monthIndex: 11 });
  });

  it('uses local calendar dates without UTC string shifting', () => {
    expect(toDateKey(new Date(2024, 2, 1, 0, 15))).toBe('2024-03-01');
    expect(daysInMonth(2024, 1)[28]?.key).toBe('2024-02-29');
  });

  it('validates optional date input as a calendar date key', () => {
    expect(parseDateInput('')).toBeUndefined();
    expect(parseDateInput('2024-02-29')).toBe('2024-02-29');
    expect(parseDateInput('2023-02-29')).toBeUndefined();
    expect(parseDateInput('2024-13-01')).toBeUndefined();
    expect(parseDateInput('2024-2-01')).toBeUndefined();
  });
});

describe('habit schedule and entry rules', () => {
  it('checks selected weekdays and skips paused or archived habits', () => {
    expect(isHabitScheduled(habit, '2024-02-05')).toBe(true);
    expect(isHabitScheduled(habit, '2024-02-06')).toBe(false);
    expect(isHabitScheduled({ ...habit, status: 'paused' }, '2024-02-05')).toBe(false);
    expect(isHabitScheduled({ ...habit, status: 'archived' }, '2024-02-05')).toBe(false);
  });

  it('respects habit start and end dates', () => {
    expect(isHabitScheduled(habit, '2024-02-02')).toBe(false);
    expect(isHabitScheduled(habit, '2024-02-26')).toBe(false);
    expect(isHabitScheduled(habit, '2024-02-23')).toBe(true);
    expect(isExpectedCompletion(habit, '2024-02-23', '2024-02-23')).toBe(true);
  });

  it('does not count future dates as expected completions', () => {
    expect(isExpectedCompletion(habit, '2024-02-21', '2024-02-20')).toBe(false);
  });

  it('spreads a flexible weekly schedule across the week', () => {
    expect(weeklyScheduleDays(3)).toEqual([1, 3, 5]);
    expect(weeklyScheduleDays(7)).toHaveLength(7);
  });

  it('evaluates measurable progress against the configured target', () => {
    const entry: HabitEntry = { habitId: 'reading', date: '2024-02-05', completion: 'partial', value: 10 };
    expect(getEntryProgress(habit, entry)).toBe(0.5);
    expect(getEntryProgress(habit, { ...entry, value: 30 })).toBe(1);
    expect(getEntryProgress(habit)).toBeNull();
  });
});
