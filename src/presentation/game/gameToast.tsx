import { Snackbar } from '@mui/material';
import { createPortal } from 'react-dom';
import type { ReactElement } from 'react';
import { appToolbarHeight } from '../shared/playLayout.js';

export function GameToast({
  open,
  onClose,
  duration,
  children,
}: {
  open: boolean;
  onClose: () => void;
  duration?: number;
  children: ReactElement;
}) {
  return createPortal(
    <Snackbar
      open={open}
      autoHideDuration={duration ?? null}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') onClose();
      }}
      sx={{
        top: { xs: 4, sm: 4 },
        bottom: 'auto',
        width: 'min(560px, calc(100% - 16px))',
        minWidth: 0,
        pointerEvents: 'none',
        '& > *': {
          pointerEvents: 'auto',
          width: '100%',
          maxHeight: { xs: appToolbarHeight.xs - 8, sm: appToolbarHeight.sm - 8 },
          overflowY: 'auto',
          boxShadow: 8,
          borderRadius: 2,
        },
      }}
    >
      {children}
    </Snackbar>,
    document.body,
  );
}
