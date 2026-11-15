import { Check, Moon, Sun, Monitor, Info } from 'lucide-react';
import { useState } from 'react';
import { useHabitly } from '../../../app/providers/HabitlyContext';
import type { ThemePreference } from '../../../domain/habits/types';
import { PageIntro } from '../../../components/ui/PageIntro';

const themeChoices: { id: ThemePreference; label: string; note: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Soft daylight', note: 'Warm parchment, easy on the eyes.', icon: Sun },
  { id: 'dark', label: 'Evening ink', note: 'A gentle, low-light palette.', icon: Moon },
  { id: 'system', label: 'Follow device', note: 'Match your system preference.', icon: Monitor },
];

export function SettingsPage() {
  const { theme, setTheme, profile } = useHabitly();
  const [timezone, setTimezone] = useState(profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [saved, setSaved] = useState(false);
  const [weeklyNote, setWeeklyNote] = useState(true);

  return <>
    <PageIntro eyebrow="MAKE IT YOURS" title="Settings" description="A few preferences to make Habitly feel like your own." />
    <div className="settings-layout"><nav className="settings-nav" aria-label="Settings sections"><a href="#profile" className="selected">Profile</a><a href="#appearance">Appearance</a><a href="#preferences">Preferences</a><a href="#notifications">Notifications</a></nav><div className="settings-content">
      <section className="settings-section" id="profile"><div className="settings-section-head"><div><p className="eyebrow">YOUR DETAILS</p><h2>Profile</h2></div><span className="demo-note"><Info size={14} /> Preview only</span></div><div className="profile-form"><div className="profile-avatar-large">{profile?.displayName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() ?? '·'}</div><div className="form-two-col"><label className="settings-field">Name<input className="text-input" defaultValue={profile?.displayName ?? ''} placeholder="Your display name" /></label><label className="settings-field">Email address<input className="text-input" type="email" defaultValue={profile?.email ?? ''} placeholder="Email address" /></label></div><div className="settings-actions"><button className="button button-primary" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2400); }}>{saved && <Check size={15} />}{saved ? 'Changes noted in preview' : 'Save preferences'}</button><span>Profile edits are not saved to an account in this preview.</span></div></div></section>
      <section className="settings-section" id="appearance"><div className="settings-section-head"><div><p className="eyebrow">A COMFORTABLE VIEW</p><h2>Appearance</h2></div></div><div className="theme-options">{themeChoices.map(({ id, label, note, icon: Icon }) => <button key={id} className={`theme-option${theme === id ? ' selected' : ''}`} aria-pressed={theme === id} onClick={() => setTheme(id)}><span className="theme-option-icon"><Icon size={18} /></span><span><strong>{label}</strong><small>{note}</small></span><span className="theme-radio">{theme === id && <Check size={12} />}</span></button>)}</div><p className="settings-footnote">Your theme preference is stored in this browser only.</p></section>
      <section className="settings-section" id="preferences"><div className="settings-section-head"><div><p className="eyebrow">TIME & ROUTINE</p><h2>Preferences</h2></div></div><label className="settings-field timezone-field">Timezone<select className="text-input" value={timezone} onChange={event => setTimezone(event.target.value)}><option>Africa/Lagos</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Tokyo</option><option>Australia/Sydney</option></select></label><p className="settings-footnote">The timezone affects when a new day begins for your habit records. This preference is temporary in Phase 1.</p></section>
      <section className="settings-section" id="notifications"><div className="settings-section-head"><div><p className="eyebrow">GENTLE REMINDERS</p><h2>Notifications</h2></div><span className="coming-soon">COMING LATER</span></div><div className="preference-row"><div><strong>Weekly reflection</strong><small>A quiet recap of your week, delivered on Sunday.</small></div><button role="switch" aria-checked={weeklyNote} aria-label="Weekly reflection notifications" className={`switch${weeklyNote ? ' on' : ''}`} onClick={() => setWeeklyNote(v => !v)}><span /></button></div><p className="settings-footnote">This switch is a visual placeholder. Habitly does not send notifications in Phase 1.</p></section>
    </div></div>
  </>;
}
