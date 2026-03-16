export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (sameDay) {
    return `Today, ${time}`;
  }

  const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
  return `${day}, ${time}`;
}

export function toSentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getWorkflowMockMetrics(workflowId: number) {
  return {
    taskCount: (workflowId * 3) % 7,
    assetCount: (workflowId * 5) % 9,
  };
}

