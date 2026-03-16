import { useEffect, useRef, useState } from 'react';
import * as chatService from '../services/chat';
import type { ChatMessage, ChatRequestStatus, ChatSendResult, ContextSource, SuggestedTask } from '../types/chat';
import type { ChatMode, LLMRuntimeStatus } from '../types/settings';

type SuggestionsMap = Record<number, SuggestedTask[]>;
type ContextSourcesMap = Record<number, ContextSource[]>;
const MODEL_MODE_STORAGE_KEY = 'curesearch.chat.model_mode';

export function useChat(workflowId: number, defaultModelMode: ChatMode = 'mock') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestStatus, setLastRequestStatus] = useState<ChatRequestStatus>('idle');
  const [lastRequestError, setLastRequestError] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<LLMRuntimeStatus | null>(null);
  const [suggestedTasksByMessageId, setSuggestedTasksByMessageId] = useState<SuggestionsMap>({});
  const [contextSourcesByMessageId, setContextSourcesByMessageId] = useState<ContextSourcesMap>({});
  const [sessionModelMode, setSessionModelMode] = useState<ChatMode | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(MODEL_MODE_STORAGE_KEY);
    return stored === 'live' || stored === 'mock' ? stored : null;
  });
  const tempIdRef = useRef(-1);
  const modelMode = sessionModelMode ?? defaultModelMode;
  const hasSessionOverride = sessionModelMode !== null;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.getChatHistory(workflowId);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [workflowId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(MODEL_MODE_STORAGE_KEY);
    if (stored && stored === defaultModelMode) {
      window.localStorage.removeItem(MODEL_MODE_STORAGE_KEY);
      setSessionModelMode(null);
    }
  }, [defaultModelMode]);

  const sendText = async (
    text: string,
    existingMessageId?: number,
    modeHint: 'auto' | 'qa' | 'idea_builder' = 'auto',
  ) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return null;

    const pendingUserMessage: ChatMessage = existingMessageId
      ? {
          id: existingMessageId,
          workflow_id: workflowId,
          role: 'user',
          content: trimmed,
          created_at: new Date().toISOString(),
          pending: true,
          failed: false,
        }
      : {
          id: tempIdRef.current--,
          workflow_id: workflowId,
          role: 'user',
          content: trimmed,
          created_at: new Date().toISOString(),
          pending: true,
          failed: false,
        };

    setSending(true);
    setError(null);
    setLastRequestError(null);
    setLastRequestStatus('sending');
    console.debug('sending chat with use_mock=%s', modelMode === 'mock');

    setMessages((current) => {
      if (existingMessageId) {
        return current.map((item) => (item.id === existingMessageId ? pendingUserMessage : item));
      }
      return [...current, pendingUserMessage];
    });
    try {
      const result: ChatSendResult = await chatService.sendChatMessage({
        workflow_id: workflowId,
        message: trimmed,
        use_mock: modelMode === 'mock',
        mode_hint: modeHint,
      });

      setMessages((current) => {
        const withoutPending = current.filter((item) => item.id !== pendingUserMessage.id);
        return [...withoutPending, result.user_message, result.assistant_message];
      });

      if (result.optional_tasks.length > 0) {
        setSuggestedTasksByMessageId((current) => ({
          ...current,
          [result.assistant_message.id]: result.optional_tasks,
        }));
      }
      setContextSourcesByMessageId((current) => ({
        ...current,
        [result.assistant_message.id]: result.context_sources || [],
      }));
      setLlmStatus(result.llm_status);

      setLastRequestStatus('success');
      return result;
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Failed to send message';
      setMessages((current) =>
        current.map((item) =>
          item.id === pendingUserMessage.id
            ? {
                ...item,
                pending: false,
                failed: true,
              }
            : item,
        ),
      );
      if (!existingMessageId) {
        setComposerValue(trimmed);
      }
      setError(nextError);
      setLastRequestError(nextError);
      setLastRequestStatus('failed');
      throw err;
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (modeHint: 'auto' | 'qa' | 'idea_builder' = 'auto') => {
    const trimmed = composerValue.trim();
    if (!trimmed || sending) return null;
    setComposerValue('');
    return sendText(trimmed, undefined, modeHint);
  };

  const sendCustomMessage = async (message: string, modeHint: 'auto' | 'qa' | 'idea_builder' = 'auto') => {
    return sendText(message, undefined, modeHint);
  };

  const retryMessage = async (messageId: number) => {
    const message = messages.find((item) => item.id === messageId && item.failed);
    if (!message) return null;
    return sendText(message.content, messageId);
  };

  const setModelMode = (nextMode: ChatMode) => {
    if (typeof window === 'undefined') {
      setSessionModelMode(nextMode === defaultModelMode ? null : nextMode);
      return;
    }
    if (nextMode === defaultModelMode) {
      window.localStorage.removeItem(MODEL_MODE_STORAGE_KEY);
      setSessionModelMode(null);
      return;
    }
    window.localStorage.setItem(MODEL_MODE_STORAGE_KEY, nextMode);
    setSessionModelMode(nextMode);
  };

  return {
    messages,
    loading,
    sending,
    error,
    reload: load,
    composerValue,
    setComposerValue,
    sendMessage,
    retryMessage,
    suggestedTasksByMessageId,
    contextSourcesByMessageId,
    modelMode,
    setModelMode,
    hasSessionOverride,
    llmStatus,
    lastRequestStatus,
    lastRequestError,
    sendCustomMessage,
  };
}
