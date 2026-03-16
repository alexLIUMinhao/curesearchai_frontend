import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';
import { SettingsDrawer } from '../components/settings/SettingsDrawer';
import { useSettings } from '../hooks/useSettings';
import type { LLMRuntimeStatus, LLMTestRequest, UserSettings, UserSettingsUpdateInput } from '../types/settings';

type Toast = {
  id: number;
  title: string;
  tone?: 'default' | 'error';
};

type AppContextValue = {
  notify: (title: string, tone?: Toast['tone']) => void;
  settings: UserSettings | null;
  settingsLoading: boolean;
  settingsError: string | null;
  settingsDrawerOpen: boolean;
  llmStatus: LLMRuntimeStatus | null;
  openSettings: () => void;
  closeSettings: () => void;
  reloadSettings: () => Promise<void>;
  refreshLLMStatus: () => Promise<LLMRuntimeStatus>;
  saveSettings: (payload: UserSettingsUpdateInput) => Promise<UserSettings>;
  testLLMConnection: (payload: LLMTestRequest) => Promise<{ message: string }>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const settingsHook = useSettings();

  const notify = useCallback((title: string, tone: Toast['tone'] = 'default') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  return (
    <AppContext.Provider
      value={{
        notify,
        settings: settingsHook.settings,
        settingsLoading: settingsHook.loading,
        settingsError: settingsHook.error,
        settingsDrawerOpen: settingsHook.drawerOpen,
        llmStatus: settingsHook.llmStatus,
        openSettings: settingsHook.openDrawer,
        closeSettings: settingsHook.closeDrawer,
        reloadSettings: settingsHook.reload,
        refreshLLMStatus: settingsHook.refreshLLMStatus,
        saveSettings: settingsHook.saveSettings,
        testLLMConnection: settingsHook.testConnection,
      }}
    >
      {children}
      <SettingsDrawer
        open={settingsHook.drawerOpen}
        loading={settingsHook.loading}
        saving={settingsHook.saving}
        testing={settingsHook.testing}
        error={settingsHook.error}
        settings={settingsHook.settings}
        providers={settingsHook.providers}
        onClose={settingsHook.closeDrawer}
        onReload={() => void settingsHook.reload()}
        onSave={async (payload) => {
          const saved = await settingsHook.saveSettings(payload);
          notify('Settings saved');
          return saved;
        }}
        onTestConnection={async (payload) => {
          const result = await settingsHook.testConnection(payload);
          notify(result.message);
          return result;
        }}
      />
      <div className="pointer-events-none fixed right-6 top-6 z-50 flex w-80 flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`panel px-4 py-3 text-sm ${
              toast.tone === 'error' ? 'border-danger/30 text-danger' : 'text-ink'
            }`}
          >
            {toast.title}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProviders');
  }
  return context;
}
