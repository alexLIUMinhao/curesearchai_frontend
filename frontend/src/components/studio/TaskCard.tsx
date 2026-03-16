import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatDateTime } from '../../utils/format';
import { TASK_STATUSES } from '../../utils/constants';
import type { Task, TaskStatus } from '../../types/task';

type TaskCardProps = {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
};

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-ink">{task.title}</div>
          {task.description ? <p className="mt-2 text-sm leading-6 text-muted">{task.description}</p> : null}
        </div>
        <Button variant="ghost" className="text-danger hover:bg-red-50" onClick={onDelete}>
          Delete
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>
          {task.priority}
        </Badge>
        <Badge tone={task.status === 'done' ? 'success' : task.status === 'doing' ? 'accent' : 'neutral'}>
          {task.status}
        </Badge>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-muted">
        {task.related_claim ? <div>Claim: {task.related_claim}</div> : null}
        {task.owner ? <div>Owner: {task.owner}</div> : null}
        <div>Updated {formatDateTime(task.updated_at || task.created_at)}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {TASK_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(status)}
            className={`rounded-full px-3 py-1 text-xs ${
              task.status === status ? 'bg-ink text-white' : 'bg-slate-100 text-muted'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
