import { Tabs } from '../common/Tabs';
import { ASSET_TYPES } from '../../utils/constants';
import { toSentenceCase } from '../../utils/format';
import type { AssetType } from '../../types/asset';

type AssetFiltersProps = {
  value: AssetType | 'all';
  onChange: (value: AssetType | 'all') => void;
};

export function AssetFilters({ value, onChange }: AssetFiltersProps) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      options={ASSET_TYPES.map((item) => ({ label: toSentenceCase(item), value: item }))}
    />
  );
}
