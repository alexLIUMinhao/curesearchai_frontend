import { request } from './api';
import type { AssetSkillResult, AssetSkillRunResponse } from '../types/skills';

export function runAssetSkill(assetId: number, skillName: 'asset_structurer' = 'asset_structurer') {
  return request<AssetSkillRunResponse>('/api/skills/run-asset', {
    method: 'POST',
    body: JSON.stringify({
      asset_id: assetId,
      skill_name: skillName,
    }),
  });
}

export function getAssetSkillResult(assetId: number, skillName: 'asset_structurer' = 'asset_structurer') {
  return request<AssetSkillResult>(`/api/skills/asset/${assetId}/${skillName}`);
}
