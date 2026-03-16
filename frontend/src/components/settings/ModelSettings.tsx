import { Button } from '../common/Button';
import { Field } from '../common/Field';
import { Select } from '../common/Select';
import type { LLMProviderOption, ProviderLabel, UserSettingsUpdateInput } from '../../types/settings';
import { ConnectionStatus } from './ConnectionStatus';

type ModelSettingsProps = {
  providers: LLMProviderOption[];
  value: UserSettingsUpdateInput;
  apiKeyMasked: string | null;
  showApiKey: boolean;
  testing: boolean;
  testResult: { tone: 'success' | 'danger' | 'neutral'; message: string } | null;
  onChange: (value: UserSettingsUpdateInput) => void;
  onToggleApiKey: () => void;
  onTest: () => void;
};

export function ModelSettings({
  providers,
  value,
  apiKeyMasked,
  showApiKey,
  testing,
  testResult,
  onChange,
  onToggleApiKey,
  onTest,
}: ModelSettingsProps) {
  const selectedProvider =
    providers.find((item) => item.label === value.llm_provider_label) ||
    providers.find((item) => item.label === 'openai') ||
    providers[0];
  const usesBaseUrl = selectedProvider?.provider_type === 'openai_compatible';

  const handleProviderChange = (nextLabel: ProviderLabel) => {
    const nextProvider = providers.find((item) => item.label === nextLabel);
    if (!nextProvider) return;
    onChange({
      ...value,
      llm_provider_label: nextProvider.label,
      llm_provider_type: nextProvider.provider_type,
      llm_model: nextProvider.default_model,
      llm_base_url: nextProvider.default_base_url,
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">Model Settings</h3>
        <p className="mt-1 text-sm text-muted">
          Save a provider, model, and credential set for this user. GPT, Qwen, MiniMax, and Kimi route through
          OpenAI-compatible mode. Gemini uses its native API path.
        </p>
      </div>

      <div className="grid gap-4">
        <Select
          label="Provider"
          value={value.llm_provider_label}
          onChange={(event) => handleProviderChange(event.target.value as ProviderLabel)}
          options={providers.map((provider) => ({ label: provider.name, value: provider.label }))}
        />
        <Field label="Model" value={value.llm_model || ''} onChange={(event) => onChange({ ...value, llm_model: event.target.value })} />
        {usesBaseUrl ? (
          <Field
            label="Base URL"
            value={value.llm_base_url || ''}
            onChange={(event) => onChange({ ...value, llm_base_url: event.target.value })}
            hint="Required for OpenAI-compatible providers."
          />
        ) : null}
        <Field
          label="API Key"
          type={showApiKey ? 'text' : 'password'}
          value={value.llm_api_key || ''}
          placeholder={apiKeyMasked || 'Enter a provider key'}
          onChange={(event) => onChange({ ...value, llm_api_key: event.target.value })}
          hint={apiKeyMasked ? 'Leave blank to keep the saved key.' : 'Saved in the backend settings table for this single-user MVP.'}
          suffix={
            <Button type="button" variant="secondary" onClick={onToggleApiKey} className="shrink-0">
              {showApiKey ? 'Hide' : 'Show'}
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={String(value.llm_temperature)}
            onChange={(event) => onChange({ ...value, llm_temperature: Number(event.target.value || 0) })}
          />
          <Field
            label="Timeout (seconds)"
            type="number"
            min="1"
            max="600"
            value={String(value.llm_timeout)}
            onChange={(event) => onChange({ ...value, llm_timeout: Number(event.target.value || 60) })}
          />
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-line"
            checked={value.llm_use_mock_default}
            onChange={(event) => onChange({ ...value, llm_use_mock_default: event.target.checked })}
          />
          <span>
            Use mock by default
            <span className="mt-1 block text-xs text-muted">
              Keeps Studio usable without live provider credentials. The Studio header can still override this per session.
            </span>
          </span>
        </label>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={onTest} disabled={testing}>
            {testing ? 'Testing...' : 'Test connection'}
          </Button>
          <span className="text-xs text-muted">Tests the currently visible provider settings against the backend connector.</span>
        </div>
        {testResult ? <ConnectionStatus tone={testResult.tone} message={testResult.message} /> : null}
      </div>
    </section>
  );
}
