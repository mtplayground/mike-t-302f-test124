import { Task as TaskSchema, type Task, type TaskCreate, type TaskUpdate } from '@zeroclaw/shared';

export type TaskListStatus = 'all' | 'active' | 'completed';
export type TaskListBucket = 'all' | 'overdue' | 'today' | 'upcoming' | 'none';
export type TaskSortField = 'createdAt' | 'updatedAt' | 'title' | 'dueDate';
export type TaskSortDirection = 'asc' | 'desc';

export type TaskListFilter = {
  status?: TaskListStatus;
  bucket?: TaskListBucket;
};

export type TaskListSort = {
  field?: TaskSortField;
  direction?: TaskSortDirection;
};

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessageFromBody(body: unknown, fallback: string): string {
  if (!isRecord(body)) {
    return fallback;
  }

  const error = body.error;

  if (!isRecord(error) || typeof error.message !== 'string') {
    return fallback;
  }

  return error.message;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(response.status, 'API returned invalid JSON.', text);
  }
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<unknown> {
  const headers = new Headers({
    Accept: 'application/json',
  });
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    signal: options.signal,
  };

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, init);
  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, errorMessageFromBody(body, response.statusText), body);
  }

  return body;
}

function readResponseObject(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    throw new ApiError(0, 'API returned an unexpected response shape.', body);
  }

  return body;
}

function readTaskResponse(body: unknown): Task {
  const response = readResponseObject(body);
  return TaskSchema.parse(response.task);
}

function readTasksResponse(body: unknown): Task[] {
  const response = readResponseObject(body);
  return TaskSchema.array().parse(response.tasks);
}

function taskListQuery(filter: TaskListFilter = {}, sort: TaskListSort = {}): string {
  const params = new URLSearchParams();

  if (filter.status && filter.status !== 'all') {
    params.set('status', filter.status);
  }

  if (filter.bucket && filter.bucket !== 'all') {
    params.set('bucket', filter.bucket);
  }

  if (sort.field) {
    params.set('sort', `${sort.field}:${sort.direction ?? 'asc'}`);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listTasks(
  filter: TaskListFilter = {},
  sort: TaskListSort = {},
  signal?: AbortSignal,
): Promise<Task[]> {
  return readTasksResponse(
    await apiRequest(`/api/tasks${taskListQuery(filter, sort)}`, { signal }),
  );
}

export async function createTask(input: TaskCreate): Promise<Task> {
  return readTaskResponse(
    await apiRequest('/api/tasks', {
      method: 'POST',
      body: input,
    }),
  );
}

export async function updateTask(id: string, input: TaskUpdate): Promise<Task> {
  return readTaskResponse(
    await apiRequest(`/api/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    }),
  );
}

export async function deleteTask(id: string): Promise<void> {
  await apiRequest(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
