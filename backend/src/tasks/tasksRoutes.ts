import { Router, type NextFunction, type Request, type Response } from 'express';

import { ValidationError, type TasksService, type ValidationIssue } from './tasksService.js';
import type { TaskSort, TaskSortDirection, TaskSortField } from './tasksRepo.js';

type QueryValue = Request['query'][string];

const statusValues = ['all', 'active', 'completed'] as const;
const bucketValues = ['all', 'overdue', 'today', 'upcoming', 'none'] as const;
const sortFields = ['createdAt', 'updatedAt', 'title', 'dueDate'] as const;
const sortDirections = ['asc', 'desc'] as const;

type TaskStatus = (typeof statusValues)[number];
type TaskBucket = (typeof bucketValues)[number];

function validationError(message: string, path: string[], issueMessage = message): ValidationError {
  const issue: ValidationIssue = {
    path,
    message: issueMessage,
  };

  return new ValidationError(message, [issue]);
}

function readSingleQueryValue(value: QueryValue, name: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw validationError(`Invalid ${name} query parameter.`, [name], `${name} must appear once.`);
  }

  if (typeof value !== 'string') {
    throw validationError(`Invalid ${name} query parameter.`, [name], `${name} must be a string.`);
  }

  return value;
}

function readEnum<T extends readonly string[]>(
  value: string | undefined,
  allowedValues: T,
  name: string,
  fallback: T[number],
): T[number] {
  if (!value) {
    return fallback;
  }

  if (allowedValues.includes(value)) {
    return value;
  }

  throw validationError(
    `Invalid ${name} query parameter.`,
    [name],
    `${name} must be one of: ${allowedValues.join(', ')}.`,
  );
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function parseFilter(query: Request['query']) {
  const status = readEnum(
    readSingleQueryValue(query.status, 'status'),
    statusValues,
    'status',
    'all',
  ) as TaskStatus;
  const bucket = readEnum(
    readSingleQueryValue(query.bucket, 'bucket'),
    bucketValues,
    'bucket',
    'all',
  ) as TaskBucket;
  const today = new Date();
  const todayDate = toDateOnly(today);
  const tomorrowDate = toDateOnly(addDays(today, 1));
  const filter: Record<string, boolean | string> = {};

  if (status === 'active') {
    filter.completed = false;
  }

  if (status === 'completed') {
    filter.completed = true;
  }

  if (bucket === 'overdue') {
    filter.overdue = true;
  }

  if (bucket === 'today') {
    filter.dueDateFrom = todayDate;
    filter.dueDateTo = todayDate;
  }

  if (bucket === 'upcoming') {
    filter.dueDateFrom = tomorrowDate;
  }

  if (bucket === 'none') {
    filter.dueDateMissing = true;
  }

  return filter;
}

function readSortField(value: string): TaskSortField {
  if (sortFields.includes(value as TaskSortField)) {
    return value as TaskSortField;
  }

  throw validationError(
    'Invalid sort query parameter.',
    ['sort'],
    `sort field must be one of: ${sortFields.join(', ')}.`,
  );
}

function readSortDirection(value: string | undefined): TaskSortDirection {
  if (!value) {
    return 'asc';
  }

  if (sortDirections.includes(value as TaskSortDirection)) {
    return value as TaskSortDirection;
  }

  throw validationError(
    'Invalid sort query parameter.',
    ['sort'],
    `sort direction must be one of: ${sortDirections.join(', ')}.`,
  );
}

function parseSort(query: Request['query']): TaskSort {
  const sort = readSingleQueryValue(query.sort, 'sort');

  if (!sort) {
    return {};
  }

  if (sort.startsWith('-')) {
    return {
      field: readSortField(sort.slice(1)),
      direction: 'desc',
    };
  }

  const [field, direction] = sort.split(':', 2);

  if (!field) {
    throw validationError('Invalid sort query parameter.', ['sort'], 'sort field is required.');
  }

  return {
    field: readSortField(field),
    direction: readSortDirection(direction),
  };
}

function readRouteId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== 'string') {
    throw validationError('Invalid task id.', ['id'], 'Task id is required.');
  }

  return id;
}

function route(handler: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

export function createTasksRouter(tasksService: TasksService) {
  const router = Router();

  router.get(
    '/',
    route((req, res) => {
      res.status(200).json({
        tasks: tasksService.list(parseFilter(req.query), parseSort(req.query)),
      });
    }),
  );

  router.post(
    '/',
    route((req, res) => {
      res.status(201).json({
        task: tasksService.create(req.body),
      });
    }),
  );

  router.get(
    '/:id',
    route((req, res) => {
      res.status(200).json({
        task: tasksService.get(readRouteId(req)),
      });
    }),
  );

  router.patch(
    '/:id',
    route((req, res) => {
      res.status(200).json({
        task: tasksService.update(readRouteId(req), req.body),
      });
    }),
  );

  router.delete(
    '/:id',
    route((req, res) => {
      tasksService.delete(readRouteId(req));
      res.status(204).send();
    }),
  );

  return router;
}
