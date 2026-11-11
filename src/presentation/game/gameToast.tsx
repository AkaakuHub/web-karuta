import CloseRounded from '@mui/icons-material/CloseRounded';
import { Box, IconButton, Snackbar } from '@mui/material';
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
          pointerEvents: 'none',
          bgcolor: 'background.paper',
          '& button, & a': { pointerEvents: 'auto' },
          width: '100%',
          maxHeight: { xs: appToolbarHeight.xs - 8, sm: appToolbarHeight.sm - 8 },
          overflowY: 'auto',
          boxShadow: 8,
          borderRadius: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 0, '& > *': { minWidth: 0, boxShadow: 'none' } }}>
          {children}
        </Box>
        <IconButton
          aria-label="通知を閉じる"
          size="small"
          onClick={onClose}
          sx={{ flexShrink: 0, mx: 0.25 }}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      </Box>
    </Snackbar>,
    document.body,
  );
}
