import type { LLMRuntimeStatus } from './settings';
import type { DraftTask } from './task';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: number;
  workflow_id: number;
  role: ChatRole;
  content: string;
  created_at: string;
  pending?: boolean;
  failed?: boolean;
};

export type SuggestedTask = {
  title: string;
  description?: string | null;
};

export type ChatSendPayload = {
  workflow_id: number;
  message: string;
  use_mock?: boolean;
  mode_hint?: 'auto' | 'qa' | 'idea_builder';
};

export type ContextSource = {
  asset_id: number;
  name: string;
};

export type ChatSendResult = {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  optional_tasks: SuggestedTask[];
  route: 'qa' | 'idea_builder';
  intent: string;
  context_sources: ContextSource[];
  task_drafts: DraftTask[];
  llm_status: LLMRuntimeStatus;
};

export type ChatRequestStatus = 'idle' | 'sending' | 'success' | 'failed';
