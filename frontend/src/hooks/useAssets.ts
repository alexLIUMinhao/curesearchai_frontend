import { useEffect, useMemo, useState } from 'react';
import * as assetsService from '../services/assets';
import type { Asset, AssetType, AssetUploadInput } from '../types/asset';

export function useAssets(workflowId: number) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [checkedAssetIds, setCheckedAssetIds] = useState<number[]>([]);
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assetsService.listAssets(workflowId);
      setAssets(data);
      setSelectedAssetId((current) => current ?? data[0]?.id ?? null);
      setCheckedAssetIds((current) => {
        if (current.length === 0) {
          return data.map((item) => item.id);
        }
        return current.filter((id) => data.some((item) => item.id === id));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [workflowId]);

  const filteredAssets = useMemo(
    () => (assetTypeFilter === 'all' ? assets : assets.filter((item) => item.type === assetTypeFilter)),
    [assetTypeFilter, assets],
  );

  const selectedAsset = useMemo(
    () => filteredAssets.find((item) => item.id === selectedAssetId) ?? filteredAssets[0] ?? null,
    [filteredAssets, selectedAssetId],
  );

  const uploadAsset = async (payload: Omit<AssetUploadInput, 'workflowId'>) => {
    const created = await assetsService.uploadAsset({ ...payload, workflowId });
    setAssets((current) => [created, ...current]);
    setSelectedAssetId(created.id);
    setCheckedAssetIds((current) => [created.id, ...current]);
    return created;
  };

  const toggleCheckedAssetId = (assetId: number) => {
    setCheckedAssetIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  };

  return {
    assets,
    selectedAsset,
    setSelectedAssetId,
    checkedAssetIds,
    toggleCheckedAssetId,
    assetTypeFilter,
    setAssetTypeFilter,
    filteredAssets,
    loading,
    error,
    reload: load,
    uploadAsset,
  };
}
