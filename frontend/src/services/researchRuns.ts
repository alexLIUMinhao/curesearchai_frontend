import { request } from './api';
import type { ResearchRun } from '../types/researchRun';

export function listResearchRuns(workflowId?: number) {
  const path = workflowId ? `/api/research-runs?workflow_id=${workflowId}` : '/api/research-runs';
  return request<ResearchRun[]>(path);
}

export function createResearchRun(payload: {
  workflow_id: number;
  title: string;
  objective: string;
  status: 'pending' | 'running' | 'finished' | 'failed';
}) {
  return request<ResearchRun>('/api/research-runs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getResearchRun(id: number) {
  return request<ResearchRun>(`/api/research-runs/${id}`);
}
