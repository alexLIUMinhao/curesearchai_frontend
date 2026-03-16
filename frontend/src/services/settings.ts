import { request } from './api';
import type { LLMProviderOption, LLMRuntimeStatus, LLMTestRequest, LLMTestResponse, UserSettings, UserSettingsUpdateInput } from '../types/settings';

export const FALLBACK_PROVIDER_OPTIONS: LLMProviderOption[] = [
  {
    label: 'openai',
    name: 'OpenAI',
    provider_type: 'openai_compatible',
    default_model: 'gpt-4o-mini',
    default_base_url: 'https://api.openai.com/v1',
    requires_base_url: true,
    supports_temperature: true,
  },
  {
    label: 'gemini',
    name: 'Gemini',
    provider_type: 'gemini',
    default_model: 'gemini-2.0-flash',
    default_base_url: null,
    requires_base_url: false,
    supports_temperature: true,
  },
  {
    label: 'qwen',
    name: 'Qwen',
    provider_type: 'openai_compatible',
    default_model: 'qwen-plus',
    default_base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    requires_base_url: true,
    supports_temperature: true,
  },
  {
    label: 'minimax',
    name: 'MiniMax',
    provider_type: 'openai_compatible',
    default_model: 'MiniMax-Text-01',
    default_base_url: 'https://api.minimax.chat/v1',
    requires_base_url: true,
    supports_temperature: true,
  },
  {
    label: 'kimi',
    name: 'Kimi',
    provider_type: 'openai_compatible',
    default_model: 'moonshot-v1-8k',
    default_base_url: 'https://api.moonshot.cn/v1',
    requires_base_url: true,
    supports_temperature: true,
  },
  {
    label: 'custom',
    name: 'Custom OpenAI-compatible',
    provider_type: 'openai_compatible',
    default_model: 'custom-model',
    default_base_url: 'https://your-endpoint.example/v1',
    requires_base_url: true,
    supports_temperature: true,
  },
];

export function getMySettings() {
  return request<UserSettings>('/api/settings/me');
}

export function updateMySettings(payload: UserSettingsUpdateInput) {
  return request<UserSettings>('/api/settings/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function listLLMProviders() {
  try {
    return await request<LLMProviderOption[]>('/api/settings/llm/providers');
  } catch {
    return FALLBACK_PROVIDER_OPTIONS;
  }
}

export function testLLMConnection(payload: LLMTestRequest) {
  return request<LLMTestResponse>('/api/settings/llm/test', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getLLMStatus() {
  return request<LLMRuntimeStatus>('/api/settings/llm/status');
}
