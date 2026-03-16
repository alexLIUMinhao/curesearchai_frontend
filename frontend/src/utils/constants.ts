import type { AssetType } from '../types/asset';
import type { WorkflowStage, WorkflowStatus } from '../types/workflow';
import type { NoteType } from '../types/note';
import type { TaskPriority, TaskStatus } from '../types/task';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const WORKFLOW_STAGE_OPTIONS: Array<{ label: string; value: WorkflowStage | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Idea', value: 'idea' },
  { label: 'Reading', value: 'reading' },
  { label: 'Experiment', value: 'experiment' },
  { label: 'Writing', value: 'writing' },
  { label: 'Rebuttal', value: 'rebuttal' },
];

export const WORKFLOW_STATUSES: WorkflowStatus[] = ['active', 'archived', 'done'];
export const ASSET_TYPES: Array<AssetType | 'all'> = ['all', 'pdf', 'txt', 'doc', 'note', 'data', 'code', 'result'];
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
export const TASK_STATUSES: TaskStatus[] = ['todo', 'doing', 'done'];
export const NOTE_TYPES: NoteType[] = ['insight', 'summary', 'draft', 'issue'];
