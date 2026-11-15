import { lazy, Suspense, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { createAppRouter } from './router';

const PreviewApp = import.meta.env.DEV
  ? lazy(() => import('../preview/PreviewApp').then(module => ({ default: module.PreviewApp })))
  : null;

export function App() {
  const [router] = useState(createAppRouter);
  const demoPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'demo';
  if (demoPreview && PreviewApp) return <Suspense fallback={null}><PreviewApp /></Suspense>;
  return <AppProviders><RouterProvider router={router} /></AppProviders>;
}
