import { request } from './api';
import { mockWorkflows } from './mock';
import type { Workflow, WorkflowCreateInput, WorkflowUpdateInput } from '../types/workflow';

export async function listWorkflows(): Promise<Workflow[]> {
  try {
    return await request<Workflow[]>('/api/workflows');
  } catch {
    return mockWorkflows;
  }
}

export function createWorkflow(payload: WorkflowCreateInput) {
  return request<Workflow>('/api/workflows', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getWorkflow(id: number): Promise<Workflow> {
  try {
    return await request<Workflow>(`/api/workflows/${id}`);
  } catch {
    const fallback = mockWorkflows.find((item) => item.id === id);
    if (!fallback) throw new Error('Workflow not found');
    return fallback;
  }
}

export function updateWorkflow(id: number, payload: WorkflowUpdateInput) {
  return request<Workflow>(`/api/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteWorkflow(id: number) {
  return request<{ success: boolean }>(`/api/workflows/${id}`, {
    method: 'DELETE',
  });
}
