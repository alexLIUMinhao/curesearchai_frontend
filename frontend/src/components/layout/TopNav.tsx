import { Link } from 'react-router-dom';
import { useAppContext } from '../../app/providers';

type TopNavProps = {
  showBackLink?: boolean;
};

export function TopNav({ showBackLink }: TopNavProps) {
  const { openSettings, settings, settingsLoading } = useAppContext();

  return (
    <header className="border-b border-line/80 bg-panel/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          {showBackLink ? (
            <Link to="/" className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition hover:bg-slate-50">
              Workspace
            </Link>
          ) : null}
          <div>
            <div className="text-lg font-semibold tracking-tight text-ink">CUResearch.ai</div>
            <p className="text-sm text-muted">Turn ideas into structured research actions.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openSettings}
          className="flex items-center gap-3 rounded-full border border-line bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accentSoft text-sm font-semibold text-accent">
            {(settings?.display_name || 'R').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-ink">{settingsLoading ? 'Loading...' : settings?.display_name || 'Researcher'}</div>
            <div className="text-xs text-muted">{settings?.role_title || settings?.organization || 'Workspace settings'}</div>
          </div>
          <div className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted">Settings</div>
        </button>
      </div>
    </header>
  );
}
