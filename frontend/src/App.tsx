import { TaskListView } from './components/tasks/TaskListView';

export function App() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-sm font-semibold text-slate-600">ZeroClaw Tasks</p>
          <h1 className="mt-2 text-3xl font-bold">Tasks</h1>
        </header>
        <TaskListView />
      </section>
    </main>
  );
}
