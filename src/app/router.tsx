import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { OverviewPage } from '../features/overview/pages/OverviewPage';
import { HabitsPage } from '../features/habits/pages/HabitsPage';
import { TrackerPage } from '../features/tracker/pages/TrackerPage';
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { AdminPage } from '../features/admin/pages/AdminPage';

export const router = createBrowserRouter([
  { path: '/', element: <AppShell />, children: [
    { index: true, element: <OverviewPage /> },
    { path: 'habits', element: <HabitsPage /> },
    { path: 'tracker', element: <TrackerPage /> },
    { path: 'analytics', element: <AnalyticsPage /> },
    { path: 'settings', element: <SettingsPage /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ] },
  { path: '/admin', element: <AdminLayout />, children: [{ index: true, element: <AdminPage /> }] },
]);
