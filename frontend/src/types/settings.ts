export type ChatMode = 'mock' | 'live';
export type ProviderLabel = 'openai' | 'gemini' | 'qwen' | 'minimax' | 'kimi' | 'custom';
export type ProviderType = 'openai_compatible' | 'gemini';

export type UserSettings = {
  id: number;
  user_id: string;
  display_name: string;
  role_title: string | null;
  organization: string | null;
  default_project_id: string | null;
  default_chat_mode: ChatMode;
  llm_provider_label: ProviderLabel;
  llm_provider_type: ProviderType;
  llm_model: string | null;
  llm_base_url: string | null;
  llm_api_key_masked: string | null;
  llm_temperature: number;
  llm_timeout: number;
  llm_use_mock_default: boolean;
  created_at: string;
  updated_at: string | null;
};

export type UserSettingsUpdateInput = {
  display_name: string;
  role_title?: string | null;
  organization?: string | null;
  default_project_id?: string | null;
  default_chat_mode: ChatMode;
  llm_provider_label: ProviderLabel;
  llm_provider_type: ProviderType;
  llm_model?: string | null;
  llm_base_url?: string | null;
  llm_api_key?: string | null;
  llm_temperature: number;
  llm_timeout: number;
  llm_use_mock_default: boolean;
};

export type LLMProviderOption = {
  label: ProviderLabel;
  name: string;
  provider_type: ProviderType;
  default_model: string;
  default_base_url: string | null;
  requires_base_url: boolean;
  supports_temperature: boolean;
};

export type LLMTestRequest = {
  llm_provider_label: ProviderLabel;
  llm_provider_type: ProviderType;
  llm_model: string;
  llm_base_url?: string | null;
  llm_api_key?: string | null;
  llm_temperature: number;
  llm_timeout: number;
};

export type LLMTestResponse = {
  success: boolean;
  message: string;
  provider_label: ProviderLabel;
  provider_type: ProviderType;
  model: string;
  llm_status: LLMRuntimeStatus;
};

export type LLMRuntimeStatus = {
  connection_status: string;
  mode: string;
  provider_label: string;
  provider_type: string;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  heartbeat_at: string | null;
  last_error: string | null;
};
