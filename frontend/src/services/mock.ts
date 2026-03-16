import type { Asset } from '../types/asset';
import type { ChatMessage, ChatSendPayload, ChatSendResult } from '../types/chat';
import type { Note } from '../types/note';
import type { Task } from '../types/task';
import type { Workflow } from '../types/workflow';

const now = new Date().toISOString();

export const mockWorkflows: Workflow[] = [
  {
    id: 101,
    project_id: 'default-project',
    name: 'Causal Benchmark Review',
    description: 'Compare recent causal reasoning benchmarks and identify weak spots in evaluation design.',
    stage: 'reading',
    status: 'active',
    created_at: now,
    updated_at: now,
  },
];

export const mockAssets: Asset[] = [
  {
    id: 201,
    workflow_id: 101,
    name: 'benchmark-notes.pdf',
    type: 'pdf',
    file_path: 'uploads/benchmark-notes.pdf',
    metadata_json: { source: 'fallback' },
    created_at: now,
  },
];

export const mockTasks: Task[] = [
  {
    id: 301,
    workflow_id: 101,
    title: 'Compare benchmark assumptions',
    description: 'List the hidden assumptions in each benchmark protocol.',
    related_claim: 'Evaluation quality depends on realistic intervention setup.',
    owner: 'Researcher',
    priority: 'high',
    status: 'todo',
    created_at: now,
    updated_at: now,
  },
];

export const mockNotes: Note[] = [
  {
    id: 401,
    workflow_id: 101,
    title: 'Initial insight',
    content: 'Most benchmark papers under-specify the intervention mechanism.',
    note_type: 'insight',
    created_at: now,
    updated_at: now,
  },
];

export const mockChatHistory: ChatMessage[] = [];

export function buildMockChatSendResult(payload: ChatSendPayload): ChatSendResult {
  const now = new Date().toISOString();

  return {
    user_message: {
      id: Date.now(),
      workflow_id: payload.workflow_id,
      role: 'user',
      content: payload.message,
      created_at: now,
    },
    assistant_message: {
      id: Date.now() + 1,
      workflow_id: payload.workflow_id,
      role: 'assistant',
      content:
        'Problem framing: you are trying to move a research workflow forward and need a tighter operational next step.\n' +
        'Next steps:\n' +
        '1. Narrow the exact research question and define the decision you need to make next.\n' +
        '2. Review the strongest existing evidence, baselines, or failure cases already available.\n' +
        '3. Convert the next action into a trackable task with a clear owner and expected output.\n' +
        'Suggested task: Create a one-page execution brief covering the question, current evidence, and next experiment step.',
      created_at: now,
    },
    optional_tasks: [
      {
        title: 'Create execution brief',
        description: 'Summarize the research question, strongest evidence, and the next experiment step in one working note.',
      },
    ],
  };
}
