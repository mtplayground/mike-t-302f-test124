import {
  Task as TaskSchema,
  TaskFilter as TaskFilterSchema,
  type Task,
  type TaskCreate,
  type TaskFilter,
  type TaskUpdate,
} from '@zeroclaw/shared';

import type { AppDatabase } from '../db/database.js';

type TaskRow = {
  id: string;
  title: string;
  completed: 0 | 1;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskSortField = 'createdAt' | 'updatedAt' | 'title' | 'dueDate';
export type TaskSortDirection = 'asc' | 'desc';

export type TaskSort = {
  field?: TaskSortField;
  direction?: TaskSortDirection;
};

export type TaskInsert = Required<TaskCreate> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskPatch = TaskUpdate & {
  updatedAt: string;
};

const sortColumns = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  title: 'title',
  dueDate: 'due_date',
} satisfies Record<TaskSortField, string>;

function mapTaskRow(row: TaskRow): Task {
  return TaskSchema.parse({
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function escapeLike(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

function readSortField(field: TaskSortField | undefined): TaskSortField {
  if (!field) {
    return 'createdAt';
  }

  if (field in sortColumns) {
    return field;
  }

  throw new Error(`Unsupported task sort field: ${field}`);
}

function readSortDirection(direction: TaskSortDirection | undefined): 'ASC' | 'DESC' {
  if (!direction || direction === 'desc') {
    return 'DESC';
  }

  if (direction === 'asc') {
    return 'ASC';
  }

  throw new Error(`Unsupported task sort direction: ${direction}`);
}

function buildListQuery(filter: TaskFilter = {}, sort: TaskSort = {}) {
  const parsedFilter = TaskFilterSchema.parse(filter);
  const where: string[] = [];
  const params: Record<string, string | number> = {};

  if (parsedFilter.completed !== undefined) {
    where.push('completed = @completed');
    params.completed = parsedFilter.completed ? 1 : 0;
  }

  if (parsedFilter.search) {
    where.push("title LIKE @search ESCAPE '\\'");
    params.search = `%${escapeLike(parsedFilter.search)}%`;
  }

  if (parsedFilter.dueDateFrom) {
    where.push('due_date >= @dueDateFrom');
    params.dueDateFrom = parsedFilter.dueDateFrom;
  }

  if (parsedFilter.dueDateTo) {
    where.push('due_date <= @dueDateTo');
    params.dueDateTo = parsedFilter.dueDateTo;
  }

  if (parsedFilter.dueDateMissing) {
    where.push('due_date IS NULL');
  }

  if (parsedFilter.overdue) {
    where.push("due_date IS NOT NULL AND due_date < date('now') AND completed = 0");
  }

  const sortField = readSortField(sort.field);
  const sortDirection = readSortDirection(sort.direction);
  const orderBy = `${sortColumns[sortField]} ${sortDirection}, id ASC`;
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  return {
    sql: `
      SELECT id, title, completed, due_date, created_at, updated_at
      FROM tasks
      ${whereClause}
      ORDER BY ${orderBy}
    `,
    params,
  };
}

export function createTasksRepo(database: AppDatabase) {
  const getTask = database.prepare('SELECT * FROM tasks WHERE id = ?');
  const insertTask = database.prepare(`
    INSERT INTO tasks (id, title, completed, due_date, created_at, updated_at)
    VALUES (@id, @title, @completed, @dueDate, @createdAt, @updatedAt)
  `);
  const deleteTask = database.prepare('DELETE FROM tasks WHERE id = ?');

  return {
    list(filter: TaskFilter = {}, sort: TaskSort = {}): Task[] {
      const query = buildListQuery(filter, sort);
      const rows = database.prepare(query.sql).all(query.params) as TaskRow[];

      return rows.map(mapTaskRow);
    },

    get(id: string): Task | null {
      const row = getTask.get(id) as TaskRow | undefined;

      return row ? mapTaskRow(row) : null;
    },

    create(input: TaskInsert): Task {
      insertTask.run({
        id: input.id,
        title: input.title,
        completed: input.completed ? 1 : 0,
        dueDate: input.dueDate,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      });

      const task = this.get(input.id);

      if (!task) {
        throw new Error(`Failed to read task after insert: ${input.id}`);
      }

      return task;
    },

    update(id: string, input: TaskPatch): Task | null {
      const assignments: string[] = [];
      const params: Record<string, string | number | null> = { id };

      if (input.title !== undefined) {
        assignments.push('title = @title');
        params.title = input.title;
      }

      if (input.completed !== undefined) {
        assignments.push('completed = @completed');
        params.completed = input.completed ? 1 : 0;
      }

      if (input.dueDate !== undefined) {
        assignments.push('due_date = @dueDate');
        params.dueDate = input.dueDate;
      }

      assignments.push('updated_at = @updatedAt');
      params.updatedAt = input.updatedAt;

      database.prepare(`UPDATE tasks SET ${assignments.join(', ')} WHERE id = @id`).run(params);

      return this.get(id);
    },

    delete(id: string): boolean {
      const result = deleteTask.run(id);

      return result.changes > 0;
    },
  };
}

export type TasksRepo = ReturnType<typeof createTasksRepo>;
