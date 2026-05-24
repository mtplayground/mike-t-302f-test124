import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
});
