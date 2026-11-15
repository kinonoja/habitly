import { parseDateInput } from '../dates/calendar';
import type { Habit, HabitCompletion, HabitSchedule, UserPreferences, UserProfile } from './types';

export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

function result(errors: string[]): ValidationResult {
  return errors.length ? { valid: false, errors } : { valid: true };
}

export function validateProfile(profile: UserProfile): ValidationResult {
  const errors: string[] = [];
  if (!profile.id.trim()) errors.push('Profile owner is required.');
  if (!profile.displayName.trim()) errors.push('Display name is required.');
  if (!isValidTimezone(profile.timezone)) errors.push('Timezone must be a valid IANA identifier.');
  if (!isUtcTimestamp(profile.createdAt) || !isUtcTimestamp(profile.updatedAt)) errors.push('Profile timestamps must be UTC instants.');
  if (!Number.isInteger(profile.revision) || profile.revision < 0) errors.push('Revision must be a non-negative integer.');
  return result(errors);
}

export function validateHabit(habit: Habit): ValidationResult {
  const errors: string[] = [];
  if (!habit.id.trim() || !habit.ownerId.trim()) errors.push('Habit and owner IDs are required.');
  if (!habit.name.trim()) errors.push('Habit name is required.');
  if (!parseDateInput(habit.startDate)) errors.push('Start date must be a valid calendar date.');
  if (habit.endDate && !parseDateInput(habit.endDate)) errors.push('End date must be a valid calendar date.');
  if (habit.endDate && habit.endDate < habit.startDate) errors.push('End date cannot be before start date.');
  if (habit.trackingType === 'measurable' && (!Number.isFinite(habit.targetValue) || (habit.targetValue ?? 0) <= 0 || !habit.unit?.trim())) errors.push('Measurable habits need a positive target and unit.');
  if (habit.schedule.type === 'weekdays' && (!habit.schedule.days.length || habit.schedule.days.some(day => !Number.isInteger(day) || day < 1 || day > 7))) errors.push('Selected days must use ISO weekdays from 1 through 7.');
  if (habit.schedule.type === 'weekly' && (!Number.isInteger(habit.schedule.timesPerWeek) || habit.schedule.timesPerWeek < 1 || habit.schedule.timesPerWeek > 7)) errors.push('Weekly target must be between 1 and 7.');
  if (!isUtcTimestamp(habit.createdAt) || !isUtcTimestamp(habit.updatedAt)) errors.push('Habit timestamps must be UTC instants.');
  if (!Number.isInteger(habit.revision) || habit.revision < 0) errors.push('Revision must be a non-negative integer.');
  return result(errors);
}

export function validateSchedule(schedule: HabitSchedule): ValidationResult {
  const errors: string[] = [];
  if (!schedule.id.trim() || !schedule.ownerId.trim() || !schedule.habitId.trim()) errors.push('Schedule, owner, and habit IDs are required.');
  if (!isUtcTimestamp(schedule.updatedAt)) errors.push('Schedule timestamp must be a UTC instant.');
  if (!Number.isInteger(schedule.revision) || schedule.revision < 0) errors.push('Revision must be a non-negative integer.');
  return result(errors);
}

export function validateCompletion(completion: HabitCompletion): ValidationResult {
  const errors: string[] = [];
  if (!completion.id.trim() || !completion.ownerId.trim() || !completion.habitId.trim()) errors.push('Completion, owner, and habit IDs are required.');
  if (!parseDateInput(completion.date)) errors.push('Completion date must be a valid calendar date.');
  if (completion.value !== undefined && (!Number.isFinite(completion.value) || completion.value < 0)) errors.push('Completion value must be a non-negative number.');
  if (!isUtcTimestamp(completion.createdAt) || !isUtcTimestamp(completion.updatedAt)) errors.push('Completion timestamps must be UTC instants.');
  if (!Number.isInteger(completion.revision) || completion.revision < 0) errors.push('Revision must be a non-negative integer.');
  return result(errors);
}

export function validatePreferences(preferences: UserPreferences): ValidationResult {
  const errors: string[] = [];
  if (!preferences.userId.trim()) errors.push('Preference owner is required.');
  if (!isUtcTimestamp(preferences.createdAt) || !isUtcTimestamp(preferences.updatedAt)) errors.push('Preference timestamps must be UTC instants.');
  if (!Number.isInteger(preferences.revision) || preferences.revision < 0) errors.push('Revision must be a non-negative integer.');
  return result(errors);
}

function isUtcTimestamp(value: string): boolean {
  return /^\d{4}-\d\d-\d\dT.*Z$/.test(value) && Number.isFinite(Date.parse(value));
}

function isValidTimezone(value: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; }
  catch { return false; }
}
