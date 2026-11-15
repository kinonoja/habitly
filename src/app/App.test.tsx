import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('Habitly frontend', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    window.history.replaceState({}, '', '/');
  });
  afterEach(cleanup);

  it('renders the overview and navigates to the monthly tracker', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /good (morning|afternoon|evening)\./i })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: /monthly tracker/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Monthly tracker' })).toBeInTheDocument());
    expect(screen.getByRole('table', { name: /monthly habit tracker/i })).toBeInTheDocument();
  });

  it('starts with an empty normal workspace and no demo profile', async () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Local workspace' })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: /my habits/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'No active habits yet' })).toBeInTheDocument());
    expect(screen.queryByText('Read a little')).not.toBeInTheDocument();
    expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument();
  });

  it('loads demo fixtures only in the explicit development preview', async () => {
    window.history.replaceState({}, '', '/?preview=demo');
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /good (morning|afternoon|evening), alex/i })).toBeInTheDocument());
    expect(screen.getByText('Read a little')).toBeInTheDocument();
    expect(screen.getByText('Demo data')).toBeInTheDocument();
  });

  it('switches and persists the selected theme', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'dark'));
    expect(localStorage.getItem('habitly-theme')).toBe('dark');
    fireEvent.click(screen.getByRole('link', { name: /settings/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /evening ink/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows an honest empty analytics state without zeroed fake metrics', async () => {
    render(<App />);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: /insights/i }));
    await waitFor(() => expect(screen.getByText(/once you add a habit and record progress/i)).toBeInTheDocument());
    expect(screen.queryByText(/consistency this month/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/current best streak/i)).not.toBeInTheDocument();
  });

  it('renders a clearly identified admin preview and its user table', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /admin preview/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /good morning, admin/i })).toBeInTheDocument());
    expect(screen.getByRole('table', { name: /recent users/i })).toBeInTheDocument();
    expect(screen.getByText(/authorization is not implemented/i)).toBeInTheDocument();
  });
});
