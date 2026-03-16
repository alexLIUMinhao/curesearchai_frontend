import type { ChatMessage } from './chat';
import type { Note } from './note';
import type { DraftTask } from './task';

export type IdeaBuilderPhase =
  | 'idle'
  | 'background'
  | 'resources'
  | 'familiarity'
  | 'existing_idea'
  | 'direction_choice'
  | 'refinement'
  | 'task_check'
  | 'completed';

export type IdeaDirectionChoice = 'migration' | 'improvement' | 'gap';
export type IdeaBuilderAction = 'generate_tasks' | 'keep_refining' | 'pause';

export type IdeaBuilderState = {
  workflow_id: number;
  phase: IdeaBuilderPhase;
  maturity_score: number;
  direction_choice: IdeaDirectionChoice | null;
  can_generate_tasks: boolean;
  memory_note_id: number | null;
  task_generation_status: 'not_requested' | 'drafted' | 'generated';
};

export type IdeaBuilderRunResponse = {
  workflow_id: number;
  phase: IdeaBuilderPhase;
  state: IdeaBuilderState;
  user_message: ChatMessage | null;
  assistant_messages: ChatMessage[];
  task_drafts: DraftTask[];
  memory_note: Note | null;
};

export type IdeaBuilderRespondPayload = {
  workflow_id: number;
  user_message?: string | null;
  direction_choice?: IdeaDirectionChoice | null;
  action?: IdeaBuilderAction | null;
};
