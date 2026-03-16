export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'doing' | 'done';

export type Task = {
  id: number;
  workflow_id: number;
  title: string;
  description: string | null;
  related_claim: string | null;
  owner: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string | null;
};

export type TaskCreateInput = {
  workflow_id: number;
  title: string;
  description?: string;
  related_claim?: string;
  owner?: string;
  priority: TaskPriority;
  status: TaskStatus;
};

export type TaskUpdateInput = Partial<Omit<TaskCreateInput, 'workflow_id'>>;

export type DraftTask = {
  title: string;
  description: string;
  related_claim: string;
  owner: string;
  priority: TaskPriority;
  status: TaskStatus;
};

export type DraftTaskQueueItem = DraftTask & {
  source?: 'suggested_task' | 'idea_builder';
};
