export type WorkflowStage = 'idea' | 'reading' | 'experiment' | 'writing' | 'rebuttal';
export type WorkflowStatus = 'active' | 'archived' | 'done';

export type Workflow = {
  id: number;
  project_id: string;
  name: string;
  description: string | null;
  stage: WorkflowStage;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string | null;
};

export type WorkflowCreateInput = {
  project_id: string;
  name: string;
  description?: string;
  stage: WorkflowStage;
  status: WorkflowStatus;
};

export type WorkflowUpdateInput = Partial<WorkflowCreateInput>;

