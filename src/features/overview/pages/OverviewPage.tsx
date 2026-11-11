import { ArrowRight, ArrowUpRight, Check, ChevronRight, Circle, Clock3, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { demoProfile } from '../../../domain/habits/demo';
import { getEntryProgress, isHabitScheduled, toDateKey } from '../../../domain/dates/calendar';
import { useHabitly } from '../../../app/providers/HabitlyContext';
import { PageIntro } from '../../../components/ui/PageIntro';

export function OverviewPage() {
  const { habits, entries, recordProgress } = useHabitly();
  const today = toDateKey(new Date());
  const dayHabits = habits.filter(h => isHabitScheduled(h, today));
  const complete = dayHabits.filter(h => getEntryProgress(h, entries.find(e => e.habitId === h.id && e.date === today)) === 1).length;
  const completion = dayHabits.length ? Math.round((complete / dayHabits.length) * 100) : 0;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const currentDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return <>
    <PageIntro eyebrow={currentDate} title={`${greeting}, ${demoProfile.name.split(' ')[0]}.`} description="A few small promises to yourself, kept one day at a time." action={<Link className="text-link" to="/habits"><span>Shape your routine</span><ArrowRight size={16} /></Link>} />
    <section className="today-layout" aria-labelledby="today-title">
      <div className="today-main">
        <div className="section-heading"><div><p className="eyebrow">YOUR DAILY PRACTICE</p><h2 id="today-title">Today, in its own time</h2></div><span className="count-label">{complete} <span>of</span> {dayHabits.length} complete</span></div>
        <div className="daily-list">{dayHabits.map((habit, index) => {
          const entry = entries.find(e => e.habitId === habit.id && e.date === today);
          const progress = getEntryProgress(habit, entry) ?? 0;
          const done = progress >= 1;
          return <article className={`daily-row${done ? ' is-done' : ''}`} key={habit.id}>
            <button type="button" className={`check-control${done ? ' checked' : ''}`} aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${habit.name}`} onClick={() => recordProgress(habit, habit.targetValue)}>{done ? <Check size={15} /> : <Circle size={19} strokeWidth={1.5} />}</button>
            <div className="daily-copy"><div className="habit-name-line"><h3>{habit.name}</h3><span className={`category-tag category-${habit.category.toLowerCase()}`}>{habit.category}</span></div><p>{habit.description}</p></div>
            <div className="daily-meta">{habit.trackingType === 'measurable' ? <><span className="measure-value">{entry?.value ?? 0}<small> / {habit.targetValue} {habit.unit}</small></span><div className="mini-progress" role="progressbar" aria-label={`${habit.name} progress`} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress * 100}%` }} /></div></> : <span className="binary-label">{done ? 'Kept today' : 'A small step'}</span>}</div>
            <button className="row-arrow" aria-label={`Update ${habit.name}`} onClick={() => recordProgress(habit, habit.targetValue)}><ChevronRight size={17} /></button>
            <span className="row-index">0{index + 1}</span>
          </article>;
        })}{dayHabits.length === 0 && <div className="empty-state"><Sparkles size={20} /><h3>A little room to begin</h3><p>Add a habit that matters to you. The smallest first step counts.</p><Link to="/habits" className="text-link">Create your first habit <ArrowRight size={15} /></Link></div>}</div>
        <div className="daily-list-footer"><span><Clock3 size={14} /> Your pace is the right pace.</span><Link to="/habits">See all habits <ArrowRight size={14} /></Link></div>
      </div>
      <aside className="today-aside">
        <section className="consistency-panel" aria-label="Today's progress">
          <div className="consistency-top"><span className="eyebrow">A MOMENTUM CHECK</span><ArrowUpRight size={16} /></div>
          <div className="progress-ring-wrap"><svg viewBox="0 0 120 120" className="progress-ring" role="img" aria-label={`${completion}% of today's scheduled habits complete`}><circle cx="60" cy="60" r="48" className="ring-track" /><circle cx="60" cy="60" r="48" className="ring-value" style={{ strokeDasharray: `${completion * 3.016} 302` }} /></svg><div className="ring-label"><strong>{completion}<small>%</small></strong><span>of today</span></div></div>
          <p className="consistency-message">{completion === 100 ? 'You showed up for yourself.' : complete > 0 ? 'Good things are taking shape.' : 'There is time for a beginning.'}</p>
          <span className="panel-rule" />
          <div className="panel-foot"><span>Today's practice</span><strong>{complete} <small>/ {dayHabits.length}</small></strong></div>
        </section>
        <section className="note-panel"><div className="note-top"><span className="eyebrow">A THOUGHT TO KEEP</span><Sparkles size={15} /></div><blockquote>“The secret of getting ahead is getting started.”</blockquote><cite>Mark Twain</cite><span className="note-ornament" aria-hidden="true">✳</span></section>
      </aside>
    </section>
    <section className="overview-lower"><div className="week-summary"><div className="section-heading compact"><div><p className="eyebrow">A WIDER VIEW</p><h2>This week, so far</h2></div><Link to="/analytics" className="text-link">Your insights <ArrowRight size={15} /></Link></div><div className="week-bars" aria-label="Weekly habit completion"><span className="week-day"><i style={{ height: '56%' }} /><small>M</small></span><span className="week-day"><i style={{ height: '78%' }} /><small>T</small></span><span className="week-day"><i style={{ height: '40%' }} /><small>W</small></span><span className="week-day"><i style={{ height: '92%' }} /><small>T</small></span><span className="week-day today"><i style={{ height: `${Math.max(12, completion)}%` }} /><small>F</small></span><span className="week-day future"><i style={{ height: '8%' }} /><small>S</small></span><span className="week-day future"><i style={{ height: '8%' }} /><small>S</small></span></div><div className="week-legend"><span><i /> Completed days</span><span>This is a rhythm, not a score.</span></div></div><Link className="add-habit-prompt" to="/habits"><span className="add-prompt-icon"><Plus size={19} /></span><span><strong>Make room for a new ritual</strong><small>Start with something small and specific.</small></span><ArrowRight size={17} /></Link></section>
  </>;
}
