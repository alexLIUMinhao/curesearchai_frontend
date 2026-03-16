import { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import type { DraftTask, DraftTaskQueueItem, Task, TaskStatus } from '../../types/task';

type TasksPanelProps = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  draftTask: DraftTask;
  draftQueue: DraftTaskQueueItem[];
  setDraftTask: (draft: DraftTask) => void;
  reload: () => void;
  createTask: (payload: DraftTask) => Promise<unknown>;
  updateTask: (id: number, payload: Partial<DraftTask>) => Promise<unknown>;
  deleteTask: (id: number) => Promise<void>;
  removeDraftQueueItem: (index: number) => void;
  loadDraftIntoForm: (index: number) => void;
  createDraftQueueItem: (index: number) => Promise<unknown>;
  createAllDraftQueueItems: () => Promise<void>;
};

export function TasksPanel({
  tasks,
  loading,
  error,
  draftTask,
  draftQueue,
  setDraftTask,
  reload,
  createTask,
  updateTask,
  deleteTask,
  removeDraftQueueItem,
  loadDraftIntoForm,
  createDraftQueueItem,
  createAllDraftQueueItems,
}: TasksPanelProps) {
  const [showForm, setShowForm] = useState(tasks.length === 0 || Boolean(draftTask.title));
  const [submitting, setSubmitting] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (draftTask.title || draftTask.description) {
      setShowForm(true);
    }
  }, [draftTask.description, draftTask.title]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await createTask(draftTask);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    try {
      await deleteTask(deletingTaskId);
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="panel-title">Structured outputs</p>
          <p className="mt-2 text-sm text-muted">Convert conversation into owned, trackable research actions.</p>
        </div>
        <Button onClick={() => setShowForm((current) => !current)}>{showForm ? 'Hide form' : 'New Task'}</Button>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {draftQueue.length ? (
          <div className="mb-4 rounded-3xl border border-line bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-ink">Suggested tasks from Idea Builder</div>
                <p className="mt-1 text-sm text-muted">Review these drafts before moving them into the workflow task list.</p>
              </div>
              <Button variant="secondary" onClick={() => void createAllDraftQueueItems()}>
                Create all
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {draftQueue.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-2xl border border-line bg-white p-4">
                  <div className="font-medium text-ink">{item.title}</div>
                  {item.description ? <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p> : null}
                  {item.related_claim ? <p className="mt-2 text-sm text-muted">Claim: {item.related_claim}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => loadDraftIntoForm(index)}>
                      Load into form
                    </Button>
                    <Button onClick={() => void createDraftQueueItem(index)}>Create now</Button>
                    <Button variant="ghost" onClick={() => removeDraftQueueItem(index)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {showForm ? (
          <div className="mb-4">
            <TaskForm
              title="Create task"
              draft={draftTask}
              loading={submitting}
              submitLabel="Create task"
              onChange={setDraftTask}
              onSubmit={() => void handleCreate()}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : null}

        {loading ? <LoadingState label="Loading tasks..." /> : null}
        {!loading && error ? <ErrorState title="Unable to load tasks" description={error} onRetry={reload} /> : null}
        {!loading && !error && tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Use suggested tasks from chat or add one manually so the workflow has a visible execution trail."
          />
        ) : null}
        {!loading && !error && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={() => setDeletingTaskId(task.id)}
                onStatusChange={(status: TaskStatus) => void updateTask(task.id, { status })}
              />
            ))}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deletingTaskId)}
        title="Delete task?"
        description="This removes the task card from the current workflow."
        onCancel={() => setDeletingTaskId(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
