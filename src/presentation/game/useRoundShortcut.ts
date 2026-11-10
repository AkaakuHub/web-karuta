import { useEffect, useEffectEvent } from 'react';

export function useRoundShortcut(onAction?: () => void | Promise<void>) {
  const enabled = onAction !== undefined;
  const advance = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey ||
      (event.key !== ' ' && event.key !== 'Enter') ||
      document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]') ||
      (event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="tab"], [role="combobox"]',
        ))
    )
      return;
    event.preventDefault();
    void onAction?.();
  });
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', advance);
    return () => window.removeEventListener('keydown', advance);
  }, [enabled]);
}
