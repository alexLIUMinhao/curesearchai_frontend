import { useEffect, useState } from 'react';
import * as workflowService from '../services/workflows';
import type { Workflow, WorkflowUpdateInput } from '../types/workflow';

export function useWorkflowDetail(workflowId: number) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workflowService.getWorkflow(workflowId);
      setWorkflow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [workflowId]);

  const updateWorkflow = async (payload: WorkflowUpdateInput) => {
    const next = await workflowService.updateWorkflow(workflowId, payload);
    setWorkflow(next);
    return next;
  };

  const deleteWorkflow = async () => {
    await workflowService.deleteWorkflow(workflowId);
  };

  return {
    workflow,
    loading,
    error,
    reload: load,
    updateWorkflow,
    deleteWorkflow,
  };
}
