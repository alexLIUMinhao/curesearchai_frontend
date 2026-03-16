import { Tabs } from '../common/Tabs';
import { WORKFLOW_STAGE_OPTIONS } from '../../utils/constants';
import type { WorkflowStage } from '../../types/workflow';

type WorkflowFiltersProps = {
  value: WorkflowStage | 'all';
  onChange: (value: WorkflowStage | 'all') => void;
};

export function WorkflowFilters({ value, onChange }: WorkflowFiltersProps) {
  return <Tabs value={value} onChange={onChange} options={WORKFLOW_STAGE_OPTIONS} />;
}
