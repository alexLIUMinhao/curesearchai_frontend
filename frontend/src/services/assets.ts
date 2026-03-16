import { request, requestForm } from './api';
import { mockAssets } from './mock';
import type { Asset, AssetUploadInput } from '../types/asset';

export async function listAssets(workflowId?: number): Promise<Asset[]> {
  const path = workflowId ? `/api/assets?workflow_id=${workflowId}` : '/api/assets';
  try {
    return await request<Asset[]>(path);
  } catch {
    return workflowId ? mockAssets.filter((item) => item.workflow_id === workflowId) : mockAssets;
  }
}

export async function getAsset(id: number): Promise<Asset> {
  try {
    return await request<Asset>(`/api/assets/${id}`);
  } catch {
    const fallback = mockAssets.find((item) => item.id === id);
    if (!fallback) throw new Error('Asset not found');
    return fallback;
  }
}

export function uploadAsset(payload: AssetUploadInput) {
  const formData = new FormData();
  formData.append('workflow_id', String(payload.workflowId));
  formData.append('type', payload.type);
  if (payload.name) formData.append('name', payload.name);
  if (payload.metadataJson) formData.append('metadata_json', JSON.stringify(payload.metadataJson));
  formData.append('file', payload.file);

  return requestForm<Asset>('/api/assets/upload', formData, {
    method: 'POST',
  });
}
