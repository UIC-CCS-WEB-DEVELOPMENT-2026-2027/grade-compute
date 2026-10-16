export default function ToggleSetting({
  enabled,
  onToggle,
  enabledLabel = 'On',
  disabledLabel = 'Off',
  label,
}) {
  return (
    <button
      type="button"
      className={enabled ? 'toggle-button on' : 'toggle-button'}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
    >
      {enabled ? enabledLabel : disabledLabel}
    </button>
  );
}