import type { ReactNode } from 'react';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import MenuRounded from '@mui/icons-material/MenuRounded';
import { appToolbarHeight } from './playLayout.js';

export function AppToolbar({
  title,
  onMenu,
  children,
}: {
  title: string;
  onMenu: () => void;
  children: ReactNode;
}) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: appToolbarHeight,
          px: { xs: 0.75, sm: 1.5 },
          gap: 1,
          width: '100%',
          maxWidth: 1800,
          mx: 'auto',
        }}
      >
        <IconButton
          aria-label="メニューを開く"
          onClick={onMenu}
          sx={{ borderRadius: 1, flexShrink: 0 }}
        >
          <MenuRounded />
        </IconButton>
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: 16, sm: 20 },
            whiteSpace: 'nowrap',
            flexShrink: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </Typography>
        {children}
      </Toolbar>
    </AppBar>
  );
}
