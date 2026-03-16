export type ResearchRunStatus = 'pending' | 'running' | 'finished' | 'failed';

export type ResearchRun = {
  id: number;
  workflow_id: number;
  title: string;
  objective: string;
  status: ResearchRunStatus;
  result_summary: string | null;
  created_at: string;
  updated_at: string | null;
};

