import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, ArrowUpRight, BookOpenCheck, CalendarDays, ChartNoAxesColumnIncreasing, CircleHelp, Leaf, Menu, Moon, Settings2, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { useHabitly } from '../../app/providers/HabitlyContext';

const navItems = [
  { to: '/', label: 'Overview', icon: Activity, end: true },
  { to: '/habits', label: 'My habits', icon: BookOpenCheck },
  { to: '/tracker', label: 'Monthly tracker', icon: CalendarDays },
  { to: '/analytics', label: 'Insights', icon: ChartNoAxesColumnIncreasing },
];

export function AppShell() {
  const { setTheme, profile, isDemoPreview } = useHabitly();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const pageName = navItems.find(item => item.to === location.pathname)?.label ?? 'Settings';
  const toggleTheme = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  const initials = profile?.displayName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() ?? '·';

  return <div className="app-frame">
    <button className="mobile-menu button button-quiet" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
    {menuOpen && <button aria-label="Close navigation" className="nav-scrim" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <NavLink className="brand" to="/" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Leaf size={18} strokeWidth={1.7} /></span><span>habitly</span><span className="brand-period">.</span></NavLink>
      <div className="workspace-label">YOUR SPACE</div>
      <nav className="primary-nav" aria-label="Main navigation">{navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={18} strokeWidth={1.7} /><span>{label}</span>{label === 'Monthly tracker' && <span className="nav-new">01</span>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-icon"><CircleHelp size={16} /></span><span><strong>A little at a time.</strong><small>Consistency grows quietly.</small></span></div>
        <NavLink to="/settings" className={({ isActive }) => `nav-link settings-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}><Settings2 size={18} strokeWidth={1.7} /><span>Settings</span></NavLink>
        {!isDemoPreview && <a href="/?preview=demo" className="admin-shortcut">Demo preview <ArrowUpRight size={14} /></a>}
        <NavLink to="/admin" className="admin-shortcut" onClick={() => setMenuOpen(false)}>Admin preview <ArrowUpRight size={14} /></NavLink>
        <button className="profile-chip" type="button" aria-label={profile ? `Profile, ${profile.displayName}` : 'Local workspace'}><span className="avatar">{initials}</span><span className="profile-copy"><strong>{profile?.displayName ?? 'Your workspace'}</strong><small>{isDemoPreview ? 'Demo preview' : 'Local session · not synced'}</small></span><span className="profile-more">···</span></button>
      </div>
    </aside>
    <main className="main-area">
      <div className="topbar"><div className="breadcrumbs"><span>My space</span><span className="crumb-separator">/</span><strong>{pageName}</strong></div><div className="topbar-right">{isDemoPreview && <span className="demo-badge"><span /> Demo data</span>}<button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">{document.documentElement.dataset.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button><span className="topbar-date">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span></div></div>
      <div className="page-content"><Outlet /></div>
      <footer className="app-footer"><span>Habitly <span className="footer-dot">·</span> a practice, made visible</span><span>{isDemoPreview ? 'Demo preview · changes live in this session' : 'Local workspace · changes live in this session only'}</span></footer>
    </main>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">{navItems.filter(item => item.to !== '/analytics').map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} aria-label={label} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}><Icon size={19} /><span>{label === 'Monthly tracker' ? 'Tracker' : label === 'My habits' ? 'Habits' : label}</span></NavLink>)}</nav>
  </div>;
}
