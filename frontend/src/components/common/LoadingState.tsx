type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading workspace data...' }: LoadingStateProps) {
  return (
    <div className="panel flex min-h-40 items-center justify-center p-8 text-sm text-muted">
      {label}
    </div>
  );
}

