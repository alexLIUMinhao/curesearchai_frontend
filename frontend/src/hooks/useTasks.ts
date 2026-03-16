import { useEffect, useState } from 'react';
import * as tasksService from '../services/tasks';
import type { SuggestedTask } from '../types/chat';
import type { DraftTask, DraftTaskQueueItem, Task, TaskCreateInput, TaskUpdateInput } from '../types/task';

const defaultDraftTask: DraftTask = {
  title: '',
  description: '',
  related_claim: '',
  owner: '',
  priority: 'medium',
  status: 'todo',
};

export function useTasks(workflowId: number) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draftTask, setDraftTask] = useState<DraftTask>(defaultDraftTask);
  const [draftQueue, setDraftQueue] = useState<DraftTaskQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksService.listTasks(workflowId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [workflowId]);

  const createTask = async (payload: Omit<TaskCreateInput, 'workflow_id'>) => {
    const created = await tasksService.createTask({ ...payload, workflow_id: workflowId });
    setTasks((current) => [created, ...current]);
    setDraftTask(defaultDraftTask);
    return created;
  };

  const updateTask = async (id: number, payload: TaskUpdateInput) => {
    const updated = await tasksService.updateTask(id, payload);
    setTasks((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  };

  const deleteTask = async (id: number) => {
    await tasksService.deleteTask(id);
    setTasks((current) => current.filter((item) => item.id !== id));
  };

  const prefillDraftTask = (suggestion: SuggestedTask) => {
    setDraftTask({
      title: suggestion.title,
      description: suggestion.description || '',
      related_claim: '',
      owner: '',
      priority: 'medium',
      status: 'todo',
    });
  };

  const enqueueDraftTasks = (drafts: DraftTaskQueueItem[]) => {
    setDraftQueue((current) => [...current, ...drafts]);
  };

  const removeDraftQueueItem = (index: number) => {
    setDraftQueue((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const loadDraftIntoForm = (index: number) => {
    const item = draftQueue[index];
    if (!item) return;
    setDraftTask({
      title: item.title,
      description: item.description,
      related_claim: item.related_claim,
      owner: item.owner,
      priority: item.priority,
      status: item.status,
    });
  };

  const createDraftQueueItem = async (index: number) => {
    const item = draftQueue[index];
    if (!item) return null;
    const created = await createTask(item);
    removeDraftQueueItem(index);
    return created;
  };

  const createAllDraftQueueItems = async () => {
    for (const item of draftQueue) {
      // eslint-disable-next-line no-await-in-loop
      await createTask(item);
    }
    setDraftQueue([]);
  };

  return {
    tasks,
    loading,
    error,
    reload: load,
    createTask,
    updateTask,
    deleteTask,
    draftTask,
    setDraftTask,
    prefillDraftTask,
    draftQueue,
    setDraftQueue,
    enqueueDraftTasks,
    removeDraftQueueItem,
    loadDraftIntoForm,
    createDraftQueueItem,
    createAllDraftQueueItems,
  };
}
