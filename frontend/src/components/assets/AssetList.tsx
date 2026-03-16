import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/format';
import type { Asset } from '../../types/asset';

type AssetListProps = {
  assets: Asset[];
  selectedAssetId?: number | null;
  checkedAssetIds: number[];
  onSelect: (id: number) => void;
  onToggleCheck: (id: number) => void;
};

export function AssetList({ assets, selectedAssetId, checkedAssetIds, onSelect, onToggleCheck }: AssetListProps) {
  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <button
          key={asset.id}
          type="button"
          onClick={() => onSelect(asset.id)}
          className={cn(
            'w-full rounded-3xl border px-4 py-3 text-left transition',
            selectedAssetId === asset.id ? 'border-accent bg-accentSoft/70' : 'border-line bg-white hover:bg-slate-50',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <input
                type="checkbox"
                checked={checkedAssetIds.includes(asset.id)}
                onChange={() => onToggleCheck(asset.id)}
                onClick={(event) => event.stopPropagation()}
                className="mt-1 h-4 w-4 rounded border-line"
              />
              <div className="min-w-0">
                <div className="truncate font-medium text-ink">{asset.name}</div>
                <div className="mt-1 text-xs text-muted">{formatDateTime(asset.created_at)}</div>
              </div>
            </div>
            <Badge tone="neutral">{asset.type}</Badge>
          </div>
        </button>
      ))}
    </div>
  );
}
