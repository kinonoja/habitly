import type { DateKey, Habit, HabitEntry } from '../habits/types';

export interface CalendarDay { key: DateKey; date: Date; day: number; weekday: number; isToday: boolean; isFuture: boolean }

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` as DateKey;
}

function hasDateKeyFormat(value: string): value is DateKey {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseDateInput(value: string): DateKey | undefined {
  if (value === '') return undefined;
  if (!hasDateKeyFormat(value)) return undefined;
  const [yearPart, monthPart, dayPart] = value.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year === 0 || month < 1 || month > 12 || day < 1 || day > monthLengths[month - 1]!) return undefined;
  return value;
}

export function parseDateKey(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function daysInMonth(year: number, monthIndex: number): CalendarDay[] {
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const today = toDateKey(new Date());
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1, 12);
    const key = toDateKey(date);
    return { key, date, day: index + 1, weekday: date.getDay(), isToday: key === today, isFuture: key > today };
  });
}

export function shiftMonth(year: number, monthIndex: number, amount: number): { year: number; monthIndex: number } {
  const next = new Date(year, monthIndex + amount, 1, 12);
  return { year: next.getFullYear(), monthIndex: next.getMonth() };
}

export function isoWeekday(date: Date): number {
  return date.getDay() || 7;
}

export function calendarWeekStart(key: DateKey): DateKey {
  const date = parseDateKey(key);
  date.setDate(date.getDate() - isoWeekday(date) + 1);
  return toDateKey(date);
}

export function isHabitScheduled(habit: Habit, key: DateKey): boolean {
  if (habit.status !== 'active' || key < habit.startDate || (habit.endDate && key > habit.endDate)) return false;
  const date = parseDateKey(key);
  if (habit.schedule.type === 'daily') return true;
  if (habit.schedule.type === 'weekdays') return habit.schedule.days.includes(isoWeekday(date));
  return true;
}

export function isExpectedCompletion(habit: Habit, key: DateKey, today: DateKey = toDateKey(new Date())): boolean {
  if (key > today || !isHabitScheduled(habit, key)) return false;
  return true;
}

export function getEntryProgress(habit: Habit, entry?: HabitEntry): number | null {
  if (!entry) return null;
  if (habit.trackingType === 'binary') return entry.completion === 'complete' ? 1 : 0;
  if (!habit.targetValue || entry.value === undefined) return 0;
  return Math.min(1, Math.max(0, entry.value / habit.targetValue));
}

export function getEntryState(habit: Habit, entry?: HabitEntry): 'complete' | 'partial' | 'incomplete' | 'empty' {
  if (!entry) return 'empty';
  if (habit.trackingType === 'measurable') {
    const progress = getEntryProgress(habit, entry) ?? 0;
    return progress >= 1 ? 'complete' : progress > 0 ? 'partial' : 'incomplete';
  }
  return entry.completion === 'complete' ? 'complete' : 'incomplete';
}
