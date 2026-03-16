import { Button } from '../common/Button';

type ChatComposerProps = {
  value: string;
  sending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function ChatComposer({ value, sending, onChange, onSend }: ChatComposerProps) {
  return (
    <div className="border-t border-line p-5">
      <div className="rounded-[28px] border border-line bg-white p-3">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask for a diagnosis, a plan, a structured next action, or a cleaner framing of the problem."
          className="min-h-28 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 outline-none"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
        />
        <div className="flex items-center justify-between px-2 pb-1 pt-2">
          <div className="text-xs text-muted">Enter to send. Shift+Enter for a new line.</div>
          <Button onClick={onSend} disabled={sending || !value.trim()}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
