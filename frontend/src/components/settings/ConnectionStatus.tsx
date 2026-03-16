import { Badge } from '../common/Badge';

type ConnectionStatusProps = {
  tone: 'success' | 'danger' | 'neutral';
  message: string;
};

export function ConnectionStatus({ tone, message }: ConnectionStatusProps) {
  return (
    <div className="rounded-2xl border border-line bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <Badge tone={tone}>{tone === 'success' ? 'Connected' : tone === 'danger' ? 'Error' : 'Info'}</Badge>
        <span className="text-sm text-muted">{message}</span>
      </div>
    </div>
  );
}
