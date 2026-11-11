import { ArrowLeft, ArrowRight, Check, Circle, Minus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useHabitly } from '../../../app/providers/HabitlyContext';
import { getEntryState, isHabitScheduled, shiftMonth, toDateKey, daysInMonth } from '../../../domain/dates/calendar';
import type { DateKey, Habit } from '../../../domain/habits/types';
import { PageIntro } from '../../../components/ui/PageIntro';

export function TrackerPage() {
  const { habits, entries, recordAtDate } = useHabitly();
  const today = toDateKey(new Date());
  const [month, setMonth] = useState(() => ({ year: new Date().getFullYear(), monthIndex: new Date().getMonth() }));
  const calendar = useMemo(() => daysInMonth(month.year, month.monthIndex), [month]);
  const visibleHabits = habits.filter(h => h.status !== 'archived');
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(month.year, month.monthIndex, 1));

  const cellText = (habit: Habit, key: DateKey) => {
    if (key > today) return 'Future date';
    if (habit.status === 'paused') return 'Habit paused';
    if (key < habit.startDate || (habit.endDate && key > habit.endDate)) return 'Outside active period';
    if (!isHabitScheduled(habit, key)) return 'Scheduled rest day';
    const entry = entries.find(item => item.habitId === habit.id && item.date === key);
    const state = getEntryState(habit, entry);
    if (state === 'complete') return habit.trackingType === 'measurable' ? `Complete, ${entry?.value} ${habit.unit}` : 'Completed';
    if (state === 'partial') return `Partially complete, ${entry?.value} of ${habit.targetValue} ${habit.unit}`;
    return entry ? 'Not completed' : 'No entry recorded';
  };

  const onCell = (habit: Habit, key: DateKey) => {
    const entry = entries.find(item => item.habitId === habit.id && item.date === key);
    if (habit.trackingType === 'binary') { recordAtDate(habit, key, entry?.completion !== 'complete'); return; }
    const current = entry?.value ?? 0;
    const next = current >= (habit.targetValue ?? 1) ? 0 : current === 0 ? Math.ceil((habit.targetValue ?? 1) / 2) : habit.targetValue;
    recordAtDate(habit, key, next ?? 0);
  };

  return <>
    <PageIntro eyebrow="THE PRACTICE, OVER TIME" title="Monthly tracker" description="A quiet record of the days you showed up." />
    <section className="tracker-shell" aria-label="Monthly habit tracker">
      <div className="tracker-toolbar"><div className="month-control"><button className="icon-button" aria-label="Previous month" onClick={() => setMonth(current => shiftMonth(current.year, current.monthIndex, -1))}><ArrowLeft size={17} /></button><h2>{monthLabel}</h2><button className="icon-button" aria-label="Next month" onClick={() => setMonth(current => shiftMonth(current.year, current.monthIndex, 1))}><ArrowRight size={17} /></button><button className="today-button" onClick={() => setMonth({ year: new Date().getFullYear(), monthIndex: new Date().getMonth() })}><RotateCcw size={13} /> Today</button></div><div className="tracker-legend"><span><i className="legend-complete"><Check size={10} /></i> Complete</span><span><i className="legend-partial"><span /></i> In progress</span><span><i className="legend-rest"><Minus size={10} /></i> Rest day</span></div></div>
      <div className="tracker-scroll" tabIndex={0} aria-label="Scrollable monthly tracker"><table className="tracker-table" aria-label="Monthly habit tracker"><thead><tr><th className="habit-col-head" scope="col">HABIT <span>· {visibleHabits.length}</span></th>{calendar.map((day, index) => <th key={day.key} scope="col" className={`${day.isToday ? 'today-col' : ''} ${index === 0 || day.date.getDay() === 1 ? 'week-start' : ''}`}><span className="day-name">{new Intl.DateTimeFormat('en', { weekday: 'narrow' }).format(day.date)}</span><span className="day-num">{day.day}</span></th>)}</tr></thead><tbody>{visibleHabits.map(habit => <tr key={habit.id}><th scope="row" className="habit-sticky"><span className={`habit-row-marker category-marker-${habit.category.toLowerCase()}`} /> <span className="tracker-habit-name"><strong>{habit.name}</strong><small>{habit.category}</small></span></th>{calendar.map((day, index) => {
            const dateKey = day.key;
            const inactive = habit.status === 'paused' || dateKey < habit.startDate || Boolean(habit.endDate && dateKey > habit.endDate);
            const scheduled = isHabitScheduled(habit, dateKey);
            const future = dateKey > today;
            const entry = entries.find(item => item.habitId === habit.id && item.date === dateKey);
            const state = getEntryState(habit, entry);
            const isRest = !inactive && !future && !scheduled;
            const disabled = inactive || future || isRest;
            return <td key={dateKey} className={`${day.isToday ? 'today-col' : ''} ${index === 0 || day.date.getDay() === 1 ? 'week-start' : ''}`}><button type="button" className={`tracker-cell state-${state}${isRest ? ' state-rest' : ''}${future ? ' state-future' : ''}${inactive ? ' state-inactive' : ''}`} aria-label={`${habit.name}, ${new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(day.date)}: ${cellText(habit, dateKey)}`} title={cellText(habit, dateKey)} disabled={disabled} onClick={() => onCell(habit, dateKey)}>{state === 'complete' ? <Check size={12} strokeWidth={2.4} /> : state === 'partial' ? <span className="partial-mark" /> : isRest ? <Minus size={11} /> : !disabled ? <Circle size={10} /> : null}</button></td>;
          })}</tr>)}</tbody></table>{visibleHabits.length === 0 && <div className="empty-state"><h3>Your tracker is ready</h3><p>Add an active habit to start building a visible rhythm.</p></div>}</div>
      <div className="tracker-foot"><span>Each mark belongs to a day. Rest days and days before a habit began are left quiet.</span><span>{monthLabel} <i>·</i> {calendar.length} days</span></div>
    </section>
    <p className="tracker-hint"><span className="hint-star">✳</span> Select a past or present day to update its record. Future and non-scheduled days stay inactive.</p>
  </>;
}
