import { z } from 'zod';

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const TaskDate = z.string().regex(dateOnlyPattern, 'Expected date in YYYY-MM-DD format.');

export const TaskDateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Expected an ISO 8601 date-time string.',
});

const TaskTitle = z.string().trim().min(1, 'Title is required.').max(200, 'Title is too long.');
const NullableTaskDate = TaskDate.nullable();

export const Task = z
  .object({
    id: z.uuid(),
    title: TaskTitle,
    completed: z.boolean(),
    dueDate: NullableTaskDate,
    createdAt: TaskDateTime,
    updatedAt: TaskDateTime,
  })
  .strict();

export type Task = z.infer<typeof Task>;

export const TaskCreate = z
  .object({
    title: TaskTitle,
    completed: z.boolean().optional(),
    dueDate: NullableTaskDate.optional(),
  })
  .strict();

export type TaskCreate = z.infer<typeof TaskCreate>;

const TaskUpdateBase = z
  .object({
    title: TaskTitle.optional(),
    completed: z.boolean().optional(),
    dueDate: NullableTaskDate.optional(),
  })
  .strict();

export const TaskUpdate = TaskUpdateBase.refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  {
    message: 'At least one task field must be provided.',
  },
);

export type TaskUpdate = z.infer<typeof TaskUpdate>;

export const TaskFilter = z
  .object({
    completed: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    dueDateFrom: TaskDate.optional(),
    dueDateTo: TaskDate.optional(),
    overdue: z.boolean().optional(),
  })
  .strict();

export type TaskFilter = z.infer<typeof TaskFilter>;
