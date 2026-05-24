import { afterEach, describe, expect, it } from 'vitest';

import { openDatabase, type AppDatabase } from '../db/database.js';
import { runMigrations } from '../db/migrations.js';
import { createTasksRepo } from './tasksRepo.js';
import {
  createTasksService,
  NotFoundError,
  ValidationError,
  type TasksService,
} from './tasksService.js';

let database: AppDatabase | undefined;

function createTestService(): TasksService {
  database = openDatabase(':memory:');
  runMigrations(database);
  return createTasksService(createTasksRepo(database), {
    createId: () => '00000000-0000-4000-8000-000000000301',
    now: () => new Date('2026-05-23T12:00:00.000Z'),
  });
}

afterEach(() => {
  database?.close();
  database = undefined;
});

describe('tasksService', () => {
  it('validates create input and assigns id and timestamps', () => {
    const service = createTestService();
    const task = service.create({
      title: '  Service task  ',
      dueDate: '2026-05-24',
    });

    expect(task).toEqual({
      id: '00000000-0000-4000-8000-000000000301',
      title: 'Service task',
      completed: false,
      dueDate: '2026-05-24',
      createdAt: '2026-05-23T12:00:00.000Z',
      updatedAt: '2026-05-23T12:00:00.000Z',
    });
  });

  it('validates update input and surfaces validation errors', () => {
    const service = createTestService();

    expect(() => service.create({ title: '' })).toThrow(ValidationError);
    expect(() => service.update('00000000-0000-4000-8000-000000000999', {})).toThrow(
      ValidationError,
    );
    expect(() => service.get('   ')).toThrow(ValidationError);
  });

  it('surfaces not-found errors for missing tasks', () => {
    const service = createTestService();
    const missingId = '00000000-0000-4000-8000-000000000999';

    expect(() => service.get(missingId)).toThrow(NotFoundError);
    expect(() => service.update(missingId, { title: 'Missing' })).toThrow(NotFoundError);
    expect(() => service.delete(missingId)).toThrow(NotFoundError);
  });

  it('updates, lists, and deletes existing tasks', () => {
    const service = createTestService();
    const task = service.create({
      title: 'Service task',
    });

    expect(service.update(task.id, { completed: true })).toMatchObject({
      completed: true,
    });
    expect(service.list({ completed: true })).toHaveLength(1);
    service.delete(task.id);
    expect(service.list()).toHaveLength(0);
  });
});
