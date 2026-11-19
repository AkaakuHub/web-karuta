import { useContext, useEffect, useId, useRef, type ReactElement } from 'react';
import { ToastContext } from '../shared/toastProvider.js';

export function useGameToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('ToastProviderがありません');
  return toast;
}

export function GameToast({
  open,
  onClose,
  children,
  persistent = false,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactElement;
  persistent?: boolean;
}) {
  const { show, hide } = useGameToast();
  const id = useId();
  const content = useRef({ children, onClose });
  content.current = { children, onClose };
  useEffect(() => {
    if (!open) return;
    show(id, content.current.children, () => content.current.onClose?.(), persistent);
    return () => hide(id);
  }, [open, id, show, hide, persistent]);
  return null;
}
