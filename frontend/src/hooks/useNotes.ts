import { useEffect, useState } from 'react';
import * as notesService from '../services/notes';
import type { Note, NoteCreateInput, NoteUpdateInput } from '../types/note';

export function useNotes(workflowId: number) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notesService.listNotes(workflowId);
      setNotes(data.filter((item) => !item.title.startsWith('[system]')));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [workflowId]);

  const createNote = async (payload: Omit<NoteCreateInput, 'workflow_id'>) => {
    const created = await notesService.createNote({ ...payload, workflow_id: workflowId });
    setNotes((current) => [created, ...current]);
    return created;
  };

  const updateNote = async (id: number, payload: NoteUpdateInput) => {
    const updated = await notesService.updateNote(id, payload);
    setNotes((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  };

  const deleteNote = async (id: number) => {
    await notesService.deleteNote(id);
    setNotes((current) => current.filter((item) => item.id !== id));
  };

  return {
    notes,
    loading,
    error,
    reload: load,
    createNote,
    updateNote,
    deleteNote,
  };
}
