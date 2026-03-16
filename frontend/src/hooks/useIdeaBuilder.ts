import { useEffect, useState } from 'react';
import * as ideaBuilderService from '../services/ideaBuilder';
import type { IdeaBuilderAction, IdeaBuilderRespondPayload, IdeaBuilderRunResponse, IdeaBuilderState, IdeaDirectionChoice } from '../types/ideaBuilder';

const idleState = (workflowId: number): IdeaBuilderState => ({
  workflow_id: workflowId,
  phase: 'idle',
  maturity_score: 0,
  direction_choice: null,
  can_generate_tasks: false,
  memory_note_id: null,
  task_generation_status: 'not_requested',
});

export function useIdeaBuilder(workflowId: number) {
  const [state, setState] = useState<IdeaBuilderState>(idleState(workflowId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ideaBuilderService.getIdeaBuilderState(workflowId);
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Idea Builder state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [workflowId]);

  const start = async (restart = false) => {
    setRunning(true);
    setError(null);
    try {
      const result = await ideaBuilderService.startIdeaBuilder(workflowId, restart);
      setState(result.state);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Idea Builder');
      throw err;
    } finally {
      setRunning(false);
    }
  };

  const respond = async (payload: Omit<IdeaBuilderRespondPayload, 'workflow_id'>) => {
    setRunning(true);
    setError(null);
    try {
      const result: IdeaBuilderRunResponse = await ideaBuilderService.respondIdeaBuilder({
        workflow_id: workflowId,
        ...payload,
      });
      setState(result.state);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue Idea Builder');
      throw err;
    } finally {
      setRunning(false);
    }
  };

  return {
    state,
    loading,
    error,
    running,
    isActive: !['idle', 'completed'].includes(state.phase),
    reload: load,
    start,
    respond,
    chooseDirection: (direction: IdeaDirectionChoice) => respond({ direction_choice: direction }),
    act: (action: IdeaBuilderAction) => respond({ action }),
  };
}
