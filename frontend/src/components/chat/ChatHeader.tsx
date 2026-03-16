import { Badge } from '../common/Badge';
import type { ChatRequestStatus } from '../../types/chat';
import type { ChatMode } from '../../types/settings';
import type { Workflow } from '../../types/workflow';

type ChatHeaderProps = {
  workflow: Workflow;
  modelMode: ChatMode;
  defaultModelMode: ChatMode;
  hasSessionOverride: boolean;
  onModelModeChange: (mode: ChatMode) => void;
  lastRequestStatus: ChatRequestStatus;
  lastRequestError: string | null;
  ideaBuilderPhase?: string;
  ideaBuilderActive?: boolean;
  onRestartIdeaBuilder?: () => void;
  onPauseIdeaBuilder?: () => void;
};

export function ChatHeader({
  workflow,
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
}: ChatHeaderProps) {
  const statusText =
    lastRequestStatus === 'idle'
      ? `Mode: ${modelMode === 'mock' ? 'Mock' : 'Live'}`
      : lastRequestStatus === 'sending'
        ? `Mode: ${modelMode === 'mock' ? 'Mock' : 'Live'} · Last send: sending`
        : lastRequestStatus === 'success'
          ? `Mode: ${modelMode === 'mock' ? 'Mock' : 'Live'} · Last send: success`
          : `Mode: ${modelMode === 'mock' ? 'Mock' : 'Live'} · Last send: failed${lastRequestError ? ` - ${lastRequestError}` : ''}`;

  return (
    <div className="border-b border-line px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-ink">{workflow.name}</h2>
            <Badge tone="accent">{workflow.stage}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">Evidence first, conversation second.</p>
          <p className="mt-1 text-xs text-muted">Mock keeps the workflow usable without an API key. Live uses the backend-configured model endpoint.</p>
          {hasSessionOverride ? (
            <p className="mt-1 text-xs text-accent">Session override active. Saved default: {defaultModelMode === 'mock' ? 'Mock' : 'Live'}.</p>
          ) : null}
          {ideaBuilderActive ? (
            <p className="mt-1 text-xs text-accent">Idea Builder in progress. Current phase: {ideaBuilderPhase}.</p>
          ) : null}
          <p className={`mt-2 text-xs ${lastRequestStatus === 'failed' ? 'text-danger' : 'text-muted'}`}>{statusText}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-line bg-white p-1">
            <div className="flex items-center gap-1">
              {(['mock', 'live'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onModelModeChange(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    modelMode === mode ? 'bg-ink text-white' : 'text-muted hover:bg-slate-100'
                  }`}
                >
                  {mode === 'mock' ? 'Mock' : 'Live'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {onRestartIdeaBuilder ? (
              <button type="button" onClick={onRestartIdeaBuilder} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                Restart Idea Builder
              </button>
            ) : null}
            {ideaBuilderActive && onPauseIdeaBuilder ? (
              <button type="button" onClick={onPauseIdeaBuilder} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                Pause Idea Builder
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
