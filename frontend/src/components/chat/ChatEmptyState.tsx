import { CHAT_GUIDE_QUESTIONS } from '../../utils/prompts';

export function ChatEmptyState() {
  return (
    <div className="flex flex-col items-start px-5 py-8">
      <div className="panel-title">Start from research friction</div>
      <h3 className="mt-3 text-2xl font-semibold text-ink">Use chat to surface structure, not to bury it.</h3>
      <div className="mt-6 grid gap-3">
        {CHAT_GUIDE_QUESTIONS.map((question) => (
          <div key={question} className="rounded-3xl border border-dashed border-line bg-white px-4 py-3 text-sm text-muted">
            {question}
          </div>
        ))}
      </div>
    </div>
  );
}
