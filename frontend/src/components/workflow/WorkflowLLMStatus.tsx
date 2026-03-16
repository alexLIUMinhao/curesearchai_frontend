import { Badge } from '../common/Badge';
import type { LLMRuntimeStatus } from '../../types/settings';
import { formatDateTime, toSentenceCase } from '../../utils/format';

type WorkflowLLMStatusProps = {
  status: LLMRuntimeStatus | null;
  loading?: boolean;
};

function getTone(connectionStatus: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (connectionStatus === 'connected') return 'success';
  if (connectionStatus === 'mock') return 'warning';
  if (connectionStatus === 'error') return 'danger';
  return 'neutral';
}

export function WorkflowLLMStatus({ status, loading = false }: WorkflowLLMStatusProps) {
  const connectionLabel = loading ? 'Loading' : status ? status.connection_status : 'Idle';
  const modelLabel = status?.model || 'Not connected';
  const providerLabel = status ? `${toSentenceCase(status.provider_label)} · ${status.mode === 'mock' ? 'Mock' : 'Live'}` : 'No invocation yet';
  const heartbeatLabel = status?.heartbeat_at ? formatDateTime(status.heartbeat_at) : 'No heartbeat yet';
  const errorLabel = status?.last_error || 'No recent errors';

  return (
    <section className="rounded-2xl border border-line bg-slate-50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto text-xs text-muted">
        <span className="shrink-0 font-semibold uppercase tracking-[0.16em] text-muted">Runtime</span>
        <Badge tone={status ? getTone(status.connection_status) : 'neutral'}>
          {connectionLabel}
        </Badge>
        <span className="shrink-0 text-slate-300">|</span>
        <div className="min-w-0 flex-1 truncate" title={`${modelLabel}${status ? `\n${providerLabel}` : ''}`}>
          <span className="mr-1 text-slate-500">Model:</span>
          <span className="text-ink">{modelLabel}</span>
        </div>
        <span className="shrink-0 text-slate-300">|</span>
        <div className="shrink-0" title={`Input tokens: ${status?.input_tokens ?? 0}`}>
          <span className="mr-1 text-slate-500">In:</span>
          <span className="text-ink">{status?.input_tokens ?? 0}</span>
        </div>
        <div className="shrink-0" title={`Output tokens: ${status?.output_tokens ?? 0}`}>
          <span className="mr-1 text-slate-500">Out:</span>
          <span className="text-ink">{status?.output_tokens ?? 0}</span>
        </div>
        <span className="shrink-0 text-slate-300">|</span>
        <div className="shrink-0" title={heartbeatLabel}>
          <span className="mr-1 text-slate-500">Heartbeat:</span>
          <span className="text-ink">{status?.heartbeat_at ? heartbeatLabel : 'None'}</span>
        </div>
        <span className="shrink-0 text-slate-300">|</span>
        <div className="min-w-0 flex-1 truncate" title={errorLabel}>
          <span className="mr-1 text-slate-500">Status:</span>
          <span className={status?.last_error ? 'text-danger' : 'text-ink'}>
            {status?.last_error || providerLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
