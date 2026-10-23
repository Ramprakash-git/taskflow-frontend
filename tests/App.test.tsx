import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../src/App';

describe('TaskFlow application', () => {
  it('renders the dashboard and task list', () => {
    render(<App />);

    expect(screen.getByText('Your tasks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument();
  });

  it('filters tasks by status', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Done' }));

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.length).toBeGreaterThan(0);

    rows.forEach((row) => {
      expect(within(row).getByRole('combobox')).toHaveValue('Done');
    });
  });

  it('searches for tasks', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search tasks' }), {
      target: { value: 'nonexistent-task-xyz' },
    });

    expect(screen.getByText('No tasks found')).toBeInTheDocument();
  });

  it('updates a task status', () => {
    render(<App />);

    const statusSelects = screen.getAllByRole('combobox');
    fireEvent.change(statusSelects[0], { target: { value: 'Done' } });

    expect(statusSelects[0]).toHaveValue('Done');
    expect(screen.getByText('Task status updated')).toBeInTheDocument();
  });
});
