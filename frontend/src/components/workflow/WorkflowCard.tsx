import { Badge } from '../common/Badge';
import { WorkflowActionsMenu } from './WorkflowActionsMenu';
import { formatDateTime, getWorkflowMockMetrics } from '../../utils/format';
import type { Workflow } from '../../types/workflow';

type WorkflowCardProps = {
  workflow: Workflow;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function WorkflowCard({ workflow, onOpen, onEdit, onDelete }: WorkflowCardProps) {
  const metrics = getWorkflowMockMetrics(workflow.id);

  return (
    <article className="panel flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <button type="button" className="flex-1 text-left" onClick={onOpen}>
          <h3 className="text-lg font-semibold text-ink">{workflow.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
            {workflow.description || 'No description yet. Use this workflow to convert an idea into structured action.'}
          </p>
        </button>
        <WorkflowActionsMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="accent">{workflow.stage}</Badge>
        <Badge tone={workflow.status === 'done' ? 'success' : workflow.status === 'archived' ? 'warning' : 'neutral'}>
          {workflow.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-3xl bg-slate-50 p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Task signal</div>
          <div className="mt-1 text-lg font-semibold text-ink">{metrics.taskCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Source signal</div>
          <div className="mt-1 text-lg font-semibold text-ink">{metrics.assetCount}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Updated {formatDateTime(workflow.updated_at || workflow.created_at)}</span>
        <button type="button" className="font-medium text-accent" onClick={onOpen}>
          Enter studio
        </button>
      </div>
    </article>
  );
}
