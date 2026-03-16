import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { WorkflowCard } from '../components/workflow/WorkflowCard';
import { WorkflowFilters } from '../components/workflow/WorkflowFilters';
import { WorkflowModal } from '../components/workflow/WorkflowModal';
import { useWorkflows } from '../hooks/useWorkflows';
import { useAppContext } from '../app/providers';
import type { Workflow, WorkflowCreateInput } from '../types/workflow';

export function WorkspacePage() {
  const navigate = useNavigate();
  const { notify } = useAppContext();
  const workflowsHook = useWorkflows();
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

  const pageDescription = useMemo(
    () =>
      'A research workspace should start with a workflow, not a blank chat. Choose a direction, then move it into sources, analysis, tasks, and notes.',
    [],
  );

  const openCreate = () => {
    setWorkflowModalOpen(true);
    setModalMode('create');
    setEditingWorkflow(null);
  };

  const openEdit = (workflow: Workflow) => {
    setWorkflowModalOpen(true);
    setModalMode('edit');
    setEditingWorkflow(workflow);
  };

  const handleSubmit = async (payload: WorkflowCreateInput) => {
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const created = await workflowsHook.createWorkflow(payload);
        notify('Workflow created');
        setWorkflowModalOpen(false);
        navigate(`/studio/${created.id}`);
      } else if (editingWorkflow) {
        await workflowsHook.updateWorkflow(editingWorkflow.id, payload);
        notify('Workflow updated');
        setWorkflowModalOpen(false);
        setEditingWorkflow(null);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save workflow', 'error');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWorkflow) return;
    try {
      await workflowsHook.deleteWorkflow(deletingWorkflow.id);
      notify('Workflow deleted');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to delete workflow', 'error');
    } finally {
      setDeletingWorkflow(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="panel-title">Workspace</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Turn open questions into visible research systems.</h1>
            <p className="mt-4 text-base leading-7 text-muted">{pageDescription}</p>
          </div>
          <Button className="w-fit" onClick={openCreate}>
            New Workflow
          </Button>
        </section>

        <section className="mb-6">
          <WorkflowFilters value={workflowsHook.stageFilter} onChange={workflowsHook.setStageFilter} />
        </section>

        {workflowsHook.loading ? <LoadingState label="Loading workflows..." /> : null}
        {!workflowsHook.loading && workflowsHook.error ? (
          <ErrorState
            title="Unable to load workflows"
            description={workflowsHook.error}
            onRetry={() => void workflowsHook.reload()}
          />
        ) : null}
        {!workflowsHook.loading && !workflowsHook.error && workflowsHook.filteredWorkflows.length === 0 ? (
          <EmptyState
            title="Start with a workflow, not a blank chat."
            description="Capture one research direction, then move it into sources, tasks, and notes."
            action={<Button onClick={openCreate}>Create first workflow</Button>}
          />
        ) : null}
        {!workflowsHook.loading && !workflowsHook.error && workflowsHook.filteredWorkflows.length > 0 ? (
          <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {workflowsHook.filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onOpen={() => navigate(`/studio/${workflow.id}`)}
                onEdit={() => openEdit(workflow)}
                onDelete={() => setDeletingWorkflow(workflow)}
              />
            ))}
          </section>
        ) : null}
      </div>

      <WorkflowModal
        open={workflowModalOpen}
        mode={modalMode}
        initialValue={editingWorkflow}
        loading={submitting}
        onClose={() => {
          setWorkflowModalOpen(false);
          setEditingWorkflow(null);
          setModalMode('create');
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingWorkflow)}
        title="Delete workflow?"
        description="This removes the workflow shell from the workspace index."
        onCancel={() => setDeletingWorkflow(null)}
        onConfirm={() => void handleDelete()}
      />
    </AppShell>
  );
}
