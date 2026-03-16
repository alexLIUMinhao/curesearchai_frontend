import { useRef } from 'react';
import { ChatComposer } from './ChatComposer';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatHeader } from './ChatHeader';
import { DiagnosticActionCards } from './DiagnosticActionCards';
import { MessageList } from './MessageList';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import type { ChatMessage, ChatRequestStatus, ContextSource, SuggestedTask } from '../../types/chat';
import type { IdeaBuilderPhase } from '../../types/ideaBuilder';
import type { ChatMode } from '../../types/settings';
import type { Workflow } from '../../types/workflow';

type ChatPanelProps = {
  workflow: Workflow;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  composerValue: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  onPickPrompt: (prompt: string) => void;
  onRetry: () => void;
  suggestedTasksByMessageId: Record<number, SuggestedTask[]>;
  contextSourcesByMessageId: Record<number, ContextSource[]>;
  onAddTask: (task: SuggestedTask) => void;
  onRetryMessage: (messageId: number) => void;
  modelMode: ChatMode;
  defaultModelMode: ChatMode;
  hasSessionOverride: boolean;
  onModelModeChange: (mode: ChatMode) => void;
  lastRequestStatus: ChatRequestStatus;
  lastRequestError: string | null;
  ideaBuilderPhase?: IdeaBuilderPhase;
  ideaBuilderActive?: boolean;
  onRestartIdeaBuilder?: () => void;
  onPauseIdeaBuilder?: () => void;
  onIdeaDirectionSelect?: (direction: 'migration' | 'improvement' | 'gap') => void;
  onIdeaTaskAction?: (action: 'generate_tasks' | 'keep_refining') => void;
};

export function ChatPanel({
  workflow,
  messages,
  loading,
  sending,
  error,
  composerValue,
  onComposerChange,
  onSend,
  onPickPrompt,
  onRetry,
  suggestedTasksByMessageId,
  contextSourcesByMessageId,
  onAddTask,
  onRetryMessage,
  modelMode,
  defaultModelMode,
  hasSessionOverride,
  onModelModeChange,
  lastRequestStatus,
  lastRequestError,
  ideaBuilderPhase,
  ideaBuilderActive,
  onRestartIdeaBuilder,
  onPauseIdeaBuilder,
  onIdeaDirectionSelect,
  onIdeaTaskAction,
}: ChatPanelProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  return (
    <section className="panel flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        <ChatHeader
          workflow={workflow}
          modelMode={modelMode}
          defaultModelMode={defaultModelMode}
          hasSessionOverride={hasSessionOverride}
          onModelModeChange={onModelModeChange}
          lastRequestStatus={lastRequestStatus}
          lastRequestError={lastRequestError}
          ideaBuilderPhase={ideaBuilderPhase}
          ideaBuilderActive={ideaBuilderActive}
          onRestartIdeaBuilder={onRestartIdeaBuilder}
          onPauseIdeaBuilder={onPauseIdeaBuilder}
        />
        <DiagnosticActionCards onPick={onPickPrompt} />
      </div>
      <div ref={viewportRef} className="scroll-panel min-h-0 flex-1 overflow-y-auto pr-2">
        {loading ? <LoadingState label="Loading conversation..." /> : null}
        {!loading && error ? (
          <div className="px-5 py-5">
            <ErrorState title="Unable to load conversation" description={error} onRetry={onRetry} />
          </div>
        ) : null}
        {!loading && !error && messages.length === 0 ? <ChatEmptyState /> : null}
        {!loading && !error && messages.length > 0 ? (
          <MessageList
            messages={messages}
            suggestedTasksByMessageId={suggestedTasksByMessageId}
            contextSourcesByMessageId={contextSourcesByMessageId}
            onAddTask={onAddTask}
            onRetryMessage={onRetryMessage}
            viewportRef={viewportRef}
            onIdeaDirectionSelect={onIdeaDirectionSelect}
            onIdeaTaskAction={onIdeaTaskAction}
          />
        ) : null}
      </div>
      <div className="shrink-0">
        <ChatComposer value={composerValue} sending={sending} onChange={onComposerChange} onSend={onSend} />
      </div>
    </section>
  );
}
