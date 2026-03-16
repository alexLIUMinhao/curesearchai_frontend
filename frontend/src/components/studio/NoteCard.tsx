import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatDateTime } from '../../utils/format';
import type { Note } from '../../types/note';

type NoteCardProps = {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
};

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-ink">{note.title}</div>
          <div className="mt-2">
            <Badge tone="accent">{note.note_type}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="ghost" className="text-danger hover:bg-red-50" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{note.content}</p>
      <div className="mt-3 text-xs text-muted">Updated {formatDateTime(note.updated_at || note.created_at)}</div>
    </div>
  );
}
