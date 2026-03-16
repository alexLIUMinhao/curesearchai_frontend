import { Button } from '../common/Button';
import { Field } from '../common/Field';
import { Select } from '../common/Select';
import { TextArea } from '../common/TextArea';
import { NOTE_TYPES } from '../../utils/constants';
import type { NoteType } from '../../types/note';

type DraftNote = {
  title: string;
  content: string;
  note_type: NoteType;
};

type NoteFormProps = {
  title: string;
  draft: DraftNote;
  loading?: boolean;
  submitLabel: string;
  onChange: (draft: DraftNote) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function NoteForm({ title, draft, loading, submitLabel, onChange, onSubmit, onCancel }: NoteFormProps) {
  return (
    <div className="rounded-3xl border border-line bg-slate-50 p-4">
      <div className="mb-4 text-sm font-semibold text-ink">{title}</div>
      <div className="space-y-3">
        <Field label="Title" value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
        <Select
          label="Note type"
          value={draft.note_type}
          onChange={(event) => onChange({ ...draft, note_type: event.target.value as NoteType })}
          options={NOTE_TYPES.map((item) => ({ label: item, value: item }))}
        />
        <TextArea
          label="Content"
          value={draft.content}
          onChange={(event) => onChange({ ...draft, content: event.target.value })}
        />
      </div>
      <div className="mt-4 flex gap-3">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button onClick={onSubmit} disabled={loading || !draft.title.trim() || !draft.content.trim()}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
