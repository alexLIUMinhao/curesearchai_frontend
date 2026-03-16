import { request } from './api';
import { mockTasks } from './mock';
import type { Task, TaskCreateInput, TaskUpdateInput } from '../types/task';

export async function listTasks(workflowId?: number): Promise<Task[]> {
  const path = workflowId ? `/api/tasks?workflow_id=${workflowId}` : '/api/tasks';
  try {
    return await request<Task[]>(path);
  } catch {
    return workflowId ? mockTasks.filter((item) => item.workflow_id === workflowId) : mockTasks;
  }
}

export function createTask(payload: TaskCreateInput) {
  return request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTask(id: number, payload: TaskUpdateInput) {
  return request<Task>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteTask(id: number) {
  return request<{ success: boolean }>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}
