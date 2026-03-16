import { Button } from '../common/Button';
import { Field } from '../common/Field';
import { Select } from '../common/Select';
import { TextArea } from '../common/TextArea';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../utils/constants';
import type { DraftTask, TaskPriority, TaskStatus } from '../../types/task';

type TaskFormProps = {
  title: string;
  draft: DraftTask;
  loading?: boolean;
  submitLabel: string;
  onChange: (draft: DraftTask) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function TaskForm({ title, draft, loading, submitLabel, onChange, onSubmit, onCancel }: TaskFormProps) {
  return (
    <div className="rounded-3xl border border-line bg-slate-50 p-4">
      <div className="mb-4 text-sm font-semibold text-ink">{title}</div>
      <div className="space-y-3">
        <Field label="Title" value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
        <TextArea
          label="Description"
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
        <Field
          label="Related claim"
          value={draft.related_claim}
          onChange={(event) => onChange({ ...draft, related_claim: event.target.value })}
        />
        <Field label="Owner" value={draft.owner} onChange={(event) => onChange({ ...draft, owner: event.target.value })} />
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Priority"
            value={draft.priority}
            onChange={(event) => onChange({ ...draft, priority: event.target.value as TaskPriority })}
            options={TASK_PRIORITIES.map((item) => ({ label: item, value: item }))}
          />
          <Select
            label="Status"
            value={draft.status}
            onChange={(event) => onChange({ ...draft, status: event.target.value as TaskStatus })}
            options={TASK_STATUSES.map((item) => ({ label: item, value: item }))}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button onClick={onSubmit} disabled={loading || !draft.title.trim()}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
