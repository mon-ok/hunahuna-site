// Shared loading / error / empty states so every fetch surfaces the same UX.

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  const message =
    error?.message || 'Something went wrong while loading. Please try again.'
  return (
    <div className="state state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--outline" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message = 'Nothing to show yet.' }) {
  return <div className="state">{message}</div>
}
