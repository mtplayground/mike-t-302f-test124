import { randomUUID } from 'node:crypto';

import {
  TaskCreate as TaskCreateSchema,
  TaskFilter as TaskFilterSchema,
  TaskUpdate as TaskUpdateSchema,
  type Task,
  type TaskFilter,
} from '@zeroclaw/shared';
import { z } from 'zod';

import type { TaskSort, TasksRepo } from './tasksRepo.js';

export type ValidationIssue = {
  path: string[];
  message: string;
};

export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';
  readonly status = 400;
  readonly issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND';
  readonly status = 404;

  constructor(message = 'Task not found.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

type TasksServiceOptions = {
  createId?: () => string;
  now?: () => Date;
};

function zodIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
  }));
}

function parseInput<T>(schema: z.ZodType<T>, input: unknown, message: string): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(message, zodIssues(result.error));
  }

  return result.data;
}

function readTaskId(id: string): string {
  const trimmedId = id.trim();

  if (!trimmedId) {
    throw new ValidationError('Invalid task id.', [
      {
        path: ['id'],
        message: 'Task id is required.',
      },
    ]);
  }

  return trimmedId;
}

export function createTasksService(repo: TasksRepo, options: TasksServiceOptions = {}) {
  const createId = options.createId ?? randomUUID;
  const now = options.now ?? (() => new Date());

  function timestamp() {
    return now().toISOString();
  }

  function getExistingTask(id: string): Task {
    const task = repo.get(readTaskId(id));

    if (!task) {
      throw new NotFoundError();
    }

    return task;
  }

  return {
    list(filter: unknown = {}, sort: TaskSort = {}): Task[] {
      const parsedFilter: TaskFilter = parseInput(TaskFilterSchema, filter, 'Invalid task filter.');

      return repo.list(parsedFilter, sort);
    },

    get(id: string): Task {
      return getExistingTask(id);
    },

    create(input: unknown): Task {
      const parsedInput = parseInput(TaskCreateSchema, input, 'Invalid task create input.');
      const createdAt = timestamp();

      return repo.create({
        id: createId(),
        title: parsedInput.title,
        completed: parsedInput.completed ?? false,
        dueDate: parsedInput.dueDate ?? null,
        createdAt,
        updatedAt: createdAt,
      });
    },

    update(id: string, input: unknown): Task {
      const parsedInput = parseInput(TaskUpdateSchema, input, 'Invalid task update input.');
      const task = repo.update(readTaskId(id), {
        ...parsedInput,
        updatedAt: timestamp(),
      });

      if (!task) {
        throw new NotFoundError();
      }

      return task;
    },

    delete(id: string): void {
      const deleted = repo.delete(readTaskId(id));

      if (!deleted) {
        throw new NotFoundError();
      }
    },
  };
}

export type TasksService = ReturnType<typeof createTasksService>;
