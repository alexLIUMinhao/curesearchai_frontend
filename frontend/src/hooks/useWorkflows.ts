import { useEffect, useMemo, useState } from 'react';
import * as workflowService from '../services/workflows';
import type { Workflow, WorkflowCreateInput, WorkflowStage, WorkflowUpdateInput } from '../types/workflow';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stageFilter, setStageFilter] = useState<WorkflowStage | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workflowService.listWorkflows();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredWorkflows = useMemo(
    () => (stageFilter === 'all' ? workflows : workflows.filter((item) => item.stage === stageFilter)),
    [stageFilter, workflows],
  );

  const createWorkflow = async (payload: WorkflowCreateInput) => {
    const workflow = await workflowService.createWorkflow(payload);
    setWorkflows((current) => [workflow, ...current]);
    return workflow;
  };

  const updateWorkflow = async (id: number, payload: WorkflowUpdateInput) => {
    const workflow = await workflowService.updateWorkflow(id, payload);
    setWorkflows((current) => current.map((item) => (item.id === id ? workflow : item)));
    return workflow;
  };

  const deleteWorkflow = async (id: number) => {
    await workflowService.deleteWorkflow(id);
    setWorkflows((current) => current.filter((item) => item.id !== id));
  };

  return {
    workflows,
    filteredWorkflows,
    stageFilter,
    setStageFilter,
    loading,
    error,
    reload: load,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
  };
}
