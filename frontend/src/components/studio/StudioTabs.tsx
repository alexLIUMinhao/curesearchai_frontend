import { Tabs } from '../common/Tabs';

export type StudioTabValue = 'tasks' | 'notes' | 'plan' | 'outline';

type StudioTabsProps = {
  value: StudioTabValue;
  onChange: (value: StudioTabValue) => void;
};

export function StudioTabs({ value, onChange }: StudioTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      options={[
        { label: 'Tasks', value: 'tasks' },
        { label: 'Notes', value: 'notes' },
        { label: 'Plan', value: 'plan' },
        { label: 'Outline', value: 'outline' },
      ]}
    />
  );
}
