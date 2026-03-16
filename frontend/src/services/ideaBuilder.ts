import { request } from './api';
import type { IdeaBuilderRespondPayload, IdeaBuilderRunResponse, IdeaBuilderState } from '../types/ideaBuilder';

export function getIdeaBuilderState(workflowId: number) {
  return request<IdeaBuilderState>(`/api/idea-builder/state/${workflowId}`);
}

export function startIdeaBuilder(workflowId: number, restart = false) {
  return request<IdeaBuilderRunResponse>('/api/idea-builder/start', {
    method: 'POST',
    body: JSON.stringify({ workflow_id: workflowId, restart }),
  });
}

export function respondIdeaBuilder(payload: IdeaBuilderRespondPayload) {
  return request<IdeaBuilderRunResponse>('/api/idea-builder/respond', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
