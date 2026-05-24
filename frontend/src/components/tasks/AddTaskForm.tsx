import { type FormEvent, useState } from 'react';

import { useCreateTask } from '../../api';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Task could not be created.';
}

export function AddTaskForm() {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const createTask = useCreateTask();
  const trimmedTitle = title.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedTitle || createTask.isPending) {
      return;
    }

    createTask.mutate(
      {
        title: trimmedTitle,
        ...(dueDate ? { dueDate } : {}),
      },
      {
        onSuccess: () => {
          setTitle('');
          setDueDate('');
        },
      },
    );
  }

  return (
    <form
      className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Task title</span>
          <input
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20"
            disabled={createTask.isPending}
            maxLength={200}
            name="title"
            placeholder="Add a task"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Due date</span>
          <input
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20"
            disabled={createTask.isPending}
            name="dueDate"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>

        <button
          className="rounded-md bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!trimmedTitle || createTask.isPending}
          type="submit"
        >
          {createTask.isPending ? 'Adding...' : 'Add task'}
        </button>
      </div>

      {createTask.isError ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {errorMessage(createTask.error)}
        </p>
      ) : null}
    </form>
  );
}
