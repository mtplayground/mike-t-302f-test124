import { afterEach, describe, expect, it } from 'vitest';

import { openDatabase, type AppDatabase } from '../db/database.js';
import { runMigrations } from '../db/migrations.js';
import { createTasksRepo, type TaskInsert, type TasksRepo } from './tasksRepo.js';

const baseTask = {
  completed: false,
  dueDate: null,
  createdAt: '2026-05-23T12:00:00.000Z',
  updatedAt: '2026-05-23T12:00:00.000Z',
} satisfies Omit<TaskInsert, 'id' | 'title'>;

let database: AppDatabase | undefined;

function createTestRepo(): TasksRepo {
  database = openDatabase(':memory:');
  runMigrations(database);
  return createTasksRepo(database);
}

function insertTask(
  repo: TasksRepo,
  input: Pick<TaskInsert, 'id' | 'title'> & Partial<TaskInsert>,
) {
  return repo.create({
    ...baseTask,
    ...input,
  });
}

afterEach(() => {
  database?.close();
  database = undefined;
});

describe('tasksRepo', () => {
  it('creates, reads, updates, and deletes tasks with mapped fields', () => {
    const repo = createTestRepo();
    const created = insertTask(repo, {
      id: '00000000-0000-4000-8000-000000000101',
      title: 'Write repo test',
    });

    expect(created).toMatchObject({
      title: 'Write repo test',
      completed: false,
      dueDate: null,
    });
    expect(repo.get(created.id)).toEqual(created);

    const updated = repo.update(created.id, {
      title: 'Write better repo test',
      completed: true,
      dueDate: '2026-05-24',
      updatedAt: '2026-05-23T13:00:00.000Z',
    });

    expect(updated).toMatchObject({
      title: 'Write better repo test',
      completed: true,
      dueDate: '2026-05-24',
      updatedAt: '2026-05-23T13:00:00.000Z',
    });
    expect(repo.delete(created.id)).toBe(true);
    expect(repo.get(created.id)).toBeNull();
    expect(repo.delete(created.id)).toBe(false);
  });

  it('filters and sorts task lists', () => {
    const repo = createTestRepo();

    insertTask(repo, {
      id: '00000000-0000-4000-8000-000000000201',
      title: 'Alpha task',
      dueDate: '2026-05-24',
      createdAt: '2026-05-23T10:00:00.000Z',
      updatedAt: '2026-05-23T10:00:00.000Z',
    });
    insertTask(repo, {
      id: '00000000-0000-4000-8000-000000000202',
      title: 'Beta task',
      completed: true,
      dueDate: '2026-05-25',
      createdAt: '2026-05-23T11:00:00.000Z',
      updatedAt: '2026-05-23T11:00:00.000Z',
    });
    insertTask(repo, {
      id: '00000000-0000-4000-8000-000000000203',
      title: 'Gamma note',
      dueDate: null,
      createdAt: '2026-05-23T09:00:00.000Z',
      updatedAt: '2026-05-23T09:00:00.000Z',
    });
    insertTask(repo, {
      id: '00000000-0000-4000-8000-000000000204',
      title: 'Old task',
      dueDate: '2000-01-01',
      createdAt: '2026-05-23T08:00:00.000Z',
      updatedAt: '2026-05-23T08:00:00.000Z',
    });

    expect(
      repo
        .list({ completed: false }, { field: 'title', direction: 'asc' })
        .map((task) => task.title),
    ).toEqual(['Alpha task', 'Gamma note', 'Old task']);
    expect(repo.list({ search: 'beta' }).map((task) => task.title)).toEqual(['Beta task']);
    expect(repo.list({ dueDateFrom: '2026-05-24', dueDateTo: '2026-05-24' })).toHaveLength(1);
    expect(repo.list({ dueDateMissing: true }).map((task) => task.title)).toEqual(['Gamma note']);
    expect(repo.list({ overdue: true }).map((task) => task.title)).toEqual(['Old task']);
    expect(
      repo.list({}, { field: 'createdAt', direction: 'asc' }).map((task) => task.title),
    ).toEqual(['Old task', 'Gamma note', 'Alpha task', 'Beta task']);
  });
});
