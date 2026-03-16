import { Field } from '../common/Field';

type ProfileSettingsProps = {
  displayName: string;
  roleTitle: string;
  organization: string;
  defaultProjectId: string;
  onChange: (field: 'display_name' | 'role_title' | 'organization' | 'default_project_id', value: string) => void;
};

export function ProfileSettings({
  displayName,
  roleTitle,
  organization,
  defaultProjectId,
  onChange,
}: ProfileSettingsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">Profile</h3>
        <p className="mt-1 text-sm text-muted">Keep lightweight identity and default project context here.</p>
      </div>
      <div className="grid gap-4">
        <Field label="Display name" value={displayName} onChange={(event) => onChange('display_name', event.target.value)} />
        <Field label="Role / Title" value={roleTitle} onChange={(event) => onChange('role_title', event.target.value)} />
        <Field label="Organization" value={organization} onChange={(event) => onChange('organization', event.target.value)} />
        <Field
          label="Default project id"
          value={defaultProjectId}
          onChange={(event) => onChange('default_project_id', event.target.value)}
          hint="Used as the default project shell when you create new workflows."
        />
      </div>
    </section>
  );
}
