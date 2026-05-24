import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

const task = {
  id: '018f4477-3d07-7d8c-9c41-13d9340d98a2',
  title: 'Ship issue 14',
  completed: false,
  dueDate: null,
  createdAt: '2026-05-24T00:00:00.000Z',
  updatedAt: '2026-05-24T00:00:00.000Z',
};

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return render(<App />, { wrapper: Wrapper });
}

describe('App', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the task list empty state', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ tasks: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    renderApp();

    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    expect(await screen.findByText('No tasks yet.')).toBeInTheDocument();
  });

  it('renders tasks and calls completion and delete endpoints', async () => {
    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (method === 'PATCH') {
        return Promise.resolve(
          new Response(JSON.stringify({ task: { ...task, completed: true } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      if (method === 'DELETE') {
        return Promise.resolve(new Response(null, { status: 204 }));
      }

      return Promise.resolve(
        new Response(JSON.stringify({ tasks: [task] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    renderApp();

    expect(await screen.findByText('Ship issue 14')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark "Ship issue 14" as completed' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/018f4477-3d07-7d8c-9c41-13d9340d98a2',
        expect.objectContaining({
          body: JSON.stringify({ completed: true }),
          method: 'PATCH',
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/018f4477-3d07-7d8c-9c41-13d9340d98a2',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });

  it('creates a task with an optional due date and clears the form', async () => {
    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (method === 'POST') {
        return Promise.resolve(
          new Response(JSON.stringify({ task: { ...task, title: 'Write issue 15' } }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ tasks: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    renderApp();

    const titleInput = await screen.findByLabelText('Task title');
    const dueDateInput = screen.getByLabelText('Due date');

    fireEvent.change(titleInput, { target: { value: '  Write issue 15  ' } });
    fireEvent.change(dueDateInput, { target: { value: '2026-05-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          body: JSON.stringify({ title: 'Write issue 15', dueDate: '2026-05-30' }),
          method: 'POST',
        }),
      );
    });

    await waitFor(() => {
      expect(titleInput).toHaveValue('');
      expect(dueDateInput).toHaveValue('');
    });
  });

  it('saves an edited task title on blur', async () => {
    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (method === 'PATCH') {
        return Promise.resolve(
          new Response(JSON.stringify({ task: { ...task, title: 'Ship edited title' } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ tasks: [task] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Ship issue 14' }));
    const titleInput = screen.getByLabelText('Edit title for "Ship issue 14"');

    fireEvent.change(titleInput, { target: { value: '  Ship edited title  ' } });
    fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/018f4477-3d07-7d8c-9c41-13d9340d98a2',
        expect.objectContaining({
          body: JSON.stringify({ title: 'Ship edited title' }),
          method: 'PATCH',
        }),
      );
    });
  });

  it('saves an edited task title on Enter', async () => {
    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (method === 'PATCH') {
        return Promise.resolve(
          new Response(JSON.stringify({ task: { ...task, title: 'Ship with enter' } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ tasks: [task] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Ship issue 14' }));
    const titleInput = screen.getByLabelText('Edit title for "Ship issue 14"');

    fireEvent.change(titleInput, { target: { value: 'Ship with enter' } });
    fireEvent.keyDown(titleInput, { key: 'Enter' });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/018f4477-3d07-7d8c-9c41-13d9340d98a2',
        expect.objectContaining({
          body: JSON.stringify({ title: 'Ship with enter' }),
          method: 'PATCH',
        }),
      );
    });
  });

  it('cancels an edited task title on Escape', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ tasks: [task] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Ship issue 14' }));
    const titleInput = screen.getByLabelText('Edit title for "Ship issue 14"');

    fireEvent.change(titleInput, { target: { value: 'Do not save this' } });
    fireEvent.keyDown(titleInput, { key: 'Escape' });

    expect(await screen.findByRole('button', { name: 'Ship issue 14' })).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([, init]) => (init as RequestInit | undefined)?.method === 'PATCH',
      ),
    ).toBe(false);
  });

  it('sets a task due date from the row date picker', async () => {
    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (method === 'PATCH') {
        return Promise.resolve(
          new Response(JSON.stringify({ task: { ...task, dueDate: '2026-06-01' } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ tasks: [task] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    renderApp();

    const dueDateInput = await screen.findByLabelText('Due date for "Ship issue 14"');

    fireEvent.change(dueDateInput, { target: { value: '2026-06-01' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/018f4477-3d07-7d8c-9c41-13d9340d98a2',
        expect.objectContaining({
          body: JSON.stringify({ dueDate: '2026-06-01' }),
          method: 'PATCH',
        }),
      );
    });
  });

  it('marks overdue tasks and clears their due date', async () => {
    const overdueTask = { ...task, dueDate: '2020-01-01' };

    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (method === 'PATCH') {
        return Promise.resolve(
          new Response(JSON.stringify({ task: { ...overdueTask, dueDate: null } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ tasks: [overdueTask] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    renderApp();

    const clearDueDateButton = await screen.findByRole('button', {
      name: 'Clear due date for "Ship issue 14"',
    });

    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);

    fireEvent.click(clearDueDateButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/018f4477-3d07-7d8c-9c41-13d9340d98a2',
        expect.objectContaining({
          body: JSON.stringify({ dueDate: null }),
          method: 'PATCH',
        }),
      );
    });
  });

  it('drives task query params from filter and sort controls', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ tasks: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Active' }));
    fireEvent.change(screen.getByLabelText('Due bucket'), { target: { value: 'overdue' } });
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'dueDate:desc' } });

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => {
          const url = String(input);
          return (
            url === '/api/tasks?status=active&bucket=overdue&sort=dueDate%3Adesc' ||
            url === '/api/tasks?status=active&bucket=overdue&sort=dueDate:desc'
          );
        }),
      ).toBe(true);
    });
  });
});
