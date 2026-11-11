import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Habit, HabitCategory, HabitSchedule, TrackingType } from '../../../domain/habits/types';
import { parseDateInput, toDateKey } from '../../../domain/dates/calendar';
import { Button } from '../../../components/ui/Button';

interface HabitFormProps { habit?: Habit; onSave: (habit: Habit) => void; onClose: () => void }
const categories: HabitCategory[] = ['Wellbeing', 'Learning', 'Movement', 'Mindfulness', 'Personal'];
const weekdays = [{ label: 'M', day: 1 }, { label: 'T', day: 2 }, { label: 'W', day: 3 }, { label: 'T', day: 4 }, { label: 'F', day: 5 }, { label: 'S', day: 6 }, { label: 'S', day: 0 }];

export function HabitForm({ habit, onSave, onClose }: HabitFormProps) {
  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [category, setCategory] = useState<HabitCategory>(habit?.category ?? 'Wellbeing');
  const [trackingType, setTrackingType] = useState<TrackingType>(habit?.trackingType ?? 'binary');
  const [target, setTarget] = useState(String(habit?.targetValue ?? ''));
  const [unit, setUnit] = useState(habit?.unit ?? '');
  const [scheduleType, setScheduleType] = useState<HabitSchedule['type']>(habit?.schedule.type ?? 'daily');
  const [selectedDays, setSelectedDays] = useState<number[]>(habit?.schedule.type === 'weekdays' ? habit.schedule.days : [1, 2, 3, 4, 5]);
  const [weeklyCount, setWeeklyCount] = useState(habit?.schedule.type === 'weekly' ? habit.schedule.timesPerWeek : 3);
  const [startDate, setStartDate] = useState(habit?.startDate ?? toDateKey(new Date()));
  const [endDate, setEndDate] = useState(habit?.endDate ?? '');
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.getElementById('habit-name')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], summary')];
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedTarget = Number(target);
    const parsedEndDate = parseDateInput(endDate);
    if (!name.trim()) { setError('Give your habit a name to continue.'); return; }
    if (endDate && !parsedEndDate) { setError('Enter a valid end date.'); return; }
    if (parsedEndDate && parsedEndDate < startDate) { setError('The end date must be on or after the start date.'); return; }
    if (trackingType === 'measurable' && (!Number.isFinite(parsedTarget) || parsedTarget <= 0 || !unit.trim())) { setError('Add a target above zero and a unit of measure.'); return; }
    if (scheduleType === 'weekdays' && selectedDays.length === 0) { setError('Choose at least one day.'); return; }
    const schedule: HabitSchedule = scheduleType === 'daily' ? { type: 'daily' } : scheduleType === 'weekly' ? { type: 'weekly', timesPerWeek: weeklyCount } : { type: 'weekdays', days: selectedDays };
    onSave({ id: habit?.id ?? `habit-${crypto.randomUUID()}`, name: name.trim(), description: description.trim(), category, trackingType, targetValue: trackingType === 'measurable' ? parsedTarget : undefined, unit: trackingType === 'measurable' ? unit.trim() : undefined, schedule, startDate, endDate: parsedEndDate, status: habit?.status ?? 'active', createdAt: habit?.createdAt ?? new Date().toISOString() });
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialogRef} className="habit-modal" role="dialog" aria-modal="true" aria-labelledby="habit-form-title"><div className="modal-head"><div><p className="eyebrow">A NEW PRACTICE</p><h2 id="habit-form-title">{habit ? 'Refine your habit' : 'Begin with one small thing'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close form"><X size={20} /></button></div><form onSubmit={submit}>
    <label className="field-label" htmlFor="habit-name">Name your habit</label><input id="habit-name" className="text-input" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Take an evening walk" maxLength={60} />
    <label className="field-label" htmlFor="habit-description">A little context <span>Optional</span></label><textarea id="habit-description" className="text-input text-area" value={description} onChange={event => setDescription(event.target.value)} placeholder="Why does this matter to you?" rows={2} maxLength={140} />
    <div className="form-two-col"><div><label className="field-label" htmlFor="habit-category">Category</label><select id="habit-category" className="text-input" value={category} onChange={event => setCategory(event.target.value as HabitCategory)}>{categories.map(option => <option key={option}>{option}</option>)}</select></div><div><span className="field-label">How will you track it?</span><div className="segmented-control" role="group" aria-label="Tracking type"><button type="button" className={trackingType === 'binary' ? 'selected' : ''} onClick={() => setTrackingType('binary')}>Done / not yet</button><button type="button" className={trackingType === 'measurable' ? 'selected' : ''} onClick={() => setTrackingType('measurable')}>By a number</button></div></div></div>
    {trackingType === 'measurable' && <div className="form-two-col"><div><label className="field-label" htmlFor="habit-target">Daily target</label><input id="habit-target" type="number" min="0.01" step="any" className="text-input" value={target} onChange={event => setTarget(event.target.value)} placeholder="20" /></div><div><label className="field-label" htmlFor="habit-unit">Unit</label><input id="habit-unit" className="text-input" value={unit} onChange={event => setUnit(event.target.value)} placeholder="pages, minutes…" maxLength={20} /></div></div>}
    <div className="form-two-col"><div><label className="field-label" htmlFor="habit-start">Start date</label><input id="habit-start" type="date" className="text-input" value={startDate} onChange={event => setStartDate(event.target.value as typeof startDate)} required /></div><div><label className="field-label" htmlFor="habit-end">End date <span>Optional</span></label><input id="habit-end" type="date" className="text-input" value={endDate} onChange={event => setEndDate(event.target.value)} min={startDate} /></div></div>
    <div className="schedule-head"><span className="field-label">When will you practice?</span><div className="schedule-options"><label><input type="radio" name="schedule" checked={scheduleType === 'daily'} onChange={() => setScheduleType('daily')} /> Every day</label><label><input type="radio" name="schedule" checked={scheduleType === 'weekdays'} onChange={() => setScheduleType('weekdays')} /> Selected days</label><label><input type="radio" name="schedule" checked={scheduleType === 'weekly'} onChange={() => setScheduleType('weekly')} /> Times per week</label></div></div>
    {scheduleType === 'weekdays' && <div className="weekday-picker" aria-label="Choose days of the week">{weekdays.map(({ label, day }, index) => <button type="button" key={`${day}-${index}`} aria-label={['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day]} aria-pressed={selectedDays.includes(day)} className={selectedDays.includes(day) ? 'picked' : ''} onClick={() => setSelectedDays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day])}>{label}</button>)}</div>}
    {scheduleType === 'weekly' && <div className="weekly-target"><span>Flexible days</span><input aria-label="Practices per week" type="number" min="1" max="7" value={weeklyCount} onChange={event => setWeeklyCount(Math.min(7, Math.max(1, Number(event.target.value))))} /><span>times each week</span></div>}
    {error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><Button type="button" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{habit ? 'Save changes' : 'Create habit'}</Button></div>
  </form></section></div>;
}
