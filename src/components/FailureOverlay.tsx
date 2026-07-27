interface FailureOverlayProps {
  visible: boolean;
  title?: string;
  message: string;
}

export function FailureOverlay({
  visible,
  title = 'Wall hit',
  message,
}: FailureOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="failure-overlay" role="alert">
      <div>
        <h3 className="failure-overlay__title">{title}</h3>
        <p className="failure-overlay__body">{message}</p>
      </div>
    </div>
  );
}
