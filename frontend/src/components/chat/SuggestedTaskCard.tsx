import { Button } from '../common/Button';
import type { SuggestedTask } from '../../types/chat';

type SuggestedTaskCardProps = {
  task: SuggestedTask;
  onAdd: (task: SuggestedTask) => void;
};

export function SuggestedTaskCard({ task, onAdd }: SuggestedTaskCardProps) {
  return (
    <div className="rounded-3xl border border-accent/20 bg-accentSoft/60 p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-accent">Suggested task</div>
      <div className="mt-2 font-medium text-ink">{task.title}</div>
      {task.description ? <p className="mt-2 text-sm leading-6 text-muted">{task.description}</p> : null}
      <div className="mt-4">
        <Button variant="secondary" onClick={() => onAdd(task)}>
          Add to Tasks
        </Button>
      </div>
    </div>
  );
}
