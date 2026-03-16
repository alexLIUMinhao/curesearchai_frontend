import { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Field } from '../common/Field';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { TextArea } from '../common/TextArea';
import { ASSET_TYPES } from '../../utils/constants';
import type { AssetType } from '../../types/asset';

type AssetUploadModalProps = {
  open: boolean;
  loading?: boolean;
  workflowId: number;
  onClose: () => void;
  onSubmit: (payload: {
    type: AssetType;
    name?: string;
    metadataJson?: Record<string, unknown> | null;
    file: File;
  }) => Promise<void>;
};

export function AssetUploadModal({ open, loading, workflowId, onClose, onSubmit }: AssetUploadModalProps) {
  const [type, setType] = useState<AssetType>('pdf');
  const [name, setName] = useState('');
  const [metadataText, setMetadataText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType('pdf');
    setName('');
    setMetadataText('');
    setFile(null);
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    if (!file) {
      setError('Please choose a file to upload');
      return;
    }

    let metadataJson: Record<string, unknown> | null | undefined = undefined;
    if (metadataText.trim()) {
      try {
        metadataJson = JSON.parse(metadataText);
      } catch {
        setError('Metadata must be valid JSON');
        return;
      }
    }

    await onSubmit({ type, name: name.trim() || undefined, metadataJson, file });
  };

  return (
    <Modal
      open={open}
      title="Add Source"
      description={`Upload evidence and working files into workflow #${workflowId}.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? 'Uploading...' : 'Upload source'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Workflow ID" value={String(workflowId)} readOnly />
        <Select
          label="Source type"
          value={type}
          onChange={(event) => setType(event.target.value as AssetType)}
          options={ASSET_TYPES.filter((item): item is AssetType => item !== 'all').map((item) => ({
            label: item,
            value: item,
          }))}
        />
        <Field label="Source name" value={name} onChange={(event) => setName(event.target.value)} />
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-ink">File</span>
          <input
            type="file"
            className="rounded-2xl border border-line bg-white px-4 py-3"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
        <TextArea
          label="Metadata JSON"
          value={metadataText}
          onChange={(event) => setMetadataText(event.target.value)}
          hint='Optional. Example: {"source":"arxiv","year":2025}'
          error={error || undefined}
        />
      </div>
    </Modal>
  );
}
