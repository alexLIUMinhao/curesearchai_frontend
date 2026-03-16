import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatDateTime } from '../../utils/format';
import type { Asset, AssetStructurerMetadata } from '../../types/asset';

type AssetDetailCardProps = {
  asset: Asset | null;
};

function getStructurerMetadata(asset: Asset | null): AssetStructurerMetadata | null {
  if (!asset?.metadata_json || typeof asset.metadata_json !== 'object') return null;
  const skills = (asset.metadata_json as Record<string, unknown>).skills;
  if (!skills || typeof skills !== 'object') return null;
  const structurer = (skills as Record<string, unknown>).asset_structurer;
  if (!structurer || typeof structurer !== 'object') return null;
  return structurer as AssetStructurerMetadata;
}

export function AssetDetailCard({ asset }: AssetDetailCardProps) {
  if (!asset) {
    return (
      <div className="rounded-3xl border border-dashed border-line p-4 text-sm text-muted">
        Select a source to inspect its details and metadata.
      </div>
    );
  }

  const structurer = getStructurerMetadata(asset);

  return (
    <div className="rounded-3xl border border-line bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-ink">{asset.name}</div>
          <div className="mt-1 text-xs text-muted">{formatDateTime(asset.created_at)}</div>
        </div>
        <Badge tone="accent">{asset.type}</Badge>
      </div>
      <div className="mt-3 space-y-2 text-sm text-muted">
        <div className="break-all">Path: {asset.file_path}</div>
        {structurer ? (
          <div className="rounded-2xl border border-line bg-white px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Structured summary</div>
              <Badge tone={structurer.status === 'completed' ? 'success' : structurer.status === 'unsupported' ? 'warning' : 'danger'}>
                {structurer.status}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink">
              {structurer.summary || structurer.error || 'Structured output is available in chat and notes.'}
            </p>
            <div className="mt-2 text-xs text-muted">
              {structurer.structured_at ? `Last structured ${formatDateTime(structurer.structured_at)}` : 'Not structured yet'}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line px-3 py-3 text-xs text-muted">
            No structured summary yet. Run the skill to turn this source into chat-readable research output and a durable note.
          </div>
        )}
      </div>
    </div>
  );
}
