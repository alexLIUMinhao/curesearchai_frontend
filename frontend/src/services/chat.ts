import { request } from './api';
import { mockChatHistory } from './mock';
import type { ChatMessage, ChatSendPayload, ChatSendResult } from '../types/chat';

export async function getChatHistory(workflowId: number): Promise<ChatMessage[]> {
  try {
    return await request<ChatMessage[]>(`/api/chat/history/${workflowId}`);
  } catch {
    return mockChatHistory;
  }
}

export function sendChatMessage(payload: ChatSendPayload) {
  return request<ChatSendResult>('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
