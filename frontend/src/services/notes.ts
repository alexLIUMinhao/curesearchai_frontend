import { request } from './api';
import { mockNotes } from './mock';
import type { Note, NoteCreateInput, NoteUpdateInput } from '../types/note';

export async function listNotes(workflowId?: number): Promise<Note[]> {
  const path = workflowId ? `/api/notes?workflow_id=${workflowId}` : '/api/notes';
  try {
    return await request<Note[]>(path);
  } catch {
    return workflowId ? mockNotes.filter((item) => item.workflow_id === workflowId) : mockNotes;
  }
}

export function createNote(payload: NoteCreateInput) {
  return request<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateNote(id: number, payload: NoteUpdateInput) {
  return request<Note>(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteNote(id: number) {
  return request<{ success: boolean }>(`/api/notes/${id}`, {
    method: 'DELETE',
  });
}
