import { Box, Snackbar } from '@mui/material';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { appToolbarHeight } from './playLayout.js';

interface Notice {
  id: string;
  content: ReactElement;
  onClose?: () => void;
}
export const ToastContext = createContext<{
  show: (id: string, content: ReactElement, onClose?: () => void) => void;
  hide: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const hide = useCallback((id: string) => {
    setNotice((current) => (current?.id === id ? null : current));
  }, []);
  const show = useCallback((id: string, content: ReactElement, onClose?: () => void) => {
    setNotice((current) => (current?.id === id ? current : { id, content, onClose }));
  }, []);
  const close = useCallback(() => {
    notice?.onClose?.();
    if (notice) hide(notice.id);
  }, [notice, hide]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(close, 4000);
    return () => clearTimeout(timer);
  }, [notice, close]);
  const value = useMemo(() => ({ show, hide }), [show, hide]);
  return (
    <ToastContext value={value}>
      {children}
      {createPortal(
        <Snackbar
          open={!!notice}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={(_, reason) => {
            if (reason !== 'clickaway') close();
          }}
          sx={{
            top: { xs: appToolbarHeight.xs / 2, sm: appToolbarHeight.sm / 2 },
            bottom: 'auto',
            left: { xs: '50%', sm: '50%' },
            right: 'auto',
            transform: 'translate(-50%, -50%)',
            width: 'max-content',
            maxWidth: 'calc(100% - 24px)',
            minWidth: 0,
            pointerEvents: 'none',
            '& .MuiAlert-root, & .MuiSnackbarContent-root': { alignItems: 'center', py: 0 },
            '& .MuiAlert-root .MuiAlert-icon, & .MuiAlert-root .MuiAlert-action': {
              my: 0,
              py: 0,
              alignItems: 'center',
            },
            '& .MuiAlert-root .MuiAlert-message, & .MuiSnackbarContent-root .MuiSnackbarContent-message':
              {
                py: 0.75,
                minWidth: 0,
              },
            '& > *': {
              pointerEvents: 'none',
              '& button, & a': { pointerEvents: 'auto' },
              width: 'auto',
              maxWidth: '100%',
              maxHeight: { xs: appToolbarHeight.xs - 8, sm: appToolbarHeight.sm - 8 },
              overflowY: 'auto',
              boxShadow: '0 4px 16px #17202d26',
              borderRadius: 1,
            },
          }}
        >
          <Box>{notice?.content}</Box>
        </Snackbar>,
        document.body,
      )}
    </ToastContext>
  );
}
