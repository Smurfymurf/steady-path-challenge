import { gameConfig } from '../config/game';

interface FailureOverlayProps {
  visible: boolean;
}

export function FailureOverlay({ visible }: FailureOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="failure-overlay" role="alert">
      <div>
        <h3 className="failure-overlay__title">Wall hit</h3>
        <p className="failure-overlay__body">{gameConfig.failureMessage}</p>
      </div>
    </div>
  );
}
