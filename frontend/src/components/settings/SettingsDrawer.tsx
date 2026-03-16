import { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import { ProfileSettings } from './ProfileSettings';
import { WorkspaceSettings } from './WorkspaceSettings';
import { ModelSettings } from './ModelSettings';
import type { LLMProviderOption, LLMTestRequest, UserSettings, UserSettingsUpdateInput } from '../../types/settings';

type SettingsDrawerProps = {
  open: boolean;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  error: string | null;
  settings: UserSettings | null;
  providers: LLMProviderOption[];
  onClose: () => void;
  onReload: () => void;
  onSave: (payload: UserSettingsUpdateInput) => Promise<unknown>;
  onTestConnection: (payload: LLMTestRequest) => Promise<{ message: string }>;
};

function buildFormState(settings: UserSettings): UserSettingsUpdateInput {
  return {
    display_name: settings.display_name,
    role_title: settings.role_title || '',
    organization: settings.organization || '',
    default_project_id: settings.default_project_id || '',
    default_chat_mode: settings.default_chat_mode,
    llm_provider_label: settings.llm_provider_label,
    llm_provider_type: settings.llm_provider_type,
    llm_model: settings.llm_model || '',
    llm_base_url: settings.llm_base_url || '',
    llm_api_key: '',
    llm_temperature: settings.llm_temperature,
    llm_timeout: settings.llm_timeout,
    llm_use_mock_default: settings.llm_use_mock_default,
  };
}

export function SettingsDrawer({
  open,
  loading,
  saving,
  testing,
  error,
  settings,
  providers,
  onClose,
  onReload,
  onSave,
  onTestConnection,
}: SettingsDrawerProps) {
  const [formState, setFormState] = useState<UserSettingsUpdateInput | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ tone: 'success' | 'danger' | 'neutral'; message: string } | null>(null);

  useEffect(() => {
    if (open && settings) {
      setFormState(buildFormState(settings));
      setShowApiKey(false);
      setTestResult(null);
    }
  }, [open, settings]);

  const handleSave = async () => {
    if (!formState) return;
    await onSave({
      ...formState,
      role_title: formState.role_title?.trim() || null,
      organization: formState.organization?.trim() || null,
      default_project_id: formState.default_project_id?.trim() || null,
      llm_model: formState.llm_model?.trim() || null,
      llm_base_url: formState.llm_base_url?.trim() || null,
      llm_api_key: formState.llm_api_key?.trim() || null,
    });
  };

  const handleTest = async () => {
    if (!formState || !formState.llm_model) {
      setTestResult({ tone: 'danger', message: 'Model is required before testing the connection.' });
      return;
    }
    try {
      const result = await onTestConnection({
        llm_provider_label: formState.llm_provider_label,
        llm_provider_type: formState.llm_provider_type,
        llm_model: formState.llm_model,
        llm_base_url: formState.llm_base_url || null,
        llm_api_key: formState.llm_api_key?.trim() || null,
        llm_temperature: formState.llm_temperature,
        llm_timeout: formState.llm_timeout,
      });
      setTestResult({ tone: 'success', message: result.message });
    } catch (err) {
      setTestResult({ tone: 'danger', message: err instanceof Error ? err.message : 'Connection test failed.' });
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-slate-900/30 transition ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-line bg-panel shadow-2xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <p className="panel-title">Settings</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">User and model configuration</h2>
            <p className="mt-2 text-sm text-muted">
              Configure your profile, default workspace behavior, and the provider stack used by live chat.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {loading ? <LoadingState label="Loading settings..." /> : null}
          {!loading && error ? (
            <ErrorState title="Unable to load settings" description={error} onRetry={() => void onReload()} />
          ) : null}
          {!loading && !error && settings && formState ? (
            <div className="space-y-8">
              <ProfileSettings
                displayName={formState.display_name}
                roleTitle={formState.role_title || ''}
                organization={formState.organization || ''}
                defaultProjectId={formState.default_project_id || ''}
                onChange={(field, value) => setFormState((current) => (current ? { ...current, [field]: value } : current))}
              />
              <WorkspaceSettings
                defaultChatMode={formState.default_chat_mode}
                onChange={(value) => setFormState((current) => (current ? { ...current, default_chat_mode: value } : current))}
              />
              <ModelSettings
                providers={providers}
                value={formState}
                apiKeyMasked={settings.llm_api_key_masked}
                showApiKey={showApiKey}
                testing={testing}
                testResult={testResult}
                onChange={(value) => setFormState(value)}
                onToggleApiKey={() => setShowApiKey((current) => !current)}
                onTest={() => void handleTest()}
              />
            </div>
          ) : null}
        </div>

        <div className="border-t border-line px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">Session-level Mock / Live overrides stay in the Studio header and do not rewrite these defaults.</p>
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={!formState || saving || loading}>
                {saving ? 'Saving...' : 'Save settings'}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
