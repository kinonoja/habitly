import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { OverviewPage } from '../features/overview/pages/OverviewPage';
import { HabitsPage } from '../features/habits/pages/HabitsPage';
import { TrackerPage } from '../features/tracker/pages/TrackerPage';
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';

const AdminLayoutPreview = import.meta.env.DEV
  ? lazy(() => import('../features/admin/components/AdminLayout').then(module => ({ default: module.AdminLayout })))
  : null;
const AdminPagePreview = import.meta.env.DEV
  ? lazy(() => import('../features/admin/pages/AdminPage').then(module => ({ default: module.AdminPage })))
  : null;

export function createAppRouter() {
  return createBrowserRouter([
  { path: '/', element: <AppShell />, children: [
    { index: true, element: <OverviewPage /> },
    { path: 'habits', element: <HabitsPage /> },
    { path: 'tracker', element: <TrackerPage /> },
    { path: 'analytics', element: <AnalyticsPage /> },
    { path: 'settings', element: <SettingsPage /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ] },
  { path: '/admin', element: AdminLayoutPreview ? <Suspense fallback={null}><AdminLayoutPreview /></Suspense> : <Navigate to="/" replace />, children: [{ index: true, element: AdminPagePreview ? <Suspense fallback={null}><AdminPagePreview /></Suspense> : null }] },
  ]);
}
