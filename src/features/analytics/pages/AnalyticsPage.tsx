import { ArrowDownRight, ArrowUpRight, CalendarRange, Flame, Info, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useHabitly } from '../../../app/providers/HabitlyContext';
import { getEntryProgress, isExpectedCompletion, toDateKey } from '../../../domain/dates/calendar';
import type { Habit, HabitEntry } from '../../../domain/habits/types';
import { PageIntro } from '../../../components/ui/PageIntro';

export function AnalyticsPage() {
  const { habits, entries } = useHabitly();
  const today = toDateKey(new Date());
  const monthStart = new Date(); monthStart.setDate(1);
  const keys = Array.from({ length: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate() }, (_, i) => toDateKey(new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1, 12))).filter(key => key <= today);
  const active = habits.filter(h => h.status === 'active');
  const totals = useMemo(() => {
    const expected = active.flatMap(habit => keys.filter(key => isExpectedCompletion(habit, key)).map(key => ({ habit, key })));
    const completed = expected.filter(({ habit, key }) => getEntryProgress(habit, entries.find(e => e.habitId === habit.id && e.date === key)) === 1).length;
    return { expected: expected.length, completed, rate: expected.length ? Math.round(completed / expected.length * 100) : 0 };
  }, [active, entries, keys]);
  const weeks = Array.from({ length: 5 }, (_, weekIndex) => {
    const range = keys.slice(weekIndex * 7, weekIndex * 7 + 7);
    if (!range.length) return null;
    const expected = active.flatMap(h => range.filter(day => isExpectedCompletion(h, day)).map(day => ({ h, day })));
    const completed = expected.filter(({ h, day }) => getEntryProgress(h, entries.find(e => e.habitId === h.id && e.date === day)) === 1).length;
    return { label: `Week ${weekIndex + 1}`, rate: expected.length ? Math.round(completed / expected.length * 100) : 0, expected: expected.length };
  }).filter((value): value is NonNullable<typeof value> => Boolean(value));
  const weekdayStats = Array.from({ length: 7 }, (_, weekday) => {
    const weekdayKeys = keys.filter(key => new Date(`${key}T12:00:00`).getDay() === weekday);
    const expected = active.flatMap(h => weekdayKeys.filter(day => isExpectedCompletion(h, day)).map(day => ({ h, day })));
    const complete = expected.filter(({ h, day }) => getEntryProgress(h, entries.find(e => e.habitId === h.id && e.date === day)) === 1).length;
    return { name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekday], rate: expected.length ? Math.round(complete / expected.length * 100) : 0, active: expected.length > 0 };
  });
  const habitStats = active.map(habit => {
    const expected = keys.filter(key => isExpectedCompletion(habit, key));
    const complete = expected.filter(key => getEntryProgress(habit, entries.find(e => e.habitId === habit.id && e.date === key)) === 1).length;
    return { habit, expected: expected.length, complete, rate: expected.length ? Math.round(complete / expected.length * 100) : 0 };
  });
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date());

  if (!habits.length) return <>
    <PageIntro eyebrow="PATTERNS, NOT PRESSURE" title="Your insights" description="A thoughtful look at the rhythm you are building." action={<span className="date-range-label"><CalendarRange size={16} /> {monthLabel} to date</span>} />
    <section className="analytics-panel empty-state"><h3>Your story is still unfolding</h3><p>Once you add a habit and record progress, your insights will appear here.</p></section>
  </>;

  return <>
    <PageIntro eyebrow="PATTERNS, NOT PRESSURE" title="Your insights" description="A thoughtful look at the rhythm you are building." action={<span className="date-range-label"><CalendarRange size={16} /> {monthLabel} to date</span>} />
    <div className="analytics-metrics"><Metric label="Consistency this month" value={`${totals.rate}%`} note={`${totals.completed} of ${totals.expected} scheduled practices`} icon={<Sparkles size={16} />} /><Metric label="Active practices" value={String(active.length).padStart(2, '0')} note="Habits currently in your routine" icon={<Info size={16} />} /><Metric label="Current best streak" value={`${getStreak(active, entries, today)} days`} note="Consecutive days with a completed habit" icon={<Flame size={16} />} /></div>
    <div className="analytics-grid"><section className="analytics-panel trend-panel"><div className="analytics-panel-head"><div><p className="eyebrow">A STEADY RHYTHM</p><h2>Consistency over the month</h2><p>Scheduled practices completed by week</p></div><span className="chart-period">{monthLabel}</span></div><div className="trend-chart" role="img" aria-label={`Weekly completion rates: ${weeks.map(w => `${w.label} ${w.rate}%`).join(', ')}`}><div className="chart-y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-plot"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><div className="trend-columns">{weeks.map(week => <div key={week.label} className="trend-column"><div className="trend-bar" style={{ height: `${Math.max(week.rate, week.expected ? 2 : 0)}%` }}><span>{week.expected ? `${week.rate}%` : '—'}</span></div><small>{week.label}</small></div>)}</div></div></div><p className="chart-caption">Completion is calculated from habits scheduled through today. Future dates and rest days are excluded.</p></section>
      <section className="analytics-panel weekday-panel"><div className="analytics-panel-head"><div><p className="eyebrow">WHEN IT FEELS NATURAL</p><h2>Your week, at a glance</h2></div></div><div className="weekday-bars" role="img" aria-label={`Completion by weekday: ${weekdayStats.map(day => `${day.name} ${day.rate}%`).join(', ')}`}>{weekdayStats.map(day => <div className={`weekday-column${!day.active ? ' no-schedule' : ''}`} key={day.name}><div className="weekday-track"><span style={{ height: `${day.active ? Math.max(day.rate, 4) : 0}%` }} /></div><small>{day.name}</small><b>{day.active ? `${day.rate}%` : '—'}</b></div>)}</div><p className="chart-caption">Look for the days when your routines feel easiest to keep.</p></section>
    </div>
    <section className="analytics-panel habit-performance"><div className="analytics-panel-head"><div><p className="eyebrow">PRACTICE BY PRACTICE</p><h2>How each habit is taking shape</h2></div><span className="table-caption">{monthLabel} · scheduled days only</span></div>{habitStats.length ? <div className="performance-table"><div className="performance-row performance-head"><span>HABIT</span><span>CONSISTENCY</span><span>KEPT</span><span>THIS MONTH</span></div>{habitStats.map(({ habit, expected, complete, rate }) => <div className="performance-row" key={habit.id}><span className="performance-name"><i className={`habit-row-marker category-marker-${habit.category.toLowerCase()}`} /><strong>{habit.name}</strong></span><span className="performance-progress"><i><b style={{ width: `${rate}%` }} /></i><strong>{rate}%</strong></span><span>{complete} <small>/ {expected}</small></span><span className="performance-trend">{rate >= 70 ? <><ArrowUpRight size={15} /> In rhythm</> : <><ArrowDownRight size={15} /> Finding a pace</>}</span></div>)}</div> : <div className="empty-state"><h3>Your story is still unfolding</h3><p>Once you add a habit, you will see its progress here.</p></div>}<p className="calculation-note"><Info size={14} /> Consistency = completed scheduled days ÷ expected scheduled days so far this month. Incomplete measurable entries count toward progress but not completed days until the target is met.</p></section>
  </>;
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: ReactNode }) {
  return <article className="metric-card"><div className="metric-icon">{icon}</div><p className="eyebrow">{label}</p><strong>{value}</strong><span>{note}</span></article>;
}

function getStreak(habits: Habit[], entries: HabitEntry[], today: ReturnType<typeof toDateKey>) {
  let best = 0;
  for (const habit of habits) {
    let streak = 0;
    for (let offset = 0; offset < 90; offset += 1) {
      const day = new Date(`${today}T12:00:00`); day.setDate(day.getDate() - offset);
      const key = toDateKey(day);
      if (!isExpectedCompletion(habit, key)) continue;
      if (getEntryProgress(habit, entries.find(entry => entry.habitId === habit.id && entry.date === key)) === 1) streak += 1;
      else if (streak) break;
    }
    best = Math.max(best, streak);
  }
  return best;
}
