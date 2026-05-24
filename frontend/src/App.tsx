import { useState } from 'react';

import type { TaskListFilter, TaskListSort } from './api';
import { AddTaskForm } from './components/tasks/AddTaskForm';
import { FilterBar, SortControls } from './components/tasks/TaskControls';
import { TaskListView } from './components/tasks/TaskListView';

export function App() {
  const [filter, setFilter] = useState<TaskListFilter>({ bucket: 'all', status: 'all' });
  const [sort, setSort] = useState<TaskListSort>({ direction: 'desc', field: 'createdAt' });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-sm font-semibold text-slate-600">ZeroClaw Tasks</p>
          <h1 className="mt-2 text-3xl font-bold">Tasks</h1>
        </header>
        <AddTaskForm />
        <FilterBar filter={filter} onChange={setFilter} />
        <SortControls sort={sort} onChange={setSort} />
        <TaskListView filter={filter} sort={sort} />
      </section>
    </main>
  );
}
