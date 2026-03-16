import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage, ContextSource, SuggestedTask } from '../../types/chat';

type MessageListProps = {
  messages: ChatMessage[];
  suggestedTasksByMessageId: Record<number, SuggestedTask[]>;
  contextSourcesByMessageId: Record<number, ContextSource[]>;
  onAddTask: (task: SuggestedTask) => void;
  onRetryMessage: (messageId: number) => void;
  viewportRef: React.RefObject<HTMLDivElement>;
  onIdeaDirectionSelect?: (direction: 'migration' | 'improvement' | 'gap') => void;
  onIdeaTaskAction?: (action: 'generate_tasks' | 'keep_refining') => void;
};

export function MessageList({
  messages,
  suggestedTasksByMessageId,
  contextSourcesByMessageId,
  onAddTask,
  onRetryMessage,
  viewportRef,
  onIdeaDirectionSelect,
  onIdeaTaskAction,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < 72;
    };

    handleScroll();
    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [viewportRef]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !bottomRef.current) return;

    const shouldScroll = !hasInitializedRef.current || shouldAutoScrollRef.current;
    if (shouldScroll) {
      bottomRef.current.scrollIntoView({ behavior: hasInitializedRef.current ? 'smooth' : 'auto', block: 'end' });
    }
    hasInitializedRef.current = true;
  }, [messages, viewportRef]);

  return (
    <div className="space-y-4 px-5 py-5 pb-8">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          suggestions={suggestedTasksByMessageId[message.id]}
          contextSources={contextSourcesByMessageId[message.id]}
          hasContextInfo={Object.prototype.hasOwnProperty.call(contextSourcesByMessageId, message.id)}
          onAddTask={onAddTask}
          onRetryMessage={onRetryMessage}
          onIdeaDirectionSelect={onIdeaDirectionSelect}
          onIdeaTaskAction={onIdeaTaskAction}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
