export type AssetType = 'pdf' | 'txt' | 'doc' | 'note' | 'data' | 'code' | 'result';

export type Asset = {
  id: number;
  workflow_id: number;
  name: string;
  type: AssetType;
  file_path: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
};

export type AssetStructurerMetadata = {
  skill_name: string;
  version: string;
  status: string;
  summary: string;
  structured_at: string | null;
  error?: string | null;
};

export type AssetUploadInput = {
  workflowId: number;
  type: AssetType;
  name?: string;
  metadataJson?: Record<string, unknown> | null;
  file: File;
};
