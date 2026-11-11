import { Box, Snackbar } from '@mui/material';
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
      autoHideDuration={duration ?? 6000}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') onClose();
      }}
      sx={{
        top: { xs: 4, sm: 4 },
        bottom: 'auto',
        left: { xs: '50%', sm: '50%' },
        right: 'auto',
        transform: 'translateX(-50%)',
        width: 'max-content',
        maxWidth: 'calc(100% - 24px)',
        minWidth: 0,
        pointerEvents: 'none',
        '& > *': {
          pointerEvents: 'none',
          '& button, & a': { pointerEvents: 'auto' },
          width: 'auto',
          maxWidth: '100%',
          maxHeight: { xs: appToolbarHeight.xs - 8, sm: appToolbarHeight.sm - 8 },
          overflowY: 'auto',
          boxShadow: '0 4px 16px #17202d26',
          borderRadius: 2.5,
        },
      }}
    >
      <Box>{children}</Box>
    </Snackbar>,
    document.body,
  );
}
