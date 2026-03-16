import { useState } from 'react';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import { AssetDetailCard } from './AssetDetailCard';
import { AssetList } from './AssetList';
import { AssetUploadModal } from './AssetUploadModal';
import type { Asset, AssetType } from '../../types/asset';

type AssetsPanelProps = {
  workflowId: number;
  assetsHook: {
    assets: Asset[];
    filteredAssets: Asset[];
    selectedAsset: Asset | null;
    setSelectedAssetId: (id: number) => void;
    checkedAssetIds: number[];
    toggleCheckedAssetId: (id: number) => void;
    assetTypeFilter: AssetType | 'all';
    setAssetTypeFilter: (value: AssetType | 'all') => void;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void> | void;
    uploadAsset: (payload: {
      type: AssetType;
      name?: string;
      metadataJson?: Record<string, unknown> | null;
      file: File;
    }) => Promise<unknown>;
  };
  onStructureAsset?: (assetIds: number[]) => Promise<void>;
  structuringAssets?: boolean;
};

export function AssetsPanel({ workflowId, assetsHook, onStructureAsset, structuringAssets = false }: AssetsPanelProps) {
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const hasAssets = assetsHook.assets.length > 0;
  const selectedCount = assetsHook.checkedAssetIds.length;

  const handleUpload = async (payload: {
    type: AssetType;
    name?: string;
    metadataJson?: Record<string, unknown> | null;
    file: File;
  }) => {
    setUploading(true);
    try {
      await assetsHook.uploadAsset(payload);
      setOpenUploadModal(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <section className="panel flex h-full flex-col p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="panel-title">Sources / Assets</p>
            <p className="mt-2 text-sm text-muted">Keep evidence visible while the workflow evolves.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onStructureAsset?.(assetsHook.checkedAssetIds)}
              disabled={!hasAssets || selectedCount === 0 || structuringAssets}
            >
              {structuringAssets ? 'Structuring...' : 'Structure Sources'}
            </Button>
            <Button onClick={() => setOpenUploadModal(true)}>Add Source</Button>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted">
          {hasAssets ? `${selectedCount} selected for reading` : 'Add sources first to enable structuring'}
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {assetsHook.loading ? <LoadingState label="Loading sources..." /> : null}
          {!assetsHook.loading && assetsHook.error ? (
            <ErrorState title="Unable to load sources" description={assetsHook.error} onRetry={() => void assetsHook.reload()} />
          ) : null}
          {!assetsHook.loading && !assetsHook.error && assetsHook.filteredAssets.length === 0 ? (
            <EmptyState
              title="No sources yet"
              description="Upload a paper, notes, code, or result file so this workflow starts from evidence instead of memory."
              action={<Button onClick={() => setOpenUploadModal(true)}>Upload first source</Button>}
            />
          ) : null}
          {!assetsHook.loading && !assetsHook.error && assetsHook.filteredAssets.length > 0 ? (
            <div className="space-y-5">
              <AssetList
                assets={assetsHook.filteredAssets}
                selectedAssetId={assetsHook.selectedAsset?.id}
                checkedAssetIds={assetsHook.checkedAssetIds}
                onSelect={assetsHook.setSelectedAssetId}
                onToggleCheck={assetsHook.toggleCheckedAssetId}
              />
              <AssetDetailCard asset={assetsHook.selectedAsset} />
            </div>
          ) : null}
        </div>
      </section>

      <AssetUploadModal
        open={openUploadModal}
        loading={uploading}
        workflowId={workflowId}
        onClose={() => setOpenUploadModal(false)}
        onSubmit={handleUpload}
      />
    </>
  );
}
