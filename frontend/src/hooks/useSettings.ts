import { useEffect, useState } from 'react';
import * as settingsService from '../services/settings';
import type { LLMRuntimeStatus, LLMTestRequest, UserSettings, UserSettingsUpdateInput } from '../types/settings';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [providers, setProviders] = useState(settingsService.FALLBACK_PROVIDER_OPTIONS);
  const [llmStatus, setLlmStatus] = useState<LLMRuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSettings, nextProviders] = await Promise.all([
        settingsService.getMySettings(),
        settingsService.listLLMProviders(),
      ]);
      setSettings(nextSettings);
      setProviders(nextProviders);
      try {
        setLlmStatus(await settingsService.getLLMStatus());
      } catch {
        setLlmStatus(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveSettings = async (payload: UserSettingsUpdateInput) => {
    setSaving(true);
    try {
      const nextSettings = await settingsService.updateMySettings(payload);
      setSettings(nextSettings);
      return nextSettings;
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (payload: LLMTestRequest) => {
    setTesting(true);
    try {
      const result = await settingsService.testLLMConnection(payload);
      setLlmStatus(result.llm_status);
      return result;
    } finally {
      setTesting(false);
    }
  };

  const refreshLLMStatus = async () => {
    const status = await settingsService.getLLMStatus();
    setLlmStatus(status);
    return status;
  };

  return {
    settings,
    providers,
    llmStatus,
    loading,
    saving,
    testing,
    error,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    reload: load,
    saveSettings,
    testConnection,
    refreshLLMStatus,
  };
}
