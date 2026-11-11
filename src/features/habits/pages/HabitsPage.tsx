import { Archive, Check, CirclePause, MoreHorizontal, Pencil, Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Habit, HabitStatus } from '../../../domain/habits/types';
import { useHabitly } from '../../../app/providers/HabitlyContext';
import { Button } from '../../../components/ui/Button';
import { PageIntro } from '../../../components/ui/PageIntro';
import { HabitForm } from '../components/HabitForm';

export function HabitsPage() {
  const { habits, addHabit, updateHabit, setHabitStatus } = useHabitly();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<HabitStatus | 'all'>('active');
  const visible = useMemo(() => habits.filter(habit => filter === 'all' || habit.status === filter), [habits, filter]);
  const saveHabit = (habit: Habit) => { (editing ? updateHabit : addHabit)(habit); setEditing(null); setCreating(false); };

  return <>
    <PageIntro eyebrow="YOUR PRACTICE, YOUR WAY" title="My habits" description="Build a rhythm that fits the life you have." action={<Button variant="primary" icon={<Plus size={17} />} onClick={() => setCreating(true)}>New habit</Button>} />
    <div className="habit-toolbar"><div className="filter-tabs" role="group" aria-label="Filter habits">{(['active', 'paused', 'archived', 'all'] as const).map(value => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{value === 'all' ? 'All habits' : value.charAt(0).toUpperCase() + value.slice(1)}<span>{value === 'all' ? habits.length : habits.filter(h => h.status === value).length}</span></button>)}</div><span className="demo-note"><Sparkles size={14} /> Demo data · changes are temporary</span></div>
    <section className="habit-list" aria-label="Habit list">{visible.map(habit => <HabitCard key={habit.id} habit={habit} onEdit={() => setEditing(habit)} onStatus={status => setHabitStatus(habit.id, status)} />)}{visible.length === 0 && <div className="empty-state habit-empty"><Sparkles size={20} /><h3>No {filter === 'all' ? '' : filter} habits yet</h3><p>{filter === 'active' ? 'A gentle routine can start with just one thing.' : 'Your habits will appear here as you update their status.'}</p><Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>Create a habit</Button></div>}</section>
    <aside className="habit-tip"><span className="tip-mark">✳</span><div><strong>Make it easy to begin.</strong><p>A habit is a promise, not a performance. Start smaller than you think you need to.</p></div></aside>
    {(creating || editing) && <HabitForm habit={editing ?? undefined} onSave={saveHabit} onClose={() => { setCreating(false); setEditing(null); }} />}
  </>;
}

function HabitCard({ habit, onEdit, onStatus }: { habit: Habit; onEdit: () => void; onStatus: (status: HabitStatus) => void }) {
  const schedule = habit.schedule.type === 'daily' ? 'Every day' : habit.schedule.type === 'weekly' ? `${habit.schedule.timesPerWeek} times each week` : `${habit.schedule.days.length} days each week`;
  return <article className={`habit-card habit-${habit.status}`}><div className="habit-card-marker"><span className={`habit-marker category-marker-${habit.category.toLowerCase()}`}>{habit.category === 'Movement' ? 'M' : habit.category === 'Learning' ? 'L' : habit.category === 'Mindfulness' ? '✳' : habit.category === 'Wellbeing' ? 'W' : 'P'}</span></div><div className="habit-card-main"><div className="habit-card-title"><h2>{habit.name}</h2><span className={`status-pill status-${habit.status}`}>{habit.status === 'active' ? <Check size={11} /> : habit.status === 'paused' ? <CirclePause size={11} /> : <Archive size={11} />}{habit.status}</span></div><p>{habit.description || 'A small promise to yourself.'}</p><div className="habit-card-meta"><span>{habit.category}</span><i /> <span>{schedule}</span><i /> <span>{habit.trackingType === 'binary' ? 'Done / not yet' : `${habit.targetValue} ${habit.unit}`}</span></div></div><div className="habit-card-actions"><button className="icon-button" aria-label={`Edit ${habit.name}`} onClick={onEdit}><Pencil size={16} /></button><div className="action-menu-wrap"><details className="action-menu"><summary aria-label={`More actions for ${habit.name}`}><MoreHorizontal size={18} /></summary><div className="action-menu-popover">{habit.status !== 'paused' && habit.status !== 'archived' && <button onClick={() => onStatus('paused')}><CirclePause size={14} /> Pause habit</button>}{habit.status === 'paused' && <button onClick={() => onStatus('active')}><Check size={14} /> Resume habit</button>}{habit.status !== 'archived' && <button onClick={() => onStatus('archived')}><Archive size={14} /> Archive habit</button>}{habit.status === 'archived' && <button onClick={() => onStatus('active')}><Check size={14} /> Restore habit</button>}</div></details></div></div></article>;
}
