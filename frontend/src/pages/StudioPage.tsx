import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { StudioLayout } from '../components/layout/StudioLayout';
import { AssetsPanel } from '../components/assets/AssetsPanel';
import { ChatPanel } from '../components/chat/ChatPanel';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { WorkflowLLMStatus } from '../components/workflow/WorkflowLLMStatus';
import { WorkflowModal } from '../components/workflow/WorkflowModal';
import { NotesPanel } from '../components/studio/NotesPanel';
import { PlaceholderPanel } from '../components/studio/PlaceholderPanel';
import { StudioTabs, type StudioTabValue } from '../components/studio/StudioTabs';
import { TasksPanel } from '../components/studio/TasksPanel';
import { useAppContext } from '../app/providers';
import { useAssets } from '../hooks/useAssets';
import { useChat } from '../hooks/useChat';
import { useIdeaBuilder } from '../hooks/useIdeaBuilder';
import { useNotes } from '../hooks/useNotes';
import { useTasks } from '../hooks/useTasks';
import { useWorkflowDetail } from '../hooks/useWorkflowDetail';
import { runAssetSkill } from '../services/skills';
import type { SuggestedTask } from '../types/chat';
import type { WorkflowCreateInput } from '../types/workflow';

export function StudioPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { notify, settings, llmStatus, refreshLLMStatus } = useAppContext();
  const workflowId = Number(params.workflowId);
  const [activeTab, setActiveTab] = useState<StudioTabValue>('tasks');
  const [editWorkflowOpen, setEditWorkflowOpen] = useState(false);
  const [deletingWorkflowOpen, setDeletingWorkflowOpen] = useState(false);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [structuringAssets, setStructuringAssets] = useState(false);

  const workflowHook = useWorkflowDetail(workflowId);
  const assetsHook = useAssets(workflowId);
  const chatHook = useChat(workflowId, settings?.default_chat_mode || 'mock');
  const ideaBuilderHook = useIdeaBuilder(workflowId);
  const tasksHook = useTasks(workflowId);
  const notesHook = useNotes(workflowId);

  const handleSend = async () => {
    try {
      const result = await chatHook.sendMessage('auto');
      if (result?.route === 'idea_builder' && result.task_drafts.length) {
        tasksHook.enqueueDraftTasks(result.task_drafts.map((item) => ({ ...item, source: 'idea_builder' })));
        setActiveTab('tasks');
        notify('Idea Builder prepared task drafts in the right panel');
      }
      await ideaBuilderHook.reload();
      if (!chatHook.llmStatus) {
        await refreshLLMStatus().catch(() => null);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to send message', 'error');
    }
  };

  const handlePrefillTask = (task: SuggestedTask) => {
    tasksHook.prefillDraftTask(task);
    setActiveTab('tasks');
    notify('Suggested task moved into the task form');
  };

  const handleStructureAsset = async (assetIds: number[]) => {
    if (assetIds.length === 0) return;
    setStructuringAssets(true);
    try {
      const results = [];
      for (const assetId of assetIds) {
        results.push(await runAssetSkill(assetId));
      }
      await Promise.all([
        assetsHook.reload(),
        chatHook.reload(),
        notesHook.reload(),
      ]);
      if (results.some((item) => item.status === 'completed')) {
        try {
          await ideaBuilderHook.start();
          await Promise.all([chatHook.reload(), notesHook.reload(), ideaBuilderHook.reload()]);
          notify('Sources structured. Idea Builder has started in chat.');
        } catch (error) {
          notify(error instanceof Error ? error.message : 'Idea Builder could not be started', 'error');
        }
      }
      notify(
        results.every((item) => item.status === 'completed')
          ? `Structured ${results.length} source${results.length > 1 ? 's' : ''} into chat and notes`
          : results.find((item) => item.status !== 'completed')?.result.error || 'Structuring finished with a non-success status',
        results.every((item) => item.status === 'completed') ? 'default' : 'error',
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to structure source', 'error');
    } finally {
      setStructuringAssets(false);
    }
  };

  const handleWorkflowUpdate = async (payload: WorkflowCreateInput) => {
    setSavingWorkflow(true);
    try {
      await workflowHook.updateWorkflow(payload);
      notify('Workflow updated');
      setEditWorkflowOpen(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to update workflow', 'error');
      throw error;
    } finally {
      setSavingWorkflow(false);
    }
  };

  const handleWorkflowDelete = async () => {
    try {
      await workflowHook.deleteWorkflow();
      notify('Workflow deleted');
      navigate('/');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to delete workflow', 'error');
    }
  };

  if (!workflowId || Number.isNaN(workflowId)) {
    return (
      <AppShell showBackLink>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <ErrorState title="Invalid workflow" description="The requested workflow id is missing or malformed." />
        </div>
      </AppShell>
    );
  }

  if (workflowHook.loading && !workflowHook.workflow) {
    return (
      <AppShell showBackLink>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <LoadingState label="Loading studio..." />
        </div>
      </AppShell>
    );
  }

  if (workflowHook.error || !workflowHook.workflow) {
    return (
      <AppShell showBackLink>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <ErrorState
            title="Unable to open workflow"
            description={workflowHook.error || 'This workflow no longer exists.'}
            onRetry={() => void workflowHook.reload()}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showBackLink>
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1">
          <StudioLayout
            left={
              <div className="flex h-full min-h-0 flex-col gap-4">
                <section className="panel shrink-0 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="panel-title">Workflow</p>
                      <h1 className="mt-3 text-2xl font-semibold text-ink">{workflowHook.workflow.name}</h1>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        {workflowHook.workflow.description || 'No description yet.'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="accent">{workflowHook.workflow.stage}</Badge>
                    <Badge tone={workflowHook.workflow.status === 'done' ? 'success' : 'neutral'}>
                      {workflowHook.workflow.status}
                    </Badge>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <Button variant="secondary" onClick={() => setEditWorkflowOpen(true)}>
                      Edit workflow
                    </Button>
                    <Button variant="ghost" className="text-danger hover:bg-red-50" onClick={() => setDeletingWorkflowOpen(true)}>
                      Delete
                    </Button>
                  </div>
                </section>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <AssetsPanel
                    workflowId={workflowId}
                    assetsHook={assetsHook}
                    onStructureAsset={(assetIds) => handleStructureAsset(assetIds)}
                    structuringAssets={structuringAssets}
                  />
                </div>
              </div>
            }
            center={
              <div className="h-full min-h-0">
                <ChatPanel
                  workflow={workflowHook.workflow}
                  messages={chatHook.messages}
                  loading={chatHook.loading}
                  sending={chatHook.sending}
                  error={chatHook.error}
                  composerValue={chatHook.composerValue}
                  onComposerChange={chatHook.setComposerValue}
                  onSend={() => void handleSend()}
                  onPickPrompt={chatHook.setComposerValue}
                  onRetry={() => void chatHook.reload()}
                  suggestedTasksByMessageId={chatHook.suggestedTasksByMessageId}
                  contextSourcesByMessageId={chatHook.contextSourcesByMessageId}
                  onAddTask={handlePrefillTask}
                  onRetryMessage={(messageId) => void chatHook.retryMessage(messageId)}
                  modelMode={chatHook.modelMode}
                  defaultModelMode={settings?.default_chat_mode || 'mock'}
                  hasSessionOverride={chatHook.hasSessionOverride}
                  onModelModeChange={chatHook.setModelMode}
                  lastRequestStatus={chatHook.lastRequestStatus}
                  lastRequestError={chatHook.lastRequestError}
                  ideaBuilderPhase={ideaBuilderHook.state.phase}
                  ideaBuilderActive={ideaBuilderHook.isActive}
                  onRestartIdeaBuilder={() => {
                    void (async () => {
                      try {
                        await ideaBuilderHook.start(true);
                        await Promise.all([chatHook.reload(), notesHook.reload(), ideaBuilderHook.reload()]);
                        notify('Idea Builder restarted');
                      } catch (error) {
                        notify(error instanceof Error ? error.message : 'Unable to restart Idea Builder', 'error');
                      }
                    })();
                  }}
                  onPauseIdeaBuilder={() => {
                    void (async () => {
                      try {
                        await ideaBuilderHook.act('pause');
                        await Promise.all([chatHook.reload(), notesHook.reload(), ideaBuilderHook.reload()]);
                        notify('Idea Builder paused');
                      } catch (error) {
                        notify(error instanceof Error ? error.message : 'Unable to pause Idea Builder', 'error');
                      }
                    })();
                  }}
                  onIdeaDirectionSelect={(direction) => {
                    void (async () => {
                      try {
                        const textMap = {
                          migration: '迁移型',
                          improvement: '改进型',
                          gap: '挖坑型',
                        } as const;
                        const result = await chatHook.sendCustomMessage(textMap[direction], 'idea_builder');
                        if (result?.task_drafts.length) {
                          tasksHook.enqueueDraftTasks(result.task_drafts.map((item) => ({ ...item, source: 'idea_builder' })));
                          setActiveTab('tasks');
                        }
                        await Promise.all([chatHook.reload(), notesHook.reload(), ideaBuilderHook.reload()]);
                      } catch (error) {
                        notify(error instanceof Error ? error.message : 'Unable to choose an idea direction', 'error');
                      }
                    })();
                  }}
                  onIdeaTaskAction={(action) => {
                    void (async () => {
                      try {
                        const text = action === 'generate_tasks' ? 'Generate Tasks' : 'Keep Refining';
                        const result = await chatHook.sendCustomMessage(text, 'idea_builder');
                        if (result?.task_drafts.length) {
                          tasksHook.enqueueDraftTasks(result.task_drafts.map((item) => ({ ...item, source: 'idea_builder' })));
                          setActiveTab('tasks');
                          notify('Idea Builder prepared task drafts in the right panel');
                        }
                        await Promise.all([chatHook.reload(), notesHook.reload(), ideaBuilderHook.reload()]);
                      } catch (error) {
                        notify(error instanceof Error ? error.message : 'Unable to continue Idea Builder', 'error');
                      }
                    })();
                  }}
                />
              </div>
            }
            right={
              <section className="panel flex h-full flex-col p-5">
                <StudioTabs value={activeTab} onChange={setActiveTab} />
                <div className="mt-5 min-h-0 flex-1 overflow-hidden">
                  {activeTab === 'tasks' ? (
                    <TasksPanel
                      tasks={tasksHook.tasks}
                      loading={tasksHook.loading}
                      error={tasksHook.error}
                      draftTask={tasksHook.draftTask}
                      draftQueue={tasksHook.draftQueue}
                      setDraftTask={tasksHook.setDraftTask}
                      reload={() => void tasksHook.reload()}
                      createTask={(payload) => tasksHook.createTask(payload)}
                      updateTask={(id, payload) => tasksHook.updateTask(id, payload)}
                      deleteTask={(id) => tasksHook.deleteTask(id)}
                      removeDraftQueueItem={tasksHook.removeDraftQueueItem}
                      loadDraftIntoForm={tasksHook.loadDraftIntoForm}
                      createDraftQueueItem={(index) => tasksHook.createDraftQueueItem(index)}
                      createAllDraftQueueItems={() => tasksHook.createAllDraftQueueItems()}
                    />
                  ) : null}
                  {activeTab === 'notes' ? (
                    <NotesPanel
                      notes={notesHook.notes}
                      loading={notesHook.loading}
                      error={notesHook.error}
                      reload={() => void notesHook.reload()}
                      createNote={(payload) => notesHook.createNote(payload)}
                      updateNote={(id, payload) => notesHook.updateNote(id, payload)}
                      deleteNote={(id) => notesHook.deleteNote(id)}
                    />
                  ) : null}
                  {activeTab === 'plan' ? (
                    <PlaceholderPanel
                      title="Experiment Plan"
                      description="This panel will host structured experiment plans generated from chat and research runs."
                      blocks={['Hypothesis', 'Variables', 'Evaluation']}
                    />
                  ) : null}
                  {activeTab === 'outline' ? (
                    <PlaceholderPanel
                      title="Paper / Proposal Outline"
                      description="This panel will host structured writing blocks derived from notes and conversations."
                      blocks={['Problem', 'Method', 'Evidence', 'Open Questions']}
                    />
                  ) : null}
                </div>
              </section>
            }
          />
        </div>
        <div className="shrink-0 px-4 pb-4">
          <WorkflowLLMStatus status={chatHook.llmStatus || llmStatus} />
        </div>
      </div>

      <WorkflowModal
        open={editWorkflowOpen}
        mode="edit"
        initialValue={workflowHook.workflow}
        loading={savingWorkflow}
        onClose={() => setEditWorkflowOpen(false)}
        onSubmit={handleWorkflowUpdate}
      />

      <ConfirmDialog
        open={deletingWorkflowOpen}
        title="Delete workflow?"
        description="This will remove the workflow and send you back to the workspace index."
        onCancel={() => setDeletingWorkflowOpen(false)}
        onConfirm={() => void handleWorkflowDelete()}
      />
    </AppShell>
  );
}
