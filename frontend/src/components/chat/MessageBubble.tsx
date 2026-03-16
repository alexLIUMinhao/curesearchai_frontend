import { SuggestedTaskCard } from './SuggestedTaskCard';
import { Button } from '../common/Button';
import { formatDateTime } from '../../utils/format';
import type { ChatMessage, ContextSource, SuggestedTask } from '../../types/chat';

type MessageBubbleProps = {
  message: ChatMessage;
  suggestions?: SuggestedTask[];
  onAddTask: (task: SuggestedTask) => void;
  onRetryMessage: (messageId: number) => void;
  onIdeaDirectionSelect?: (direction: 'migration' | 'improvement' | 'gap') => void;
  onIdeaTaskAction?: (action: 'generate_tasks' | 'keep_refining') => void;
  contextSources?: ContextSource[];
  hasContextInfo?: boolean;
};

function splitAssistantContent(content: string) {
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
  const main = lines.find((line) => !line.startsWith('下一步建议')) || content;
  const nextSteps = lines.filter((line) => /^\d+\./.test(line));
  return { main, nextSteps };
}

function parseStructuredSourceSummary(content: string) {
  if (!content.startsWith('[Structured Source Summary]')) return null;
  const lines = content.split('\n');
  const sections: Record<string, string[]> = {};
  let currentSection = 'header';
  sections[currentSection] = [];

  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.endsWith(':') && !trimmed.startsWith('Source:')) {
      currentSection = trimmed.slice(0, -1);
      sections[currentSection] = sections[currentSection] || [];
      continue;
    }
    sections[currentSection] = sections[currentSection] || [];
    sections[currentSection].push(trimmed);
  }

  return {
    source: sections.header?.find((line) => line.startsWith('Source:'))?.replace('Source:', '').trim() || '',
    summary: (sections.Summary || []).join(' '),
    researchProblem: (sections['Research Problem'] || []).join(' '),
    methodOverview: (sections['Method Overview'] || []).join(' '),
    keyContributions: sections['Key Contributions'] || [],
    usefulClaims: sections['Useful Claims'] || [],
    suggestedFollowups: sections['Suggested Follow-ups'] || [],
  };
}

function parseSectionCard(content: string, prefix: string) {
  if (!content.startsWith(prefix)) return null;
  const lines = content.split('\n');
  const sections: Record<string, string[]> = {};
  let currentSection = 'header';
  sections[currentSection] = [];

  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.endsWith(':')) {
      currentSection = trimmed.slice(0, -1);
      sections[currentSection] = sections[currentSection] || [];
      continue;
    }
    sections[currentSection] = sections[currentSection] || [];
    sections[currentSection].push(trimmed);
  }

  return sections;
}

export function MessageBubble({
  message,
  suggestions,
  onAddTask,
  onRetryMessage,
  onIdeaDirectionSelect,
  onIdeaTaskAction,
  contextSources,
  hasContextInfo,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const parsed = !isUser ? splitAssistantContent(message.content) : null;
  const structured = !isUser ? parseStructuredSourceSummary(message.content) : null;
  const ideaKickoff = !isUser ? parseSectionCard(message.content, '[Idea Builder Kickoff]') : null;
  const deepResearch = !isUser ? parseSectionCard(message.content, '[Deep Research Snapshot]') : null;
  const directionOptions = !isUser ? parseSectionCard(message.content, '[Idea Direction Options]') : null;
  const taskCheck = !isUser ? parseSectionCard(message.content, '[Task Generation Check]') : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-[28px] px-4 py-4 ${
          isUser
            ? message.failed
              ? 'border border-danger/40 bg-red-50 text-ink'
              : 'bg-ink text-white'
            : 'border border-line bg-white text-ink'
        }`}
      >
        <div className="text-xs uppercase tracking-[0.14em] text-current/60">{message.role}</div>
        {isUser ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
        ) : structured ? (
          <div className="mt-3 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-muted">Structured Source Summary</div>
              <div className="mt-1 text-sm font-medium text-ink">{structured.source}</div>
            </div>
            <section>
              <div className="text-xs uppercase tracking-[0.12em] text-muted">Summary</div>
              <p className="mt-2 text-sm leading-6 text-ink">{structured.summary}</p>
            </section>
            <section>
              <div className="text-xs uppercase tracking-[0.12em] text-muted">Research Problem</div>
              <p className="mt-2 text-sm leading-6 text-ink">{structured.researchProblem}</p>
            </section>
            <section>
              <div className="text-xs uppercase tracking-[0.12em] text-muted">Method Overview</div>
              <p className="mt-2 text-sm leading-6 text-ink">{structured.methodOverview}</p>
            </section>
            {structured.keyContributions.length ? (
              <section>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">Key Contributions</div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                  {structured.keyContributions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {structured.usefulClaims.length ? (
              <section>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">Useful Claims</div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                  {structured.usefulClaims.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {structured.suggestedFollowups.length ? (
              <section>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">Suggested Follow-ups</div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                  {structured.suggestedFollowups.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : ideaKickoff ? (
          <div className="mt-3 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-muted">Idea Builder</div>
              <div className="mt-1 text-sm font-medium text-ink">{(ideaKickoff.Phase || []).join(' ') || 'Kickoff'}</div>
            </div>
            {(ideaKickoff['Structured Sources'] || []).length ? (
              <section>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">Structured Sources</div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                  {(ideaKickoff['Structured Sources'] || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {(ideaKickoff['Why this matters'] || []).length ? (
              <section>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">Why this matters</div>
                <p className="mt-2 text-sm leading-6 text-ink">{(ideaKickoff['Why this matters'] || []).join(' ')}</p>
              </section>
            ) : null}
            {(ideaKickoff.Questions || []).length ? (
              <section>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">Questions</div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                  {(ideaKickoff.Questions || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : deepResearch ? (
          <div className="mt-3 space-y-4">
            <div className="text-xs uppercase tracking-[0.12em] text-muted">Deep Research Snapshot</div>
            {(['Current understanding', 'Evidence gathered', 'Gaps', 'Promising directions', 'Risks'] as const).map((section) => (
              <section key={section}>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">{section}</div>
                {section === 'Current understanding' ? (
                  <p className="mt-2 text-sm leading-6 text-ink">{(deepResearch[section] || []).join(' ')}</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                    {(deepResearch[section] || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        ) : directionOptions ? (
          <div className="mt-3 space-y-4">
            <div className="text-xs uppercase tracking-[0.12em] text-muted">Choose a direction</div>
            {([
              ['迁移型', 'migration'],
              ['改进型', 'improvement'],
              ['挖坑型', 'gap'],
            ] as const).map(([label, value]) => (
              <section key={value} className="rounded-2xl border border-line bg-slate-50 p-3">
                <div className="text-sm font-medium text-ink">{label}</div>
                <p className="mt-2 text-sm leading-6 text-muted">{(directionOptions[label] || []).join(' ')}</p>
                {onIdeaDirectionSelect ? (
                  <div className="mt-3">
                    <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => onIdeaDirectionSelect(value)}>
                      Choose {label}
                    </Button>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        ) : taskCheck ? (
          <div className="mt-3 space-y-4">
            <div className="text-xs uppercase tracking-[0.12em] text-muted">Task Generation Check</div>
            {(taskCheck.Recommendation || []).length ? (
              <section>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">Recommendation</div>
                <p className="mt-2 text-sm leading-6 text-ink">{(taskCheck.Recommendation || []).join(' ')}</p>
              </section>
            ) : null}
            {onIdeaTaskAction ? (
              <div className="flex flex-wrap gap-2">
                <Button className="px-3 py-1 text-xs" onClick={() => onIdeaTaskAction('generate_tasks')}>
                  Generate Tasks
                </Button>
                <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => onIdeaTaskAction('keep_refining')}>
                  Keep Refining
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-6">{parsed?.main}</p>
            {parsed?.nextSteps.length ? (
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-muted">Next steps</div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                  {parsed.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {suggestions?.length
              ? suggestions.map((task) => <SuggestedTaskCard key={`${message.id}-${task.title}`} task={task} onAdd={onAddTask} />)
              : null}
          </div>
        )}
        {!isUser && hasContextInfo ? (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">
            Context:{' '}
            {contextSources && contextSources.length > 0
              ? contextSources.map((item) => item.name).join(', ')
              : 'no specific source matched'}
          </div>
        ) : null}
        <div className={`mt-4 flex items-center justify-between gap-3 text-xs ${isUser && !message.failed ? 'text-white/60' : 'text-muted'}`}>
          <span>
            {message.pending ? 'Sending...' : message.failed ? 'Send failed' : formatDateTime(message.created_at)}
          </span>
          {message.failed ? (
            <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => onRetryMessage(message.id)}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
