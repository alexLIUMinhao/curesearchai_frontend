import { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Field } from '../common/Field';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { TextArea } from '../common/TextArea';
import { WORKFLOW_STATUSES } from '../../utils/constants';
import type { Workflow, WorkflowCreateInput, WorkflowStage, WorkflowStatus } from '../../types/workflow';

const stageOptions: Array<{ label: string; value: WorkflowStage }> = [
  { label: 'Idea', value: 'idea' },
  { label: 'Reading', value: 'reading' },
  { label: 'Experiment', value: 'experiment' },
  { label: 'Writing', value: 'writing' },
  { label: 'Rebuttal', value: 'rebuttal' },
];

type WorkflowModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue?: Workflow | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: WorkflowCreateInput) => Promise<void>;
};

export function WorkflowModal({ open, mode, initialValue, loading, onClose, onSubmit }: WorkflowModalProps) {
  const [projectId, setProjectId] = useState('default-project');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<WorkflowStage>('idea');
  const [status, setStatus] = useState<WorkflowStatus>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setProjectId(initialValue?.project_id || 'default-project');
    setName(initialValue?.name || '');
    setDescription(initialValue?.description || '');
    setStage(initialValue?.stage || 'idea');
    setStatus(initialValue?.status || 'active');
    setError(null);
  }, [initialValue, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Workflow name is required');
      return;
    }

    await onSubmit({
      project_id: projectId.trim() || 'default-project',
      name: name.trim(),
      description: description.trim(),
      stage,
      status,
    });
  };

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'New Workflow' : 'Edit Workflow'}
      description="Capture one research direction, then move it into sources, tasks, and notes."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? 'Saving...' : 'Save workflow'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Project ID" value={projectId} onChange={(event) => setProjectId(event.target.value)} />
        <Select
          label="Stage"
          value={stage}
          onChange={(event) => setStage(event.target.value as WorkflowStage)}
          options={stageOptions}
        />
        <div className="md:col-span-2">
          <Field label="Workflow name" value={name} onChange={(event) => setName(event.target.value)} error={error || undefined} />
        </div>
        <div className="md:col-span-2">
          <TextArea
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            hint="Briefly describe the research objective or bottleneck."
          />
        </div>
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as WorkflowStatus)}
          options={WORKFLOW_STATUSES.map((item) => ({ label: item, value: item }))}
        />
      </div>
    </Modal>
  );
}
