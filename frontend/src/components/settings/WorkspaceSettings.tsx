import { Select } from '../common/Select';
import type { ChatMode } from '../../types/settings';

type WorkspaceSettingsProps = {
  defaultChatMode: ChatMode;
  onChange: (value: ChatMode) => void;
};

export function WorkspaceSettings({ defaultChatMode, onChange }: WorkspaceSettingsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">Workspace Preferences</h3>
        <p className="mt-1 text-sm text-muted">This default applies when you open Studio before any session override is set.</p>
      </div>
      <Select
        label="Default chat mode"
        value={defaultChatMode}
        onChange={(event) => onChange(event.target.value as ChatMode)}
        options={[
          { label: 'Mock', value: 'mock' },
          { label: 'Live', value: 'live' },
        ]}
      />
    </section>
  );
}
