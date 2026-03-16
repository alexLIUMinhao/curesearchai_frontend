import type { ChatMessage } from './chat';
import type { Note } from './note';

export type AssetStructurerResult = {
  skill_name: string;
  version: string;
  status: string;
  source_type: string;
  summary: string;
  research_problem: string;
  method_overview: string;
  key_contributions: string[];
  datasets_or_materials: string[];
  evaluation_or_results: string[];
  limitations_or_risks: string[];
  useful_claims: string[];
  suggested_followups: string[];
  keywords: string[];
  structured_at: string | null;
  llm_mode: string;
  provider_label: string;
  model: string | null;
  error?: string | null;
};

export type AssetSkillRunResponse = {
  asset_id: number;
  skill_name: string;
  status: string;
  result: AssetStructurerResult;
  assistant_message: ChatMessage | null;
  memory_note: Note | null;
};

export type AssetSkillResult = {
  asset_id: number;
  skill_name: string;
  status: string;
  result: AssetStructurerResult;
};
