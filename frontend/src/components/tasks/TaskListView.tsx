import { type KeyboardEvent, useEffect, useState } from 'react';
import type { Task } from '@zeroclaw/shared';
import type { TaskUpdate } from '@zeroclaw/shared';

import { useDeleteTask, useTasks, useUpdateTask } from '../../api';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function TaskMeta({ task }: { task: Task }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
      {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : <span>No due date</span>}
      <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
    </div>
  );
}

type TaskItemProps = {
  controlsDisabled: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, input: TaskUpdate) => void;
  task: Task;
};

function TaskItem({ controlsDisabled, onDelete, onUpdate, task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(task.title);
    }
  }, [isEditing, task.title]);

  function startEditing() {
    if (!controlsDisabled) {
      setIsEditing(true);
    }
  }

  function cancelEditing() {
    setDraftTitle(task.title);
    setIsEditing(false);
  }

  function saveEditing() {
    const nextTitle = draftTitle.trim();

    if (!nextTitle || nextTitle === task.title) {
      cancelEditing();
      return;
    }

    setIsEditing(false);
    onUpdate(task.id, { title: nextTitle });
  }

  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEditing();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  return (
    <li className="flex items-start gap-4 px-4 py-4 sm:px-5">
      <input
        aria-label={`Mark "${task.title}" as ${task.completed ? 'active' : 'completed'}`}
        checked={task.completed}
        className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
        disabled={controlsDisabled}
        type="checkbox"
        onChange={() =>
          onUpdate(task.id, {
            completed: !task.completed,
          })
        }
      />

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            aria-label={`Edit title for "${task.title}"`}
            autoFocus
            className="block w-full rounded-md border border-slate-300 px-2 py-1 font-medium text-slate-950 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20"
            maxLength={200}
            type="text"
            value={draftTitle}
            onBlur={saveEditing}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={handleTitleKeyDown}
          />
        ) : (
          <button
            className={
              task.completed
                ? 'block break-words text-left font-medium text-slate-500 line-through outline-none hover:text-slate-700 focus:rounded-sm focus:ring-2 focus:ring-slate-950/30'
                : 'block break-words text-left font-medium text-slate-950 outline-none hover:text-slate-700 focus:rounded-sm focus:ring-2 focus:ring-slate-950/30'
            }
            disabled={controlsDisabled}
            type="button"
            onClick={startEditing}
          >
            {task.title}
          </button>
        )}
        <TaskMeta task={task} />
      </div>

      <button
        className="rounded-md px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-400"
        disabled={controlsDisabled}
        type="button"
        onClick={() => onDelete(task.id)}
      >
        Delete
      </button>
    </li>
  );
}

export function TaskListView() {
  const tasksQuery = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const mutationError = updateTask.error ?? deleteTask.error;
  const controlsDisabled = updateTask.isPending || deleteTask.isPending;

  if (tasksQuery.isLoading) {
    return (
      <section
        aria-busy="true"
        className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700 shadow-sm"
      >
        <p className="font-medium">Loading tasks...</p>
      </section>
    );
  }

  if (tasksQuery.isError) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm">
        <h2 className="text-lg font-semibold">Tasks could not be loaded.</h2>
        <p className="mt-2 text-sm text-red-800">{errorMessage(tasksQuery.error)}</p>
        <button
          className="mt-4 rounded-md bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          type="button"
          onClick={() => void tasksQuery.refetch()}
        >
          Retry
        </button>
      </section>
    );
  }

  const tasks = tasksQuery.data ?? [];

  if (tasks.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-700 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">No tasks yet.</h2>
        <p className="mt-2 text-sm">New tasks will appear here once they have been added.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Task list">
      {mutationError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {errorMessage(mutationError)}
        </div>
      ) : null}

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            controlsDisabled={controlsDisabled}
            task={task}
            onDelete={(id) => deleteTask.mutate(id)}
            onUpdate={(id, input) => updateTask.mutate({ id, input })}
          />
        ))}
      </ul>
    </section>
  );
}
