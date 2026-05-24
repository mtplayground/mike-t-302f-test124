import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TaskCreate, TaskUpdate } from '@zeroclaw/shared';

import {
  createTask,
  deleteTask,
  listTasks,
  type TaskListFilter,
  type TaskListSort,
  updateTask,
} from './client';

type UpdateTaskVariables = {
  id: string;
  input: TaskUpdate;
};

export const taskQueryKeys = {
  all: ['tasks'] as const,
  list: (filter: TaskListFilter, sort: TaskListSort) =>
    [...taskQueryKeys.all, 'list', filter, sort] as const,
};

export function useTasks(filter: TaskListFilter = {}, sort: TaskListSort = {}) {
  return useQuery({
    queryKey: taskQueryKeys.list(filter, sort),
    queryFn: ({ signal }) => listTasks(filter, sort, signal),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskCreate) => createTask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateTaskVariables) => updateTask(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}
