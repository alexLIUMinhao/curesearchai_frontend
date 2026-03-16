import { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import { NoteCard } from './NoteCard';
import { NoteForm } from './NoteForm';
import type { Note, NoteType } from '../../types/note';

type DraftNote = {
  title: string;
  content: string;
  note_type: NoteType;
};

const defaultDraft: DraftNote = {
  title: '',
  content: '',
  note_type: 'insight',
};

type NotesPanelProps = {
  notes: Note[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  createNote: (payload: DraftNote) => Promise<unknown>;
  updateNote: (id: number, payload: Partial<DraftNote>) => Promise<unknown>;
  deleteNote: (id: number) => Promise<void>;
};

export function NotesPanel({ notes, loading, error, reload, createNote, updateNote, deleteNote }: NotesPanelProps) {
  const [showForm, setShowForm] = useState(notes.length === 0);
  const [draft, setDraft] = useState<DraftNote>(defaultDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingId === null) return;
    const note = notes.find((item) => item.id === editingId);
    if (!note) return;
    setDraft({ title: note.title, content: note.content, note_type: note.note_type });
    setShowForm(true);
  }, [editingId, notes]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (editingId) {
        await updateNote(editingId, draft);
      } else {
        await createNote(draft);
      }
      setDraft(defaultDraft);
      setEditingId(null);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="panel-title">Notes</p>
          <p className="mt-2 text-sm text-muted">Capture insight, summary, draft, and issue records as durable outputs.</p>
        </div>
        <Button
          onClick={() => {
            setShowForm((current) => !current);
            setEditingId(null);
            setDraft(defaultDraft);
          }}
        >
          {showForm ? 'Hide form' : 'New Note'}
        </Button>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {showForm ? (
          <div className="mb-4">
            <NoteForm
              title={editingId ? 'Edit note' : 'Create note'}
              draft={draft}
              loading={submitting}
              submitLabel={editingId ? 'Update note' : 'Create note'}
              onChange={setDraft}
              onSubmit={() => void handleSubmit()}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
                setDraft(defaultDraft);
              }}
            />
          </div>
        ) : null}

        {loading ? <LoadingState label="Loading notes..." /> : null}
        {!loading && error ? <ErrorState title="Unable to load notes" description={error} onRetry={reload} /> : null}
        {!loading && !error && notes.length === 0 ? (
          <EmptyState
            title="No notes yet"
            description="Use notes to freeze insights before they get buried under another round of conversation."
          />
        ) : null}
        {!loading && !error && notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => setEditingId(note.id)}
                onDelete={() => setDeletingId(note.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Delete note?"
        description="This removes the note from the current workflow."
        onCancel={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) void deleteNote(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
