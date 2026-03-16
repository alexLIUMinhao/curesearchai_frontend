import { Button } from './Button';

type ErrorStateProps = {
  title: string;
  description: string;
  onRetry?: () => void;
};

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="panel flex min-h-40 flex-col justify-center p-8">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
