export type NoteType = 'insight' | 'summary' | 'draft' | 'issue';

export type Note = {
  id: number;
  workflow_id: number;
  title: string;
  content: string;
  note_type: NoteType;
  created_at: string;
  updated_at: string | null;
};

export type NoteCreateInput = {
  workflow_id: number;
  title: string;
  content: string;
  note_type: NoteType;
};

export type NoteUpdateInput = Partial<Omit<NoteCreateInput, 'workflow_id'>>;

