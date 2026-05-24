import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { Task } from '@zeroclaw/shared';
import type { TaskUpdate } from '@zeroclaw/shared';

import {
  type TaskListFilter,
  type TaskListSort,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from '../../api';

const DELETE_UNDO_MS = 5_000;

function todayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

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

function isTaskOverdue(task: Task): boolean {
  return Boolean(task.dueDate && !task.completed && task.dueDate < todayDateString());
}

type TaskMetaProps = {
  controlsDisabled: boolean;
  isOverdue: boolean;
  onUpdate: (id: string, input: TaskUpdate) => void;
  task: Task;
};

function TaskMeta({ controlsDisabled, isOverdue, onUpdate, task }: TaskMetaProps) {
  return (
    <div className="mt-2 flex flex-wrap items-end gap-3 text-sm text-slate-500">
      <label className="block">
        <span className="block text-xs font-medium text-slate-500">Due date</span>
        <input
          aria-label={`Due date for "${task.title}"`}
          className={
            isOverdue
              ? 'mt-1 block rounded-md border border-red-300 bg-red-50 px-2 py-1 text-red-950 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/20'
              : 'mt-1 block rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20'
          }
          disabled={controlsDisabled}
          type="date"
          value={task.dueDate ?? ''}
          onChange={(event) =>
            onUpdate(task.id, {
              dueDate: event.target.value || null,
            })
          }
        />
      </label>

      {task.dueDate ? (
        <button
          aria-label={`Clear due date for "${task.title}"`}
          className="rounded-md px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/30 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={controlsDisabled}
          type="button"
          onClick={() => onUpdate(task.id, { dueDate: null })}
        >
          Clear
        </button>
      ) : null}

      {isOverdue ? (
        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
          Overdue
        </span>
      ) : null}

      {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : <span>No due date</span>}
      <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
    </div>
  );
}

type TaskItemProps = {
  controlsDisabled: boolean;
  onDelete: () => void;
  onUpdate: (id: string, input: TaskUpdate) => void;
  task: Task;
};

function TaskItem({ controlsDisabled, onDelete, onUpdate, task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const overdue = isTaskOverdue(task);

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
    <li
      className={
        overdue
          ? 'flex items-start gap-4 bg-red-50/60 px-4 py-4 sm:px-5'
          : 'flex items-start gap-4 px-4 py-4 sm:px-5'
      }
    >
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
        <TaskMeta
          controlsDisabled={controlsDisabled}
          isOverdue={overdue}
          task={task}
          onUpdate={onUpdate}
        />
      </div>

      <button
        className="rounded-md px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-400"
        disabled={controlsDisabled}
        type="button"
        onClick={onDelete}
      >
        Delete
      </button>
    </li>
  );
}

type UndoToastProps = {
  task: Task;
  onUndo: () => void;
};

function UndoToast({ onUndo, task }: UndoToastProps) {
  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-10 rounded-lg border border-slate-700 bg-slate-950 p-4 text-white shadow-lg sm:left-auto sm:w-96"
      role="status"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 text-sm">
          Deleted <span className="font-semibold">&quot;{task.title}&quot;</span>.
        </p>
        <button
          className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
          type="button"
          onClick={onUndo}
        >
          Undo
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading tasks"
      className="rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="space-y-0 divide-y divide-slate-100">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-start gap-4 px-4 py-4 sm:px-5">
            <div className="mt-1 h-5 w-5 rounded border border-slate-200 bg-slate-100" />
            <div className="min-w-0 flex-1">
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 flex gap-3">
                <div className="h-8 w-36 rounded bg-slate-100" />
                <div className="h-8 w-20 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only">Loading tasks...</p>
    </section>
  );
}

type TaskListViewProps = {
  filter?: TaskListFilter;
  sort?: TaskListSort;
};

export function TaskListView({ filter = {}, sort = {} }: TaskListViewProps) {
  const tasksQuery = useTasks(filter, sort);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutationError = updateTask.error ?? deleteTask.error;
  const controlsDisabled = updateTask.isPending || deleteTask.isPending || Boolean(pendingDelete);

  function clearDeleteTimer() {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
  }

  function commitDelete(task: Task) {
    deleteTask.mutate(task.id, {
      onSettled: () => {
        setPendingDelete((current) => (current?.id === task.id ? null : current));
      },
    });
  }

  function scheduleDelete(task: Task) {
    if (pendingDelete) {
      clearDeleteTimer();
      commitDelete(pendingDelete);
    }

    setPendingDelete(task);
    deleteTimerRef.current = setTimeout(() => {
      deleteTimerRef.current = null;
      commitDelete(task);
    }, DELETE_UNDO_MS);
  }

  function undoDelete() {
    clearDeleteTimer();
    setPendingDelete(null);
  }

  useEffect(() => clearDeleteTimer, []);

  if (tasksQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (tasksQuery.isError) {
    return (
      <section
        className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm"
        role="alert"
      >
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
  const visibleTasks = pendingDelete ? tasks.filter((task) => task.id !== pendingDelete.id) : tasks;

  if (visibleTasks.length === 0 && !pendingDelete) {
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
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          {errorMessage(mutationError)}
        </div>
      ) : null}

      {visibleTasks.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-700 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">No tasks yet.</h2>
          <p className="mt-2 text-sm">New tasks will appear here once they have been added.</p>
        </section>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              controlsDisabled={controlsDisabled}
              task={task}
              onDelete={() => scheduleDelete(task)}
              onUpdate={(id, input) => updateTask.mutate({ id, input })}
            />
          ))}
        </ul>
      )}

      {pendingDelete ? <UndoToast task={pendingDelete} onUndo={undoDelete} /> : null}
    </section>
  );
}
